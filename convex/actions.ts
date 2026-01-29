import {
  mutationGeneric,
  queryGeneric,
  type GenericDataModel,
  type GenericMutationCtx,
  type GenericQueryCtx,
} from "convex/server";
import { v, type GenericId } from "convex/values";
import { logAudit } from "./lib/audit";
import { checkAndRecordContribution } from "./lib/rateLimit";
import { adjustTrustScore } from "./lib/trustScore";

type DataModel = GenericDataModel;
type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;

export const listCurrent = queryGeneric({
  args: {},
  handler: async (ctx: QueryCtx) => {
    return ctx.db
      .query("actions")
      .filter((q) => q.eq(q.field("currentVersion"), true))
      .collect();
  },
});

export const getById = queryGeneric({
  args: { id: v.id("actions") },
  handler: async (ctx: QueryCtx, args: { id: GenericId<"actions"> }) => {
    return ctx.db.get(args.id);
  },
});

export const create = mutationGeneric({
  args: {
    perpetratorId: v.id("regimeMembers"),
    victimIds: v.array(v.id("victims")),
    date: v.string(),
    location: v.string(),
    description: v.string(),
    actionType: v.union(
      v.literal("killing"),
      v.literal("torture"),
      v.literal("arrest"),
      v.literal("assault"),
      v.literal("other")
    ),
    evidenceUrls: v.array(v.string()),
    videoLinks: v.array(v.string()),
    documentLinks: v.array(v.string()),
    witnessStatements: v.array(v.string()),
    createdBySession: v.string(),
    ipHash: v.string(),
    userAgent: v.string(),
    reason: v.string(),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      perpetratorId: GenericId<"regimeMembers">;
      victimIds: GenericId<"victims">[];
      date: string;
      location: string;
      description: string;
      actionType: "killing" | "torture" | "arrest" | "assault" | "other";
      evidenceUrls: string[];
      videoLinks: string[];
      documentLinks: string[];
      witnessStatements: string[];
      createdBySession: string;
      ipHash: string;
      userAgent: string;
      reason: string;
    }
  ) => {
    await checkAndRecordContribution(ctx, args.createdBySession);
    const now = Date.now();

    const id = await ctx.db.insert("actions", {
      perpetratorId: args.perpetratorId,
      victimIds: args.victimIds,
      date: args.date,
      location: args.location,
      description: args.description,
      actionType: args.actionType,
      evidenceUrls: args.evidenceUrls,
      videoLinks: args.videoLinks,
      documentLinks: args.documentLinks,
      witnessStatements: args.witnessStatements,
      createdAt: now,
      createdBySession: args.createdBySession,
      currentVersion: true,
      supersededBy: null,
      verificationCount: 0,
      previousVersions: [],
    });

    await logAudit(ctx, {
      action: "create",
      collection: "actions",
      documentId: id,
      changes: JSON.stringify({
        actionType: args.actionType,
        date: args.date,
        location: args.location,
      }),
      sessionId: args.createdBySession,
      ipHash: args.ipHash,
      userAgent: args.userAgent,
      reason: args.reason,
    });

    await adjustTrustScore(ctx, args.createdBySession, 1);

    return id;
  },
});
