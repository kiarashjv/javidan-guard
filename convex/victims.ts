import {
  mutationGeneric,
  queryGeneric,
  type GenericDataModel,
  type GenericMutationCtx,
  type GenericQueryCtx,
} from "convex/server";
import { v, type GenericId } from "convex/values";
import { logAudit } from "./lib/audit";
import { formatIranLocation } from "./lib/location";
import { checkAndRecordContribution } from "./lib/rateLimit";
import { adjustTrustScore } from "./lib/trustScore";
import { victimCreateSchema } from "./lib/validation";

type DataModel = GenericDataModel;
type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;

export const listCurrent = queryGeneric({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx: QueryCtx, args: { limit?: number }) => {
    const limit = args.limit ?? 20;
    return ctx.db
      .query("victims")
      .withIndex("by_current_version", (q) => q.eq("currentVersion", true))
      .order("desc")
      .take(limit);
  },
});

export const listCurrentPaginated = queryGeneric({
  args: {
    paginationOpts: v.optional(
      v.object({
        numItems: v.number(),
        cursor: v.optional(v.union(v.string(), v.null())),
      }),
    ),
    searchQuery: v.optional(v.string()),
  },
  handler: async (
    ctx: QueryCtx,
    args: {
      paginationOpts?: { numItems: number; cursor?: string | null };
      searchQuery?: string;
    },
  ) => {
    const paginationOpts = args.paginationOpts ?? { numItems: 20, cursor: null };
    const searchQuery = args.searchQuery?.trim();
    if (searchQuery) {
      return ctx.db
        .query("victims")
        .withSearchIndex("search_name", (q) =>
          q.search("name", searchQuery).eq("currentVersion", true),
        )
        .paginate({
          numItems: paginationOpts.numItems,
          cursor: paginationOpts.cursor ?? null,
        });
    }
    return ctx.db
      .query("victims")
      .withIndex("by_current_version", (q) => q.eq("currentVersion", true))
      .order("desc")
      .paginate({
        numItems: paginationOpts.numItems,
        cursor: paginationOpts.cursor ?? null,
      });
  },
});

export const countCurrent = queryGeneric({
  args: { searchQuery: v.optional(v.string()) },
  handler: async (ctx: QueryCtx, args: { searchQuery?: string }) => {
    const searchQuery = args.searchQuery?.trim();
    if (searchQuery) {
      const results = await ctx.db
        .query("victims")
        .withSearchIndex("search_name", (q) =>
          q.search("name", searchQuery).eq("currentVersion", true),
        )
        .collect();
      return results.length;
    }
    const results = await ctx.db
      .query("victims")
      .withIndex("by_current_version", (q) => q.eq("currentVersion", true))
      .collect();
    return results.length;
  },
});

export const getById = queryGeneric({
  args: { id: v.id("victims") },
  handler: async (ctx: QueryCtx, args: { id: GenericId<"victims"> }) => {
    return resolveCurrentVictim(ctx, args.id);
  },
});

async function resolveCurrentVictim(ctx: QueryCtx, id: GenericId<"victims">) {
  let current = await ctx.db.get(id);
  let hops = 0;
  while (
    current &&
    current.currentVersion === false &&
    current.supersededBy &&
    hops < 5
  ) {
    current = await ctx.db.get(current.supersededBy as GenericId<"victims">);
    hops += 1;
  }
  return current;
}

export const create = mutationGeneric({
  args: {
    name: v.string(),
    age: v.number(),
    photoUrls: v.array(v.string()),
    hometownProvince: v.string(),
    hometownCity: v.string(),
    hometown: v.string(),
    status: v.union(
      v.literal("murdered"),
      v.literal("captured"),
      v.literal("vanished"),
      v.literal("released"),
      v.literal("confirmed_dead")
    ),
    incidentProvince: v.string(),
    incidentCity: v.string(),
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
      hometownProvince: string;
      hometownCity: string;
      hometown: string;
      status:
        | "murdered"
        | "captured"
        | "vanished"
        | "released"
        | "confirmed_dead";
      incidentProvince: string;
      incidentCity: string;
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
    const parsed = victimCreateSchema.parse({
      ...args,
      linkedPerpetrators: args.linkedPerpetrators,
    });

    const hometownLocation = formatIranLocation(
      parsed.hometownProvince,
      parsed.hometownCity,
    );
    const incidentLocation = formatIranLocation(
      parsed.incidentProvince,
      parsed.incidentCity,
    );

    const id = await ctx.db.insert("victims", {
      name: parsed.name,
      age: parsed.age,
      photoUrls: parsed.photoUrls,
      hometownProvince: parsed.hometownProvince,
      hometownCity: parsed.hometownCity,
      hometown: hometownLocation,
      status: parsed.status,
      incidentProvince: parsed.incidentProvince,
      incidentCity: parsed.incidentCity,
      incidentDate: parsed.incidentDate,
      incidentLocation: incidentLocation,
      circumstances: parsed.circumstances,
      evidenceLinks: parsed.evidenceLinks,
      newsReports: parsed.newsReports,
      witnessAccounts: parsed.witnessAccounts,
      linkedPerpetrators: parsed.linkedPerpetrators,
      createdAt: now,
      createdBySession: parsed.createdBySession,
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
        name: parsed.name,
        status: parsed.status,
        incidentDate: parsed.incidentDate,
        incidentLocation: parsed.incidentLocation,
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
