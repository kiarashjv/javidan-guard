import { describe, it, expect } from 'vitest';
import {
  regimeMemberFormSchema,
  victimFormSchema,
  actionFormSchema,
  firstZodIssueMessage
} from '@/lib/client-validation';
import { ZodError } from 'zod';

describe('regimeMemberFormSchema', () => {
  it('should accept valid regime member data', () => {
    const validData = {
      name: 'John Doe',
      organization: 'Test Organization',
      unit: 'Test Unit',
      position: 'Commander',
      rank: 'General',
      status: 'active' as const,
      lastKnownProvince: 'Tehran',
      lastKnownCity: 'Tehran',
      aliases: 'Alias1, Alias2',
      photoUrls: 'http://example.com/photo.jpg',
      reason: 'Test submission'
    };

    const result = regimeMemberFormSchema.parse(validData);

    expect(result.name).toBe('John Doe');
    expect(result.status).toBe('active');
  });

  it('should reject empty name', () => {
    const invalidData = {
      name: '   ', // Whitespace only
      organization: 'Test Organization',
      unit: 'Test Unit',
      position: 'Commander',
      rank: 'General',
      status: 'active' as const,
      lastKnownProvince: 'Tehran',
      lastKnownCity: 'Tehran',
      aliases: '',
      photoUrls: '',
      reason: 'Test'
    };

    expect(() => regimeMemberFormSchema.parse(invalidData)).toThrow();
  });

  it('should reject invalid status', () => {
    const invalidData = {
      name: 'John Doe',
      organization: 'Test Organization',
      unit: 'Test Unit',
      position: 'Commander',
      rank: 'General',
      status: 'invalid-status', // Not in enum
      lastKnownProvince: 'Tehran',
      lastKnownCity: 'Tehran',
      aliases: '',
      photoUrls: '',
      reason: 'Test'
    };

    expect(() => regimeMemberFormSchema.parse(invalidData)).toThrow();
  });

  it('should trim whitespace from name', () => {
    const data = {
      name: '  John Doe  ',
      organization: 'Test Organization',
      unit: 'Test Unit',
      position: 'Commander',
      rank: 'General',
      status: 'active' as const,
      lastKnownProvince: 'Tehran',
      lastKnownCity: 'Tehran',
      aliases: '',
      photoUrls: '',
      reason: 'Test'
    };

    const result = regimeMemberFormSchema.parse(data);
    expect(result.name).toBe('John Doe');
  });
});

describe('victimFormSchema', () => {
  it('should accept valid victim data', () => {
    const validData = {
      name: 'Jane Doe',
      age: '25', // String input that should be coerced to number
      hometownProvince: 'Tehran',
      hometownCity: 'Tehran',
      status: 'murdered' as const,
      incidentProvince: 'Tehran',
      incidentCity: 'Tehran',
      incidentDate: '2022-01-15',
      circumstances: 'Shot during protest',
      evidenceLinks: 'http://example.com/evidence',
      newsReports: 'http://news.com/report',
      witnessAccounts: 'Witness statement',
      linkedPerpetrators: 'perpetrator-id-1',
      photoUrls: 'http://example.com/photo.jpg',
      reason: 'Documentation'
    };

    const result = victimFormSchema.parse(validData);

    expect(result.name).toBe('Jane Doe');
    expect(result.age).toBe(25); // Should be coerced to number
    expect(typeof result.age).toBe('number');
  });

  it('should coerce age string to number', () => {
    const data = {
      name: 'Test Victim',
      age: '30',
      hometownProvince: 'Tehran',
      hometownCity: 'Tehran',
      status: 'captured' as const,
      incidentProvince: 'Tehran',
      incidentCity: 'Tehran',
      incidentDate: '2022-01-01',
      circumstances: 'Test circumstances',
      evidenceLinks: '',
      newsReports: '',
      witnessAccounts: '',
      linkedPerpetrators: '',
      photoUrls: '',
      reason: 'Test'
    };

    const result = victimFormSchema.parse(data);
    expect(result.age).toBe(30);
    expect(typeof result.age).toBe('number');
  });

  it('should reject negative age', () => {
    const invalidData = {
      name: 'Test Victim',
      age: '-5',
      hometownProvince: 'Tehran',
      hometownCity: 'Tehran',
      status: 'murdered' as const,
      incidentProvince: 'Tehran',
      incidentCity: 'Tehran',
      incidentDate: '2022-01-01',
      circumstances: 'Test',
      evidenceLinks: '',
      newsReports: '',
      witnessAccounts: '',
      linkedPerpetrators: '',
      photoUrls: '',
      reason: 'Test'
    };

    expect(() => victimFormSchema.parse(invalidData)).toThrow();
  });
});

describe('actionFormSchema', () => {
  it('should accept valid action data', () => {
    const validData = {
      actionType: 'killing' as const,
      date: '2022-01-15',
      locationProvince: 'Tehran',
      locationCity: 'Tehran',
      description: 'Test description',
      perpetratorId: 'regime-member-id',
      victimIds: 'victim-id-1, victim-id-2',
      evidenceUrls: 'http://example.com/evidence',
      videoLinks: 'http://example.com/video',
      documentLinks: 'http://example.com/doc',
      witnessStatements: 'Witness statement',
      reason: 'Documentation'
    };

    const result = actionFormSchema.parse(validData);

    expect(result.actionType).toBe('killing');
    expect(result.description).toBe('Test description');
  });

  it('should reject invalid action type', () => {
    const invalidData = {
      actionType: 'invalid-type',
      date: '2022-01-15',
      locationProvince: 'Tehran',
      locationCity: 'Tehran',
      description: 'Test description',
      perpetratorId: 'regime-member-id',
      victimIds: 'victim-id-1',
      evidenceUrls: '',
      videoLinks: '',
      documentLinks: '',
      witnessStatements: '',
      reason: 'Test'
    };

    expect(() => actionFormSchema.parse(invalidData)).toThrow();
  });

  it('should accept all valid action types', () => {
    const validTypes = ['killing', 'torture', 'arrest', 'assault', 'other'] as const;

    validTypes.forEach(actionType => {
      const data = {
        actionType,
        date: '2022-01-15',
        locationProvince: 'Tehran',
        locationCity: 'Tehran',
        description: 'Test description',
        perpetratorId: 'regime-member-id',
        victimIds: 'victim-id-1',
        evidenceUrls: '',
        videoLinks: '',
        documentLinks: '',
        witnessStatements: '',
        reason: 'Test'
      };

      const result = actionFormSchema.parse(data);
      expect(result.actionType).toBe(actionType);
    });
  });
});

describe('firstZodIssueMessage', () => {
  it('should format error message with field path', () => {
    try {
      regimeMemberFormSchema.parse({
        name: '', // Invalid
        organization: 'Test',
        unit: 'Test',
        position: 'Test',
        rank: 'Test',
        status: 'active',
        lastKnownProvince: 'Tehran',
        lastKnownCity: 'Tehran',
        aliases: '',
        photoUrls: '',
        reason: 'Test'
      });
    } catch (error) {
      const message = firstZodIssueMessage(error as ZodError);
      expect(message).toContain('name');
      expect(typeof message).toBe('string');
    }
  });

  it('should return default message for error without issues', () => {
    const emptyError = new ZodError([]);
    const message = firstZodIssueMessage(emptyError);
    expect(message).toBe('Invalid input.');
  });
});
