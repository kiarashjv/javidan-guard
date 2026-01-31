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
import { regimeMemberCreateSchema } from "./lib/validation";

type DataModel = GenericDataModel;
type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;

export const listCurrent = queryGeneric({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx: QueryCtx, args: { limit?: number }) => {
    const limit = args.limit ?? 20;
    return ctx.db
      .query("regimeMembers")
      .withIndex("by_current_version", (q) => q.eq("currentVersion", true))
      .order("desc")
      .take(limit);
  },
});

export const getById = queryGeneric({
  args: { id: v.id("regimeMembers") },
  handler: async (
    ctx: QueryCtx,
    args: { id: GenericId<"regimeMembers"> }
  ) => {
    return resolveCurrentRegimeMember(ctx, args.id);
  },
});

async function resolveCurrentRegimeMember(
  ctx: QueryCtx,
  id: GenericId<"regimeMembers">
) {
  let current = await ctx.db.get(id);
  let hops = 0;
  while (
    current &&
    current.currentVersion === false &&
    current.supersededBy &&
    hops < 5
  ) {
    current = await ctx.db.get(current.supersededBy as GenericId<"regimeMembers">);
    hops += 1;
  }
  return current;
}

export const create = mutationGeneric({
  args: {
    name: v.string(),
    aliases: v.array(v.string()),
    photoUrls: v.array(v.string()),
    organization: v.string(),
    unit: v.string(),
    position: v.string(),
    rank: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("arrested"),
      v.literal("fled"),
      v.literal("deceased"),
      v.literal("unknown")
    ),
    lastKnownLocation: v.string(),
    createdBySession: v.string(),
    ipHash: v.string(),
    userAgent: v.string(),
    reason: v.string(),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      name: string;
      aliases: string[];
      photoUrls: string[];
      organization: string;
      unit: string;
      position: string;
      rank: string;
      status: "active" | "arrested" | "fled" | "deceased" | "unknown";
      lastKnownLocation: string;
      createdBySession: string;
      ipHash: string;
      userAgent: string;
      reason: string;
    }
  ) => {
    await checkAndRecordContribution(ctx, args.createdBySession);
    const now = Date.now();
    const parsed = regimeMemberCreateSchema.parse(args);

    const id = await ctx.db.insert("regimeMembers", {
      name: parsed.name,
      aliases: parsed.aliases,
      photoUrls: parsed.photoUrls,
      organization: parsed.organization,
      unit: parsed.unit,
      position: parsed.position,
      rank: parsed.rank,
      status: parsed.status,
      lastKnownLocation: parsed.lastKnownLocation,
      createdAt: now,
      createdBySession: parsed.createdBySession,
      currentVersion: true,
      supersededBy: null,
      verificationCount: 0,
      previousVersions: [],
    });

    await logAudit(ctx, {
      action: "create",
      collection: "regimeMembers",
      documentId: id,
      changes: JSON.stringify({
        name: parsed.name,
        status: parsed.status,
        organization: parsed.organization,
        unit: parsed.unit,
        position: parsed.position,
        rank: parsed.rank,
        lastKnownLocation: parsed.lastKnownLocation,
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
