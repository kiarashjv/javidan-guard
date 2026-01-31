import { convexTest } from 'convex-test';
import { describe, it, expect } from 'vitest';
import { api } from '../../convex/_generated/api';
import schema from '../../convex/schema';
import { modules } from '../../convex/test.setup';

describe('Verification System', () => {
  it('should propose update for regime member', async () => {
    const t = convexTest(schema, modules);

    // Create session
    await t.mutation(api.sessions.upsertSession, {
      sessionId: 'proposer',
      fingerprint: 'fp-proposer',
      ipHash: 'ip-proposer',
      userAgent: 'test-ua'
    });

    // Create a regime member
    const memberId = await t.mutation(api.regimeMembers.create, {
      name: 'Original Name',
      aliases: [],
      photoUrls: [],
      organization: 'Test Org',
      unit: 'Test Unit',
      position: 'Officer',
      rank: 'Lieutenant',
      status: 'active',
      lastKnownProvince: 'Tehran',
      lastKnownCity: 'Tehran',
      lastKnownLocation: 'Tehran',
      createdBySession: 'proposer',
      ipHash: 'ip-proposer',
      userAgent: 'test-ua',
      reason: 'Initial creation'
    });

    // Propose an update to change status
    const pendingId = await t.mutation(api.pendingUpdates.proposeUpdate, {
      targetCollection: 'regimeMembers',
      targetId: memberId,
      proposedChanges: JSON.stringify({ status: 'arrested' }),
      reason: 'Status changed to arrested',
      proposedBy: 'proposer',
      ipHash: 'ip-proposer',
      userAgent: 'test-ua'
    });

    expect(pendingId).toBeDefined();

    // Verify the pending update exists
    const pending = await t.query(api.pendingUpdates.listPendingForTarget, {
      targetCollection: 'regimeMembers',
      targetId: memberId
    });

    expect(pending).toHaveLength(1);
    expect(pending[0]?.status).toBe('pending');
    expect(pending[0]?.currentVerifications).toBe(0);
  });

  it('should verify update and auto-approve when threshold met', async () => {
    const t = convexTest(schema, modules);

    // Create two sessions (proposer and verifier)
    await t.mutation(api.sessions.upsertSession, {
      sessionId: 'proposer-2',
      fingerprint: 'fp-proposer-2',
      ipHash: 'ip-proposer-2',
      userAgent: 'test-ua'
    });

    await t.mutation(api.sessions.upsertSession, {
      sessionId: 'verifier-1',
      fingerprint: 'fp-verifier-1',
      ipHash: 'ip-verifier-1',
      userAgent: 'test-ua'
    });

    // Create a regime member
    const memberId = await t.mutation(api.regimeMembers.create, {
      name: 'Test Member',
      aliases: [],
      photoUrls: [],
      organization: 'Test Org',
      unit: 'Test Unit',
      position: 'Officer',
      rank: 'Captain',
      status: 'active',
      lastKnownProvince: 'Tehran',
      lastKnownCity: 'Tehran',
      lastKnownLocation: 'Tehran',
      createdBySession: 'proposer-2',
      ipHash: 'ip-proposer-2',
      userAgent: 'test-ua',
      reason: 'Initial creation'
    });

    // Propose an update
    const pendingId = await t.mutation(api.pendingUpdates.proposeUpdate, {
      targetCollection: 'regimeMembers',
      targetId: memberId,
      proposedChanges: JSON.stringify({ status: 'fled' }),
      reason: 'Member fled the country',
      proposedBy: 'proposer-2',
      ipHash: 'ip-proposer-2',
      userAgent: 'test-ua'
    });

    // Verify the update (should auto-approve since requiredVerifications = 1)
    const verificationCount = await t.mutation(api.pendingUpdates.verifyUpdate, {
      pendingUpdateId: pendingId,
      sessionId: 'verifier-1',
      ipHash: 'ip-verifier-1',
      userAgent: 'test-ua'
    });

    expect(verificationCount).toBe(1);

    // Check that pending update was approved
    const pendingUpdate = await t.run(async (ctx) => {
      return ctx.db.get(pendingId);
    });

    expect(pendingUpdate?.status).toBe('approved');

    // Check that old record is superseded
    const oldMember = await t.run(async (ctx) => {
      return ctx.db.get(memberId);
    });

    expect(oldMember?.currentVersion).toBe(false);
    expect(oldMember?.supersededBy).toBeDefined();

    // Check that new version was created with updated status
    if (oldMember?.supersededBy) {
      const newMember = await t.run(async (ctx) => {
        return ctx.db.get(oldMember.supersededBy!);
      });

      expect(newMember?.status).toBe('fled');
      expect(newMember?.currentVersion).toBe(true);
      expect(newMember?.name).toBe('Test Member'); // Other fields preserved
    }
  });

  it('should prevent same session from verifying twice', async () => {
    const t = convexTest(schema, modules);

    // Create sessions - proposer and verifier
    await t.mutation(api.sessions.upsertSession, {
      sessionId: 'proposer-3',
      fingerprint: 'fp-proposer-3',
      ipHash: 'ip-proposer-3',
      userAgent: 'test-ua'
    });

    await t.mutation(api.sessions.upsertSession, {
      sessionId: 'verifier-2',
      fingerprint: 'fp-verifier-2',
      ipHash: 'ip-verifier-2',
      userAgent: 'test-ua'
    });

    // Create a regime member
    const memberId = await t.mutation(api.regimeMembers.create, {
      name: 'Test Member 3',
      aliases: [],
      photoUrls: [],
      organization: 'Test Org',
      unit: 'Test Unit',
      position: 'Officer',
      rank: 'Major',
      status: 'active',
      lastKnownProvince: 'Tehran',
      lastKnownCity: 'Tehran',
      lastKnownLocation: 'Tehran',
      createdBySession: 'proposer-3',
      ipHash: 'ip-proposer-3',
      userAgent: 'test-ua',
      reason: 'Initial creation'
    });

    // Manually create a pending update with requiredVerifications = 3
    // so we can test duplicate verification before auto-approval
    const pendingId = await t.run(async (ctx) => {
      return ctx.db.insert('pendingUpdates', {
        targetCollection: 'regimeMembers',
        targetId: memberId,
        proposedChanges: JSON.stringify({ status: 'deceased' }),
        reason: 'Member confirmed deceased',
        proposedBy: 'proposer-3',
        proposedAt: Date.now(),
        status: 'pending',
        currentVerifications: 0,
        requiredVerifications: 3, // Require 3 verifications
        verifiedBySessions: [],
        rejectedBySessions: [],
        expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
        targetSnapshot: JSON.stringify({})
      });
    });

    // First verification should succeed (1/3)
    const count = await t.mutation(api.pendingUpdates.verifyUpdate, {
      pendingUpdateId: pendingId,
      sessionId: 'verifier-2',
      ipHash: 'ip-verifier-2',
      userAgent: 'test-ua'
    });

    expect(count).toBe(1);

    // Verify still pending (needs 3 total)
    const pending = await t.run(async (ctx) => ctx.db.get(pendingId));
    expect(pending?.status).toBe('pending');

    // Second verification by same session should fail
    await expect(
      t.mutation(api.pendingUpdates.verifyUpdate, {
        pendingUpdateId: pendingId,
        sessionId: 'verifier-2',
        ipHash: 'ip-verifier-2',
        userAgent: 'test-ua'
      })
    ).rejects.toThrow('already verified');
  });

  it('should reject pending update', async () => {
    const t = convexTest(schema, modules);

    // Create sessions
    await t.mutation(api.sessions.upsertSession, {
      sessionId: 'proposer-4',
      fingerprint: 'fp-proposer-4',
      ipHash: 'ip-proposer-4',
      userAgent: 'test-ua'
    });

    // Create a victim
    const victimId = await t.mutation(api.victims.create, {
      name: 'Test Victim',
      age: 30,
      photoUrls: [],
      hometownProvince: 'Tehran',
      hometownCity: 'Tehran',
      hometown: 'Tehran',
      status: 'murdered',
      incidentProvince: 'Tehran',
      incidentCity: 'Tehran',
      incidentDate: '2022-01-15',
      incidentLocation: 'Downtown',
      circumstances: 'Shot during protest',
      evidenceLinks: [],
      newsReports: [],
      witnessAccounts: [],
      linkedPerpetrators: [],
      createdBySession: 'proposer-4',
      ipHash: 'ip-proposer-4',
      userAgent: 'test-ua',
      reason: 'Initial documentation'
    });

    // Propose an update
    const pendingId = await t.mutation(api.pendingUpdates.proposeUpdate, {
      targetCollection: 'victims',
      targetId: victimId,
      proposedChanges: JSON.stringify({ age: 25 }),
      reason: 'Age correction',
      proposedBy: 'proposer-4',
      ipHash: 'ip-proposer-4',
      userAgent: 'test-ua'
    });

    // Reject the update
    await t.mutation(api.pendingUpdates.rejectUpdate, {
      pendingUpdateId: pendingId,
      sessionId: 'proposer-4',
      ipHash: 'ip-proposer-4',
      userAgent: 'test-ua',
      reason: 'Incorrect information'
    });

    // Verify the update was rejected
    const pendingUpdate = await t.run(async (ctx) => {
      return ctx.db.get(pendingId);
    });

    expect(pendingUpdate?.status).toBe('rejected');

    // Verify original record is unchanged
    const victim = await t.query(api.victims.getById, { id: victimId });
    expect(victim?.age).toBe(30); // Original age
    expect(victim?.currentVersion).toBe(true); // Still current version
  });
});
