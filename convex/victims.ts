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

type DataModel = GenericDataModel;
type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;

export const listCurrent = queryGeneric({
  args: {},
  handler: async (ctx: QueryCtx) => {
    return ctx.db
      .query("victims")
      .filter((q) => q.eq(q.field("currentVersion"), true))
      .collect();
  },
});

export const getById = queryGeneric({
  args: { id: v.id("victims") },
  handler: async (ctx: QueryCtx, args: { id: GenericId<"victims"> }) => {
    return ctx.db.get(args.id);
  },
});

export const create = mutationGeneric({
  args: {
    name: v.string(),
    age: v.number(),
    photoUrls: v.array(v.string()),
    hometown: v.string(),
    status: v.union(
      v.literal("murdered"),
      v.literal("captured"),
      v.literal("vanished"),
      v.literal("released"),
      v.literal("confirmed_dead")
    ),
    incidentDate: v.string(),
    incidentLocation: v.string(),
    circumstances: v.string(),
    evidenceLinks: v.array(v.string()),
    newsReports: v.array(v.string()),
    witnessAccounts: v.array(v.string()),
    linkedPerpetrators: v.array(v.id("regimeMembers")),
    createdBySession: v.string(),
    ipHash: v.string(),
    userAgent: v.string(),
    reason: v.string(),
  },
  handler: async (
    ctx: MutationCtx,
    args: {
      name: string;
      age: number;
      photoUrls: string[];
      hometown: string;
      status:
        | "murdered"
        | "captured"
        | "vanished"
        | "released"
        | "confirmed_dead";
      incidentDate: string;
      incidentLocation: string;
      circumstances: string;
      evidenceLinks: string[];
      newsReports: string[];
      witnessAccounts: string[];
      linkedPerpetrators: GenericId<"regimeMembers">[];
      createdBySession: string;
      ipHash: string;
      userAgent: string;
      reason: string;
    }
  ) => {
    await checkAndRecordContribution(ctx, args.createdBySession);
    const now = Date.now();

    const id = await ctx.db.insert("victims", {
      name: args.name,
      age: args.age,
      photoUrls: args.photoUrls,
      hometown: args.hometown,
      status: args.status,
      incidentDate: args.incidentDate,
      incidentLocation: args.incidentLocation,
      circumstances: args.circumstances,
      evidenceLinks: args.evidenceLinks,
      newsReports: args.newsReports,
      witnessAccounts: args.witnessAccounts,
      linkedPerpetrators: args.linkedPerpetrators,
      createdAt: now,
      createdBySession: args.createdBySession,
      currentVersion: true,
      supersededBy: null,
      verificationCount: 0,
      previousVersions: [],
    });

    await logAudit(ctx, {
      action: "create",
      collection: "victims",
      documentId: id,
      changes: JSON.stringify({
        name: args.name,
        status: args.status,
        incidentDate: args.incidentDate,
        incidentLocation: args.incidentLocation,
      }),
      sessionId: args.createdBySession,
      ipHash: args.ipHash,
      userAgent: args.userAgent,
      reason: args.reason,
    });

    return id;
  },
});
