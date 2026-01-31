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
import { actionCreateSchema } from "./lib/validation";

type DataModel = GenericDataModel;
type QueryCtx = GenericQueryCtx<DataModel>;
type MutationCtx = GenericMutationCtx<DataModel>;

export const listCurrent = queryGeneric({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx: QueryCtx, args: { limit?: number }) => {
    const limit = args.limit ?? 20;
    return ctx.db
      .query("actions")
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
        .query("actions")
        .withSearchIndex("search_description", (q) =>
          q.search("description", searchQuery).eq("currentVersion", true),
        )
        .paginate({
          numItems: paginationOpts.numItems,
          cursor: paginationOpts.cursor ?? null,
        });
    }
    return ctx.db
      .query("actions")
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
        .query("actions")
        .withSearchIndex("search_description", (q) =>
          q.search("description", searchQuery).eq("currentVersion", true),
        )
        .collect();
      return results.length;
    }
    const results = await ctx.db
      .query("actions")
      .withIndex("by_current_version", (q) => q.eq("currentVersion", true))
      .collect();
    return results.length;
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
    locationProvince: v.string(),
    locationCity: v.string(),
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
      locationProvince: string;
      locationCity: string;
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

    const location = formatIranLocation(
      parsed.locationProvince,
      parsed.locationCity,
    );

    const id = await ctx.db.insert("actions", {
      perpetratorId: parsed.perpetratorId,
      victimIds: parsed.victimIds,
      date: parsed.date,
      locationProvince: parsed.locationProvince,
      locationCity: parsed.locationCity,
      location: location,
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
