import { query } from "./_generated/server";
import { v } from "convex/values";

export const feed = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 8, 1), 20);

    const members = await ctx.db
      .query("regimeMembers")
      .filter((q) => q.eq(q.field("currentVersion"), true))
      .order("desc")
      .take(limit);

    const victims = await ctx.db
      .query("victims")
      .filter((q) => q.eq(q.field("currentVersion"), true))
      .order("desc")
      .take(limit);

    const actions = await ctx.db
      .query("actions")
      .filter((q) => q.eq(q.field("currentVersion"), true))
      .order("desc")
      .take(limit);

    const combined = [
      ...members.map((item) => ({
        _id: item._id,
        type: "regimeMembers" as const,
        title: item.name,
        subtitle: `${item.organization} · ${item.unit}`,
        status: item.status,
        createdAt: item.createdAt,
      })),
      ...victims.map((item) => ({
        _id: item._id,
        type: "victims" as const,
        title: item.name,
        subtitle: `${item.incidentLocation} · ${item.incidentDate}`,
        status: item.status,
        createdAt: item.createdAt,
      })),
      ...actions.map((item) => ({
        _id: item._id,
        type: "actions" as const,
        title: item.actionType,
        subtitle: `${item.location} · ${item.date}`,
        status: null,
        createdAt: item.createdAt,
      })),
    ];

    return combined
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  },
});
