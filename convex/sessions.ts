import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const ONE_HOUR = 60 * 60 * 1000;
const MAX_CONTRIBUTIONS_PER_HOUR = 10;

export const getBySessionId = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("sessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();
  },
});

export const upsertSession = mutation({
  args: {
    sessionId: v.string(),
    fingerprint: v.string(),
    ipHash: v.string(),
    userAgent: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!existing) {
      return ctx.db.insert("sessions", {
        sessionId: args.sessionId,
        fingerprint: args.fingerprint,
        firstSeen: now,
        lastSeen: now,
        contributionCount: 0,
        verificationCount: 0,
        trustScore: 50,
        ipHash: args.ipHash,
      });
    }

    await ctx.db.patch(existing._id, {
      fingerprint: args.fingerprint,
      lastSeen: now,
      ipHash: args.ipHash,
    });

    return existing._id;
  },
});

export const canContribute = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!existing) {
      return { allowed: true, remaining: MAX_CONTRIBUTIONS_PER_HOUR };
    }

    const hourAgo = Date.now() - ONE_HOUR;
    const contributionsInHour = existing.contributionCount;

    if (existing.lastSeen < hourAgo) {
      return { allowed: true, remaining: MAX_CONTRIBUTIONS_PER_HOUR };
    }

    const remaining = Math.max(0, MAX_CONTRIBUTIONS_PER_HOUR - contributionsInHour);
    return { allowed: remaining > 0, remaining };
  },
});

export const recordContribution = mutation({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!existing) {
      throw new Error("Session not found.");
    }

    const hourAgo = Date.now() - ONE_HOUR;
    const resetCount = existing.lastSeen < hourAgo;

    await ctx.db.patch(existing._id, {
      contributionCount: resetCount ? 1 : existing.contributionCount + 1,
      lastSeen: Date.now(),
    });

    return true;
  },
});
