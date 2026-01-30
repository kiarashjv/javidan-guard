# Testing Strategy: Iran Revolution Platform

## Overview
This document establishes a **pragmatic, minimal testing strategy** for the Iran Revolution Platform - a Next.js + Convex application documenting human rights violations during the Iranian revolution. Currently, **zero tests exist**. This strategy focuses on high-value, low-effort tests that prove the system works without over-engineering.

## Platform Context
- **Purpose**: Community-driven documentation of regime members, victims, and actions during Iranian revolution
- **Tech Stack**: Next.js 16, React 19, Convex (backend/database), Zod validation, TypeScript
- **Critical Features**: Data validation, rate limiting (10/hour), community verification system, audit logging, version control

---

## Testing Strategy

### Framework Selection

**Primary: Vitest** (unit + integration tests)
- Fast, TypeScript-native, excellent Next.js compatibility
- **Install**: `pnpm add -D vitest @vitest/ui @vitest/coverage-v8`

**Secondary: Convex Test** (Convex mutation/query tests)
- Official Convex testing utilities for backend logic
- **Install**: `pnpm add -D convex-test`

**Skip**: E2E testing (Playwright/Cypress) initially - too much overhead. Focus on backend validation first.

---

## Test Priorities

### Priority 1: MUST-HAVE (Critical Data Integrity)

#### 1.1 Validation Tests
**Files to test**: [src/lib/client-validation.ts](../src/lib/client-validation.ts)

**Test file**: `tests/validation/client-validation.test.ts`

**Coverage**:
- All 3 main schemas: `regimeMemberFormSchema`, `victimFormSchema`, `actionFormSchema`
- Required field validation (empty strings should fail)
- Trimming behavior (whitespace-only strings should fail)
- Enum validation (invalid status values like "invalid-status" should fail)
- Type coercion (`victimFormSchema.age` should coerce string "25" to number 25)
- Array parsing (comma-separated strings in forms)
- Error message formatting (`firstZodIssueMessage()` helper)

**Why critical**: Invalid data corrupts the historical record permanently. This is a human rights documentation platform - data integrity is non-negotiable.

**Effort**: LOW (~30-50 test cases)
**Value**: MAXIMUM (prevents database corruption)

#### 1.2 Rate Limiting Tests
**Files to test**: [convex/sessions.ts](../convex/sessions.ts) - `canContribute()`, `recordContribution()`

**Test file**: `tests/convex/rate-limit.test.ts`

**Coverage**:
- Test 10 contributions per hour limit enforced
- Test counter resets after 1 hour (`existing.lastSeen < hourAgo`)
- Test `canContribute()` returns correct remaining count
- Test `recordContribution()` increments counter correctly
- Test new sessions get MAX_CONTRIBUTIONS_PER_HOUR (10) remaining

**Why critical**: Prevents spam/abuse. Platform becomes unusable if rate limiting fails.

**Effort**: LOW (~10-15 test cases)
**Value**: HIGH (protects platform integrity)

---

### Priority 2: SHOULD-HAVE (Core Business Logic)

#### 2.1 Convex Create Mutations
**Files to test**: `convex/regimeMembers.ts`, `convex/victims.ts`, `convex/actions.ts`

**Test files**:
- `tests/convex/regimeMembers.test.ts`
- `tests/convex/victims.test.ts`
- `tests/convex/actions.test.ts`

**Coverage**:
- `create()` mutations work with valid data
- Invalid data throws validation errors
- Rate limiting enforced (should fail on 11th contribution)
- Trust score increases after contribution (+1)
- Audit logs created for each mutation
- Version control fields set correctly (`currentVersion: true`, `supersededBy: null`)

**Why important**: These are the only ways data enters the system. If create() breaks, the platform is unusable.

**Effort**: MEDIUM (~20-30 test cases across 3 files)
**Value**: HIGH (core functionality)

#### 2.2 Pending Updates (Verification System)
**Files to test**: `convex/pendingUpdates.ts`

**Test file**: `tests/convex/pendingUpdates.test.ts`

**Coverage**:
- `proposeUpdate()` creates pending update correctly
- Cannot propose update for same field twice (duplicate detection)
- `verifyUpdate()` increments verification count
- Same session cannot verify twice
- Auto-approval when threshold reached (1 verification for trusted users)
- Version chain created correctly (`supersededBy`, `previousVersions` arrays)
- Trust score decreases on rejection (-2)

**Why important**: This is the unique community verification feature. If broken, updates stop working.

**Effort**: MEDIUM (~15-20 test cases)
**Value**: HIGH (unique differentiator)

---

### Priority 3: NICE-TO-HAVE (Lower Risk)

#### 3.1 Trust Score Tests
**Files to test**: `convex/sessions.ts` (trust score logic)

**Test file**: `tests/integration/trust-score.test.ts`

**Coverage**:
- Trust score increases on contribution (+1)
- Trust score decreases on rejection (-2)
- Trust score stays within bounds (0-100)
- Verification count increments correctly

**Effort**: LOW (~5-8 test cases)
**Value**: MEDIUM (feature still works even if this breaks)

---

## What NOT to Test (Initially)

