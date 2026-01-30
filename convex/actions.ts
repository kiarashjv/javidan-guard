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
import { actionCreateSchema } from "./lib/validation";

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
    return resolveCurrentAction(ctx, args.id);
  },
});

async function resolveCurrentAction(ctx: QueryCtx, id: GenericId<"actions">) {
  let current = await ctx.db.get(id);
  let hops = 0;
  while (
    current &&
    current.currentVersion === false &&
    current.supersededBy &&
    hops < 5
  ) {
    current = await ctx.db.get(current.supersededBy as GenericId<"actions">);
    hops += 1;
  }
  return current;
}

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
    const parsed = actionCreateSchema.parse({
      ...args,
      perpetratorId: args.perpetratorId,
      victimIds: args.victimIds,
    });

    const id = await ctx.db.insert("actions", {
      perpetratorId: parsed.perpetratorId,
      victimIds: parsed.victimIds,
      date: parsed.date,
      location: parsed.location,
      description: parsed.description,
      actionType: parsed.actionType,
      evidenceUrls: parsed.evidenceUrls,
      videoLinks: parsed.videoLinks,
      documentLinks: parsed.documentLinks,
      witnessStatements: parsed.witnessStatements,
      createdAt: now,
      createdBySession: parsed.createdBySession,
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
        actionType: parsed.actionType,
        date: parsed.date,
        location: parsed.location,
      }),
      sessionId: parsed.createdBySession,
      ipHash: parsed.ipHash,
      userAgent: parsed.userAgent,
      reason: parsed.reason,
    });

    await adjustTrustScore(ctx, parsed.createdBySession, 1);

    return id;
  },
});
