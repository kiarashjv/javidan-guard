import { mutation, query } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";
import { logAudit } from "./lib/audit";
import { checkAndRecordContribution } from "./lib/rateLimit";
import { adjustTrustScore, recordVerification } from "./lib/trustScore";

const EXPIRES_IN_DAYS = 30;

function requiredVerificationsForTrust(trustScore: number) {
  if (trustScore >= 80) {
    return 2;
  }
  if (trustScore >= 50) {
    return 3;
  }
  return 4;
}

export const listPending = query({
  args: {
    targetCollection: v.union(
      v.literal("regimeMembers"),
      v.literal("victims"),
      v.literal("actions")
    ),
  },
  handler: async (ctx, args) => {
    const pending = await ctx.db
      .query("pendingUpdates")
      .filter((q) => q.eq(q.field("targetCollection"), args.targetCollection))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
    return pending.sort((a, b) => b.proposedAt - a.proposedAt);
  },
});

export const listPendingForTarget = query({
  args: {
    targetCollection: v.union(
      v.literal("regimeMembers"),
      v.literal("victims"),
      v.literal("actions")
    ),
    targetId: v.union(
      v.id("regimeMembers"),
      v.id("victims"),
      v.id("actions")
    ),
  },
  handler: async (ctx, args) => {
    const pending = await ctx.db
      .query("pendingUpdates")
      .filter((q) => q.eq(q.field("targetCollection"), args.targetCollection))
      .filter((q) => q.eq(q.field("targetId"), args.targetId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();
    return pending.sort((a, b) => b.proposedAt - a.proposedAt);
  },
});

export const proposeUpdate = mutation({
  args: {
    targetCollection: v.union(
      v.literal("regimeMembers"),
      v.literal("victims"),
      v.literal("actions")
    ),
    targetId: v.union(
      v.id("regimeMembers"),
      v.id("victims"),
      v.id("actions")
    ),
    proposedChanges: v.string(),
    reason: v.string(),
    proposedBy: v.string(),
    ipHash: v.string(),
    userAgent: v.string(),
  },
  handler: async (ctx, args) => {
    await checkAndRecordContribution(ctx, args.proposedBy);
    const now = Date.now();
    const expiresAt = now + EXPIRES_IN_DAYS * 24 * 60 * 60 * 1000;
    const targetSnapshot = await ctx.db.get(args.targetId);
    const proposer = await ctx.db
      .query("sessions")
      .filter((q) => q.eq(q.field("sessionId"), args.proposedBy))
      .first();
    const requiredVerifications = proposer
      ? requiredVerificationsForTrust(proposer.trustScore)
      : 3;

    if (!targetSnapshot) {
      throw new Error("Target record not found.");
    }

    let parsedChanges: Record<string, unknown>;
    try {
      parsedChanges = JSON.parse(args.proposedChanges) as Record<string, unknown>;
    } catch {
      throw new Error("Invalid proposed changes.");
    }

    const proposedKeys = new Set(Object.keys(parsedChanges));
    if (proposedKeys.size === 0) {
      throw new Error("No proposed changes provided.");
    }

    const existingPending = await ctx.db
      .query("pendingUpdates")
      .filter((q) => q.eq(q.field("targetCollection"), args.targetCollection))
      .filter((q) => q.eq(q.field("targetId"), args.targetId))
      .filter((q) => q.eq(q.field("status"), "pending"))
      .collect();

    for (const pending of existingPending) {
      let existingChanges: Record<string, unknown>;
      try {
        existingChanges = JSON.parse(pending.proposedChanges) as Record<string, unknown>;
      } catch {
        continue;
      }
      for (const key of Object.keys(existingChanges)) {
        if (proposedKeys.has(key)) {
          throw new Error(
            "A pending update already exists for one or more requested fields."
          );
        }
      }
    }

    const id = await ctx.db.insert("pendingUpdates", {
      targetCollection: args.targetCollection,
      targetId: args.targetId,
      proposedChanges: args.proposedChanges,
      requiredVerifications,
      currentVerifications: 0,
      verifiedBySessions: [],
      status: "pending",
      proposedBy: args.proposedBy,
      proposedAt: now,
      expiresAt,
      reason: args.reason,
      targetSnapshot: JSON.stringify(targetSnapshot),
    });

    await logAudit(ctx, {
      action: "update",
      collection: "pendingUpdates",
      documentId: id,
      changes: args.proposedChanges,
      sessionId: args.proposedBy,
      ipHash: args.ipHash,
      userAgent: args.userAgent,
      reason: args.reason,
    });

    await adjustTrustScore(ctx, args.proposedBy, 1);

    return id;
  },
});

export const verifyUpdate = mutation({
  args: {
    pendingUpdateId: v.id("pendingUpdates"),
    sessionId: v.string(),
    ipHash: v.string(),
    userAgent: v.string(),
  },
  handler: async (ctx, args) => {
    await checkAndRecordContribution(ctx, args.sessionId);
    const pendingUpdate = await ctx.db.get(args.pendingUpdateId);

    if (!pendingUpdate) {
      throw new Error("Pending update not found.");
    }

    if (pendingUpdate.status !== "pending") {
      throw new Error("Pending update is not active.");
    }

    if (pendingUpdate.verifiedBySessions.includes(args.sessionId)) {
      throw new Error("Session has already verified this update.");
    }

    const updatedSessions = [...pendingUpdate.verifiedBySessions, args.sessionId];
    const updatedCount = pendingUpdate.currentVerifications + 1;

    await ctx.db.patch(args.pendingUpdateId, {
      verifiedBySessions: updatedSessions,
      currentVerifications: updatedCount,
    });

    await logAudit(ctx, {
      action: "verify",
      collection: "pendingUpdates",
      documentId: args.pendingUpdateId,
      changes: JSON.stringify({ verifiedBy: args.sessionId }),
      sessionId: args.sessionId,
      ipHash: args.ipHash,
      userAgent: args.userAgent,
      reason: "verification",
    });

    await recordVerification(ctx, args.sessionId);
    await adjustTrustScore(ctx, args.sessionId, 1);

    if (updatedCount >= pendingUpdate.requiredVerifications) {
      await approveUpdate(ctx, args.pendingUpdateId, pendingUpdate);
    }

    return updatedCount;
  },
});

async function approveUpdate(
  ctx: MutationCtx,
  pendingUpdateId: Id<"pendingUpdates">,
  pendingUpdate: Doc<"pendingUpdates">
) {
  const target = await ctx.db.get(pendingUpdate.targetId);
  if (!target) {
    throw new Error("Target record not found for approval.");
  }

  const proposed = JSON.parse(pendingUpdate.proposedChanges) as Record<string, unknown>;

  if (pendingUpdate.targetCollection === "regimeMembers") {
    const typedTarget = target as Doc<"regimeMembers">;
    const newDocId = await ctx.db.insert("regimeMembers", {
      ...typedTarget,
      ...proposed,
      currentVersion: true,
      supersededBy: null,
      previousVersions: [...typedTarget.previousVersions, typedTarget._id],
    });
    await ctx.db.patch(pendingUpdate.targetId as Id<"regimeMembers">, {
      currentVersion: false,
      supersededBy: newDocId,
    });
  } else if (pendingUpdate.targetCollection === "victims") {
    const typedTarget = target as Doc<"victims">;
    const newDocId = await ctx.db.insert("victims", {
      ...typedTarget,
      ...proposed,
      currentVersion: true,
      supersededBy: null,
      previousVersions: [...typedTarget.previousVersions, typedTarget._id],
    });
    await ctx.db.patch(pendingUpdate.targetId as Id<"victims">, {
      currentVersion: false,
      supersededBy: newDocId,
    });
  } else {
    const typedTarget = target as Doc<"actions">;
    const newDocId = await ctx.db.insert("actions", {
      ...typedTarget,
      ...proposed,
      currentVersion: true,
      supersededBy: null,
      previousVersions: [...typedTarget.previousVersions, typedTarget._id],
    });
    await ctx.db.patch(pendingUpdate.targetId as Id<"actions">, {
      currentVersion: false,
      supersededBy: newDocId,
    });
  }

  await ctx.db.patch(pendingUpdateId, {
    status: "approved",
  });
}

export const rejectUpdate = mutation({
  args: {
    pendingUpdateId: v.id("pendingUpdates"),
    sessionId: v.string(),
    ipHash: v.string(),
    userAgent: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const pendingUpdate = await ctx.db.get(args.pendingUpdateId);

    if (!pendingUpdate) {
      throw new Error("Pending update not found.");
    }

    await ctx.db.patch(args.pendingUpdateId, {
      status: "rejected",
    });

    await logAudit(ctx, {
      action: "reject",
      collection: "pendingUpdates",
      documentId: args.pendingUpdateId,
      changes: JSON.stringify({ reason: args.reason }),
      sessionId: args.sessionId,
      ipHash: args.ipHash,
      userAgent: args.userAgent,
      reason: args.reason,
    });

    await adjustTrustScore(ctx, args.sessionId, -2);

    return true;
  },
});