To avoid over-engineering, **skip these** for now:
1. UI components (React forms, buttons, dialogs)
2. Next.js page rendering
3. Internationalization (next-intl translations)
4. File upload flows (Convex storage API)
5. Audit log queries (read-only, low risk)
6. Session fingerprinting (FingerprintJS library)
7. Client-side routing
8. Styling/Tailwind classes

**Why skip**: These are either low-risk, tested by frameworks, or have visible failures (UI breaks are obvious to users).

---

## Test Directory Structure

```
/tests/
├── validation/
│   └── client-validation.test.ts      # PRIORITY 1 - MUST HAVE
├── convex/
│   ├── rate-limit.test.ts             # PRIORITY 1 - MUST HAVE
│   ├── regimeMembers.test.ts          # PRIORITY 2 - SHOULD HAVE
│   ├── victims.test.ts                # PRIORITY 2 - SHOULD HAVE
│   ├── actions.test.ts                # PRIORITY 2 - SHOULD HAVE
│   └── pendingUpdates.test.ts         # PRIORITY 2 - SHOULD HAVE
└── integration/
    └── trust-score.test.ts            # PRIORITY 3 - NICE TO HAVE
```

---

## Implementation Steps

### Step 1: Install Dependencies
```bash
pnpm add -D vitest @vitest/ui @vitest/coverage-v8 convex-test
```

### Step 2: Create Configuration Files

**Create `vitest.config.ts`** (root):
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Update `package.json`** - Add test scripts:
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "npx convex deploy && next build",
    "start": "next start",
    "lint": "eslint",
    "check": "tsc --noEmit",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### Step 3: Write Priority 1 Tests (Validation + Rate Limiting)

**Create test directory structure:**
```bash
mkdir -p tests/validation tests/convex tests/integration
```

**Write validation tests** (`tests/validation/client-validation.test.ts`):
- Test `regimeMemberFormSchema` with valid/invalid data
- Test `victimFormSchema` with type coercion
- Test `actionFormSchema` enum validation
- Test `trimmedString()` helper rejects whitespace-only
- Test `firstZodIssueMessage()` formats errors correctly

**Write rate limiting tests** (`tests/convex/rate-limit.test.ts`):
- Test session creation with `upsertSession()`
- Test `canContribute()` returns true for new sessions
- Test `recordContribution()` increments counter
- Test 11th contribution fails rate limit
- Test counter resets after 1 hour

### Step 4: Write Priority 2 Tests (Core Mutations)

**Write regime member tests** (`tests/convex/regimeMembers.test.ts`):
- Test `create()` with valid data
- Test validation failures
- Test rate limit enforcement
- Test audit log creation
- Test trust score increments

**Repeat pattern for**:
- `tests/convex/victims.test.ts`
- `tests/convex/actions.test.ts`
- `tests/convex/pendingUpdates.test.ts`

### Step 5: Write Priority 3 Tests (Optional)

**Write trust score tests** (`tests/integration/trust-score.test.ts`):
- Test score increments/decrements
- Test bounds checking (0-100)

---

## Critical Files Reference

1. **[src/lib/client-validation.ts](../src/lib/client-validation.ts)** - Contains all Zod schemas (PRIORITY 1 testing target)
2. **[convex/sessions.ts](../convex/sessions.ts)** - Rate limiting logic (PRIORITY 1)
3. **[convex/regimeMembers.ts](../convex/regimeMembers.ts)** - Pattern reference for all create mutations (PRIORITY 2)
4. **[convex/pendingUpdates.ts](../convex/pendingUpdates.ts)** - Verification system (PRIORITY 2)
5. **[package.json](../package.json)** - Add test scripts and dependencies

---

## Success Metrics

**Coverage Goals** (pragmatic, not perfectionist):
- **Target**: 60-70% overall coverage
- **Validation**: 90%+ coverage (critical)
- **Mutations**: 70%+ coverage
- **Integration**: 50%+ coverage

**Developer Experience**:
- Tests run in <10 seconds
- Clear error messages on failures
- Simple to add new tests

**CI Integration** (future):
- Run tests on pull requests
- Not a deployment blocker initially
- Coverage report in PR comments

---

## Verification Plan

After implementing tests, verify the system works by:

### 1. Run Tests Locally
```bash
pnpm test                    # Run all tests
pnpm test:ui                 # Run with UI (great for debugging)
pnpm test:coverage           # Generate coverage report
```

### 2. Verify Test Coverage
- Check coverage report: Look for `coverage/` directory
- Ensure validation tests cover all schemas
- Ensure rate limit tests cover all edge cases

### 3. Manual Verification
- Start dev server: `pnpm dev`
- Test creating a regime member (should succeed with valid data)
- Test creating with invalid data (should fail client-side validation)
- Test creating 11 records rapidly (11th should fail rate limit)

### 4. CI Integration (Optional)
- Create `.github/workflows/test.yml` for GitHub Actions
- Run tests on every PR
- Block merges on test failures

---

## Example Test Patterns

