import type { MutationCtx } from "../_generated/server";

const ONE_HOUR = 60 * 60 * 1000;
const MAX_CONTRIBUTIONS_PER_HOUR = 10;

export async function checkAndRecordContribution(
  ctx: MutationCtx,
  sessionId: string,
) {
  const session = await ctx.db
    .query("sessions")
    .filter((q) => q.eq(q.field("sessionId"), sessionId))
    .first();

  if (!session) {
    throw new Error("Session not found.");
  }

  const now = Date.now();
  const hourAgo = now - ONE_HOUR;
  const resetCount = session.lastSeen < hourAgo;
  const currentCount = resetCount ? 0 : session.contributionCount;

  if (currentCount >= MAX_CONTRIBUTIONS_PER_HOUR) {
    throw new Error("Rate limit exceeded.");
  }

  await ctx.db.patch(session._id, {
    contributionCount: resetCount ? 1 : session.contributionCount + 1,
    lastSeen: now,
  });
}
