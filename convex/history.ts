import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

export const getRegimeMemberHistory = query({
  args: { id: v.id("regimeMembers") },
  handler: async (ctx, args) => {
    const current = await ctx.db.get(args.id);
    if (!current) {
      return null;
    }

    const history = await Promise.all(
      current.previousVersions.map((versionId) => ctx.db.get(versionId))
    );

    return {
      current,
      history: history.filter(Boolean) as Doc<"regimeMembers">[],
    };
  },
});

export const getVictimHistory = query({
  args: { id: v.id("victims") },
  handler: async (ctx, args) => {
    const current = await ctx.db.get(args.id);
    if (!current) {
      return null;
    }

    const history = await Promise.all(
      current.previousVersions.map((versionId) => ctx.db.get(versionId))
    );

    return {
      current,
      history: history.filter(Boolean) as Doc<"victims">[],
    };
  },
});
