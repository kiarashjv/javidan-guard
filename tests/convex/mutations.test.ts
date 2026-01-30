import { convexTest } from 'convex-test';
import { describe, it, expect } from 'vitest';
import { api } from '../../convex/_generated/api';
import schema from '../../convex/schema';
import { modules } from '../../convex/test.setup';

describe('Regime Members Mutations', () => {
  it('should create regime member with valid data', async () => {
    const t = convexTest(schema, modules);

    // Create session first
    await t.mutation(api.sessions.upsertSession, {
      sessionId: 'test-session',
      fingerprint: 'fp-test',
      ipHash: 'ip-test',
      userAgent: 'test-ua'
    });

    const id = await t.mutation(api.regimeMembers.create, {
      name: 'Test Member',
      aliases: ['Alias 1'],
      photoUrls: [],
      organization: 'Test Organization',
      unit: 'Test Unit',
      position: 'Commander',
      rank: 'General',
      status: 'active',
      lastKnownLocation: 'Tehran',
      createdBySession: 'test-session',
      ipHash: 'ip-test',
      userAgent: 'test-ua',
      reason: 'Test submission'
    });

    expect(id).toBeDefined();

    // Verify it was created
    const member = await t.query(api.regimeMembers.getById, { id });
    expect(member).toBeDefined();
    expect(member?.name).toBe('Test Member');
    expect(member?.currentVersion).toBe(true);
  });
});

describe('Victims Mutations', () => {
  it('should create victim with valid data', async () => {
    const t = convexTest(schema, modules);

    // Create session first
    await t.mutation(api.sessions.upsertSession, {
      sessionId: 'victim-session',
      fingerprint: 'fp-victim',
      ipHash: 'ip-victim',
      userAgent: 'test-ua'
    });

    const id = await t.mutation(api.victims.create, {
      name: 'Test Victim',
      age: 25,
      photoUrls: [],
      hometown: 'Tehran',
      status: 'murdered',
      incidentDate: '2022-01-15',
      incidentLocation: 'Downtown',
      circumstances: 'Shot during protest',
      evidenceLinks: [],
      newsReports: [],
      witnessAccounts: [],
      linkedPerpetrators: [],
      createdBySession: 'victim-session',
      ipHash: 'ip-victim',
      userAgent: 'test-ua',
      reason: 'Documentation'
    });

    expect(id).toBeDefined();

    // Verify it was created
    const victim = await t.query(api.victims.getById, { id });
    expect(victim).toBeDefined();
    expect(victim?.name).toBe('Test Victim');
    expect(victim?.age).toBe(25);
    expect(victim?.currentVersion).toBe(true);
  });
});

describe('Actions Mutations', () => {
  it('should create action with valid data', async () => {
    const t = convexTest(schema, modules);

    // Create session
    await t.mutation(api.sessions.upsertSession, {
      sessionId: 'action-session',
      fingerprint: 'fp-action',
      ipHash: 'ip-action',
      userAgent: 'test-ua'
    });

    // Create a regime member first (needed for perpetratorId)
    const perpetratorId = await t.mutation(api.regimeMembers.create, {
      name: 'Perpetrator Name',
      aliases: [],
      photoUrls: [],
      organization: 'Test Org',
      unit: 'Test Unit',
      position: 'Officer',
      rank: 'Lieutenant',
      status: 'active',
      lastKnownLocation: 'Unknown',
      createdBySession: 'action-session',
      ipHash: 'ip-action',
      userAgent: 'test-ua',
      reason: 'Setup for action test'
    });

    // Create a victim (needed for victimIds)
    const victimId = await t.mutation(api.victims.create, {
      name: 'Action Victim',
      age: 30,
      photoUrls: [],
      hometown: 'Tehran',
      status: 'murdered',
      incidentDate: '2022-01-15',
      incidentLocation: 'Test Location',
      circumstances: 'Test circumstances',
      evidenceLinks: [],
      newsReports: [],
      witnessAccounts: [],
      linkedPerpetrators: [],
      createdBySession: 'action-session',
      ipHash: 'ip-action',
      userAgent: 'test-ua',
      reason: 'Setup for action test'
    });

    // Now create the action
    const actionId = await t.mutation(api.actions.create, {
      perpetratorId,
      victimIds: [victimId],
      date: '2022-01-15',
      location: 'Test Location',
      description: 'Test action description',
      actionType: 'killing',
      evidenceUrls: [],
      videoLinks: [],
      documentLinks: [],
      witnessStatements: [],
      createdBySession: 'action-session',
      ipHash: 'ip-action',
      userAgent: 'test-ua',
      reason: 'Test documentation'
    });

    expect(actionId).toBeDefined();

    // Verify it was created
    const action = await t.query(api.actions.getById, { id: actionId });
    expect(action).toBeDefined();
    expect(action?.actionType).toBe('killing');
    expect(action?.currentVersion).toBe(true);
  });
});
