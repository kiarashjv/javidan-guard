import {
  mutationGeneric,
  queryGeneric,
  type GenericDataModel,
  type GenericMutationCtx,
  type GenericQueryCtx,
} from "convex/server";
import { v, type GenericId } from "convex/values";
import { logAudit } from "./lib/audit";

type DataModel = GenericDataModel;
type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;

export const listCurrent = queryGeneric({
  args: {},
  handler: async (ctx: QueryCtx) => {
    return ctx.db
      .query("regimeMembers")
      .filter((q) => q.eq(q.field("currentVersion"), true))
      .collect();
  },
});

export const getById = queryGeneric({
  args: { id: v.id("regimeMembers") },
  handler: async (
    ctx: QueryCtx,
    args: { id: GenericId<"regimeMembers"> }
  ) => {
    return ctx.db.get(args.id);
  },
});

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
    const now = Date.now();

    const id = await ctx.db.insert("regimeMembers", {
      name: args.name,
      aliases: args.aliases,
      photoUrls: args.photoUrls,
      organization: args.organization,
      unit: args.unit,
      position: args.position,
      rank: args.rank,
      status: args.status,
      lastKnownLocation: args.lastKnownLocation,
      createdAt: now,
      createdBySession: args.createdBySession,
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
        name: args.name,
        status: args.status,
        organization: args.organization,
        unit: args.unit,
        position: args.position,
        rank: args.rank,
        lastKnownLocation: args.lastKnownLocation,
      }),
      sessionId: args.createdBySession,
      ipHash: args.ipHash,
      userAgent: args.userAgent,
      reason: args.reason,
    });

    return id;
  },
});