### Validation Test Example
```typescript
import { describe, it, expect } from 'vitest';
import { regimeMemberFormSchema, firstZodIssueMessage } from '@/lib/client-validation';

describe('regimeMemberFormSchema', () => {
  it('should accept valid regime member data', () => {
    const result = regimeMemberFormSchema.parse({
      name: 'John Doe',
      organization: 'Test Org',
      unit: 'Test Unit',
      position: 'Commander',
      rank: 'General',
      status: 'active',
      lastKnownLocation: 'Tehran',
      aliases: 'Alias1, Alias2',
      photoUrls: 'http://example.com/photo.jpg',
      reason: 'Test reason'
    });

    expect(result.name).toBe('John Doe');
  });

  it('should reject empty name', () => {
    expect(() =>
      regimeMemberFormSchema.parse({
        name: '   ', // Whitespace only
        // ... other fields
      })
    ).toThrow();
  });

  it('should reject invalid status', () => {
    expect(() =>
      regimeMemberFormSchema.parse({
        // ... valid fields
        status: 'invalid-status' // Not in enum
      })
    ).toThrow();
  });

  it('should format error messages correctly', () => {
    try {
      regimeMemberFormSchema.parse({ name: '' });
    } catch (error) {
      const message = firstZodIssueMessage(error);
      expect(message).toContain('name');
    }
  });
});
```

### Convex Mutation Test Example
```typescript
import { convexTest } from 'convex-test';
import { describe, it, expect } from 'vitest';
import schema from '../../convex/schema';
import { create } from '../../convex/regimeMembers';
import { upsertSession } from '../../convex/sessions';

describe('regimeMembers.create', () => {
  it('should create regime member with valid data', async () => {
    const t = convexTest(schema);

    // Setup session first
    await t.mutation(upsertSession, {
      sessionId: 'test-session',
      fingerprint: 'test-fp',
      ipHash: 'test-ip',
      userAgent: 'test-ua'
    });

    const id = await t.mutation(create, {
      name: 'Test Member',
      aliases: [],
      photoUrls: [],
      organization: 'Test Org',
      unit: 'Test Unit',
      position: 'Commander',
      rank: 'General',
      status: 'active',
      lastKnownLocation: 'Tehran',
      createdBySession: 'test-session',
      ipHash: 'test-ip',
      userAgent: 'test-ua',
      reason: 'Test reason'
    });

    expect(id).toBeDefined();
  });

  it('should enforce rate limiting', async () => {
    const t = convexTest(schema);

    // Setup session
    await t.mutation(upsertSession, {
      sessionId: 'test-session',
      fingerprint: 'test-fp',
      ipHash: 'test-ip',
      userAgent: 'test-ua'
    });

    // Create 10 records (should succeed)
    for (let i = 0; i < 10; i++) {
      await t.mutation(create, {
        // ... valid data
      });
    }

    // 11th should fail
    await expect(
      t.mutation(create, {
        // ... valid data
      })
    ).rejects.toThrow('Rate limit');
  });
});
```

### Rate Limiting Test Example
```typescript
import { convexTest } from 'convex-test';
import { describe, it, expect, beforeEach } from 'vitest';
import schema from '../../convex/schema';
import { upsertSession, canContribute, recordContribution } from '../../convex/sessions';

describe('Rate Limiting', () => {
  it('should allow contributions for new sessions', async () => {
    const t = convexTest(schema);

    await t.mutation(upsertSession, {
      sessionId: 'new-session',
      fingerprint: 'fp',
      ipHash: 'ip',
      userAgent: 'ua'
    });

    const result = await t.query(canContribute, {
      sessionId: 'new-session'
    });

    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(10);
  });

  it('should decrement remaining count on contribution', async () => {
    const t = convexTest(schema);

    await t.mutation(upsertSession, {
      sessionId: 'test-session',
      fingerprint: 'fp',
      ipHash: 'ip',
      userAgent: 'ua'
    });

    await t.mutation(recordContribution, {
      sessionId: 'test-session'
    });

    const result = await t.query(canContribute, {
      sessionId: 'test-session'
    });

    expect(result.remaining).toBe(9);
  });

  it('should reset counter after 1 hour', async () => {
    const t = convexTest(schema);

    // Setup session with old lastSeen timestamp
    // ... test implementation
  });
});
```

---

## Timeline Estimate

- **Week 1**: Install dependencies, write Priority 1 tests (validation + rate limiting)
- **Week 2**: Write Priority 2 tests (core mutations + verification)
- **Week 3** (Optional): Write Priority 3 tests, set up CI

**First milestone**: Run `pnpm test` successfully with Priority 1 tests passing

---

## Notes

- This is a **minimal, pragmatic approach** - not comprehensive testing
- Focus is on **data integrity and core business logic**
- UI and visual testing is explicitly skipped to avoid over-engineering
- Can expand to E2E testing (Playwright) later if needed
- Coverage targets are realistic (60-70%) not perfectionist (100%)

---

**Document Version**: 1.0
**Last Updated**: 2026-01-30
**Related Documentation**:
- [DATA_MODEL_RESEARCH.md](./DATA_MODEL_RESEARCH.md)
- [SCHEMA_OPTIMIZATION_PLAN.md](./SCHEMA_OPTIMIZATION_PLAN.md)
