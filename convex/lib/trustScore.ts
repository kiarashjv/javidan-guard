import type { MutationCtx } from "../_generated/server";

const MIN_TRUST = 0;
const MAX_TRUST = 100;

export async function adjustTrustScore(
  ctx: MutationCtx,
  sessionId: string,
  delta: number
) {
  const session = await ctx.db
    .query("sessions")
    .filter((q) => q.eq(q.field("sessionId"), sessionId))
    .first();

  if (!session) {
    return;
  }

  const next = Math.min(MAX_TRUST, Math.max(MIN_TRUST, session.trustScore + delta));
  await ctx.db.patch(session._id, { trustScore: next });
}

export async function recordVerification(
  ctx: MutationCtx,
  sessionId: string
) {
  const session = await ctx.db
    .query("sessions")
    .filter((q) => q.eq(q.field("sessionId"), sessionId))
    .first();

  if (!session) {
    return;
  }

  await ctx.db.patch(session._id, {
    verificationCount: session.verificationCount + 1,
  });
}
