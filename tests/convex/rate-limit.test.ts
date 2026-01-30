import { convexTest } from 'convex-test';
import { describe, it, expect } from 'vitest';
import { api } from '../../convex/_generated/api';
import schema from '../../convex/schema';
import { modules } from '../../convex/test.setup';

describe('Rate Limiting', () => {
  it('should allow contributions for new sessions', async () => {
    const t = convexTest(schema, modules);

    // Create a new session
    await t.run(async (ctx) => {
      await ctx.db.insert('sessions', {
        sessionId: 'new-session',
        fingerprint: 'fp-123',
        firstSeen: Date.now(),
        lastSeen: Date.now(),
        contributionCount: 0,
        verificationCount: 0,
        trustScore: 50,
        ipHash: 'test-ip'
      });
    });

    const result = await t.query(api.sessions.canContribute, {
      sessionId: 'new-session'
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(10);
  });

  it('should return true for non-existent session', async () => {
    const t = convexTest(schema, modules);

    const result = await t.query(api.sessions.canContribute, {
      sessionId: 'non-existent'
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(10);
  });

  it('should decrement remaining count on contribution', async () => {
    const t = convexTest(schema, modules);

    // Create session using upsertSession
    await t.mutation(api.sessions.upsertSession, {
      sessionId: 'test-session',
      fingerprint: 'fp-456',
      ipHash: 'test-ip',
      userAgent: 'test-ua'
    });

    // Record a contribution
    await t.mutation(api.sessions.recordContribution, {
      sessionId: 'test-session'
    });

    const result = await t.query(api.sessions.canContribute, {
      sessionId: 'test-session'
    });

    expect(result.remaining).toBe(9);
  });

  it('should block contributions after 10 attempts', async () => {
    const t = convexTest(schema, modules);

    await t.mutation(api.sessions.upsertSession, {
      sessionId: 'limit-test',
      fingerprint: 'fp-789',
      ipHash: 'test-ip',
      userAgent: 'test-ua'
    });

    // Make 10 contributions
    for (let i = 0; i < 10; i++) {
      await t.mutation(api.sessions.recordContribution, {
        sessionId: 'limit-test'
      });
    }

    const result = await t.query(api.sessions.canContribute, {
      sessionId: 'limit-test'
    });

    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should reset counter after 1 hour', async () => {
    const t = convexTest(schema, modules);

    const oneHourAgo = Date.now() - (60 * 60 * 1000 + 1000); // 1 hour + 1 second ago

    // Create session with old lastSeen
    await t.run(async (ctx) => {
      await ctx.db.insert('sessions', {
        sessionId: 'old-session',
        fingerprint: 'fp-old',
        firstSeen: oneHourAgo,
        lastSeen: oneHourAgo,
        contributionCount: 10, // Was at limit
        verificationCount: 0,
        trustScore: 50,
        ipHash: 'test-ip'
      });
    });

    const result = await t.query(api.sessions.canContribute, {
      sessionId: 'old-session'
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(10);
  });

  it('should throw error when recording contribution for non-existent session', async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(api.sessions.recordContribution, {
        sessionId: 'does-not-exist'
      })
    ).rejects.toThrow('Session not found');
  });

  it('should reset count to 1 when recording after 1 hour', async () => {
    const t = convexTest(schema, modules);

    const oneHourAgo = Date.now() - (60 * 60 * 1000 + 1000);

    // Create session with old lastSeen
    await t.run(async (ctx) => {
      await ctx.db.insert('sessions', {
        sessionId: 'reset-session',
        fingerprint: 'fp-reset',
        firstSeen: oneHourAgo,
        lastSeen: oneHourAgo,
        contributionCount: 10,
        verificationCount: 0,
        trustScore: 50,
        ipHash: 'test-ip'
      });
    });

    // Record a new contribution (should reset)
    await t.mutation(api.sessions.recordContribution, {
      sessionId: 'reset-session'
    });

    const result = await t.query(api.sessions.canContribute, {
      sessionId: 'reset-session'
    });

    expect(result.remaining).toBe(9); // Should be 10 - 1 = 9
  });

  it('should create new session with upsertSession', async () => {
    const t = convexTest(schema, modules);

    const id = await t.mutation(api.sessions.upsertSession, {
      sessionId: 'new-upsert-session',
      fingerprint: 'fp-upsert',
      ipHash: 'ip-hash',
      userAgent: 'Mozilla/5.0'
    });

    expect(id).toBeDefined();

    const session = await t.query(api.sessions.getBySessionId, {
      sessionId: 'new-upsert-session'
    });

    expect(session).toBeDefined();
    expect(session?.sessionId).toBe('new-upsert-session');
    expect(session?.contributionCount).toBe(0);
    expect(session?.trustScore).toBe(50);
  });
});
