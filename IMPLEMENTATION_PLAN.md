# Gard-e Javidan - Implementation Plan

## Project Overview
A public platform for documenting Iranian regime members and victims, with emphasis on data integrity, historical preservation, anonymity, and verification-based editing.

## Technology Stack
- **Frontend**: Next.js 14+ (App Router) + React + TypeScript
- **Backend/Database**: Convex (real-time database with live updates)
- **Authentication**: Anonymous sessions using browser fingerprinting
- **File Storage**: Convex file storage for photos/evidence
- **Internationalization**: next-intl or react-i18next (Farsi primary, English secondary)
- **Backup**: Automated backups every 15 minutes to external storage
- **Deployment**: Vercel (frontend) + Convex Cloud (backend)
- **Admin**: Convex Dashboard (no custom admin panel needed)

## Core Architecture Principles
1. **Immutability**: Never delete data, only mark as superseded
2. **Auditability**: Every change tracked with full history
3. **Verification**: Updates require 3 confirmations before becoming primary
4. **Anonymity**: No PII collection, browser fingerprinting only
5. **Resilience**: Multiple backup layers prevent data loss

## Data Model (Convex Schema)

### 1. Regime Members Collection
```typescript
regimeMembers: {
  // Identity
  name: string
  aliases: string[]
  photoUrls: string[]

  // Role
  organization: string  // e.g., "IRGC", "Basij", "Police"
  unit: string
  position: string
  rank: string

  // Status
  status: "active" | "arrested" | "fled" | "deceased" | "unknown"
  lastKnownLocation: string

  // Metadata
  createdAt: number
  createdBySession: string
  currentVersion: boolean
  supersededBy: Id<"regimeMembers"> | null
  verificationCount: number

  // History tracking
  previousVersions: Id<"regimeMembers">[]
}
```

### 2. Victims Collection
```typescript
victims: {
  // Identity
  name: string
  age: number
  photoUrls: string[]
  hometown: string

  // Status
  status: "murdered" | "captured" | "vanished" | "released" | "confirmed_dead"

  // Incident
  incidentDate: string
  incidentLocation: string
  circumstances: string

  // Evidence
  evidenceLinks: string[]
  newsReports: string[]
  witnessAccounts: string[]

  // Connections
  linkedPerpetrators: Id<"regimeMembers">[]

  // Metadata
  createdAt: number
  createdBySession: string
  currentVersion: boolean
  supersededBy: Id<"victims"> | null
  verificationCount: number

  // History tracking
  previousVersions: Id<"victims">[]
}
```

### 3. Actions/Incidents Collection
```typescript
actions: {
  perpetratorId: Id<"regimeMembers">
  victimIds: Id<"victims">[]

  date: string
  location: string
  description: string
  actionType: "killing" | "torture" | "arrest" | "assault" | "other"

  // Evidence
  evidenceUrls: string[]
  videoLinks: string[]
  documentLinks: string[]
  witnessStatements: string[]

  // Metadata
  createdAt: number
  createdBySession: string
  currentVersion: boolean
  supersededBy: Id<"actions"> | null
  verificationCount: number

  previousVersions: Id<"actions">[]
}
```

### 4. Pending Updates Collection
```typescript
pendingUpdates: {
  targetCollection: "regimeMembers" | "victims" | "actions"
  targetId: Id<any>
  proposedChanges: object  // The updated fields

  // Verification
  requiredVerifications: number  // Always 3
  currentVerifications: number
  verifiedBySessions: string[]

  // Status
  status: "pending" | "approved" | "rejected" | "expired"

  // Metadata
  proposedBy: string  // session ID
  proposedAt: number
  expiresAt: number  // Auto-expire after 30 days
  reason: string  // Why this update is needed
}
```

### 5. Audit Log Collection
```typescript
auditLogs: {
  action: "create" | "update" | "verify" | "reject"
  collection: string
  documentId: Id<any>

  changes: object  // What changed
  sessionId: string
  timestamp: number

  // Context
  ipHash: string  // Hashed, not stored plaintext
  userAgent: string
  reason: string
}
```

### 6. Sessions Collection
```typescript
sessions: {
  sessionId: string  // Generated fingerprint
  fingerprint: string  // Browser fingerprint hash

  firstSeen: number
  lastSeen: number

  // Activity tracking (for spam prevention)
  contributionCount: number
  verificationCount: number

  // Reputation (simple spam prevention)
  trustScore: number  // 0-100, starts at 50

  // Privacy
  ipHash: string  // Never store actual IP
}
```

### 7. Backups Metadata Collection
```typescript
backups: {
  timestamp: number
  backupType: "scheduled" | "manual" | "pre-restore"
  status: "in_progress" | "completed" | "failed"

  recordCounts: {
    regimeMembers: number
    victims: number
    actions: number
    pendingUpdates: number
    auditLogs: number
  }

  storageLocation: string
  checksumHash: string
}
```

## Key Features Implementation

### 1. Verification System Workflow

**Initial Creation (No verification needed):**
1. User submits new entry
2. Generate anonymous session ID
3. Create document with `currentVersion: true`, `verificationCount: 0`
4. Log to audit log
5. Document appears immediately on platform

**Update Workflow (Requires 3 verifications):**
1. User proposes update to existing entry
2. Create `pendingUpdate` document with proposed changes
3. Display pending update in UI with "Verify This Update" button
4. Other users can verify (max 1 verification per session)
5. When 3 verifications reached:
   - Create new version of document
   - Set old document's `currentVersion: false`
   - Set old document's `supersededBy: newDocId`
   - Add old doc ID to new doc's `previousVersions` array
   - Delete pending update
   - Log to audit log

**Historical View:**
- Users can view all previous versions of any entry
- Show timeline of changes with verification counts
- Display who proposed changes (anonymous session IDs)

### 2. Anonymous Session System

**Session Generation:**
```typescript
// Use FingerprintJS or similar
import FingerprintJS from '@fingerprintjs/fingerprintjs'

const fp = await FingerprintJS.load()
const result = await fp.get()
const sessionId = result.visitorId

// Store in localStorage and Convex
```

**Privacy Measures:**
- Never store IP addresses (only hashed)
- No cookies except session ID
- No analytics/tracking scripts
- No user accounts or emails
- Session IDs are cryptographic hashes

**Spam Prevention:**
- Rate limiting: Max 10 contributions per hour per session
- Trust score system: New sessions start at 50/100
- Suspicious patterns (rapid edits, always-rejecting) lower trust score
- Low trust sessions may require more verifications

### 3. Backup Strategy

**Automated Backups (Every 15 minutes):**
```typescript
// Convex scheduled function
import { cronJobs } from "convex/server"

export default cronJobs()

cronJobs.interval(
  "backup",
  { minutes: 15 },
  internal.backups.performBackup
)
```

**Backup Process:**
1. Export all collections to JSON
2. Generate checksum hash
3. Upload to:
   - Primary: Convex file storage
   - Secondary: Host server storage (via API endpoint)
   - Tertiary: Optional IPFS for decentralization
4. Record backup metadata
5. Retain backups for 90 days minimum

**Restore Capability:**
- Managed via Convex Dashboard (no custom admin panel needed)
- Convex provides point-in-time recovery
- External backups can be manually restored via Convex CLI
- Preview restore changes before applying

### 4. Security Measures

**Data Protection:**
- HTTPS only (enforced)
- Content Security Policy headers
- No external scripts (except Convex)
- XSS protection on all inputs
- SQL injection prevention (Convex handles this)

**DDoS Mitigation:**
- Rate limiting per session
- Cloudflare in front of deployment
- Convex auto-scaling handles load

**Anonymity Protection:**
- No logs that could identify users
- Tor-friendly (works without JavaScript for viewing)
- No third-party tracking
- Self-host option available

**Data Integrity:**
- Checksums for all media uploads
- Version control for all changes
- Immutable audit logs
- Multi-region Convex replication

### 5. Internationalization (i18n)

**Language Support:**
- **Primary**: Persian/Farsi (فارسی)
- **Secondary**: English
- Language switcher in header

**Implementation with next-intl:**
```typescript
// app/[locale]/layout.tsx structure
// Supports /fa/* and /en/* routes

// Example translation files:
// messages/fa.json - Farsi translations
// messages/en.json - English translations
```

**Key Considerations:**
- RTL (Right-to-Left) support for Farsi
- Date formatting for Persian calendar
- Number formatting (Persian vs Western numerals)
- Form validation messages in both languages
- Evidence/witness statement fields support both languages
- Language preference stored in localStorage
- Default to Farsi based on browser locale

**Translation Coverage:**
- All UI labels and buttons
- Form field labels and placeholders
- Error messages and validation
- Status indicators
- Navigation menu
- Footer and legal text
- Instructions and help text

**RTL/LTR Styling:**
```typescript
// Automatic direction switching
<html lang={locale} dir={locale === 'fa' ? 'rtl' : 'ltr'}>

// Tailwind CSS with logical properties
// Use 'start' and 'end' instead of 'left' and 'right'
// e.g., ps-4 (padding-inline-start) instead of pl-4
```

**Technical Implementation:**
- Use Tailwind CSS logical properties (ps, pe, ms, me, etc.)
- Automatically flip layout direction based on locale
- Mirror UI elements (navigation, buttons, icons) for RTL
- Keep numbers and dates culturally appropriate
- Test both RTL and LTR layouts thoroughly

## Project Structure

```
iran-revolution-platform/
├── convex/
│   ├── schema.ts                 # Convex schema definition
│   ├── regimeMembers.ts          # Regime member queries/mutations
│   ├── victims.ts                # Victim queries/mutations
│   ├── actions.ts                # Action/incident queries/mutations
│   ├── pendingUpdates.ts         # Verification system logic
│   ├── sessions.ts               # Anonymous session management
│   ├── backups.ts                # Backup functions
│   ├── auditLogs.ts              # Audit logging
│   ├── crons.ts                  # Scheduled jobs (backups)
│   └── _generated/               # Convex generated types
│
├── messages/                     # i18n translation files
│   ├── fa.json                   # Farsi translations
│   └── en.json                   # English translations
│
├── src/
│   ├── app/
│   │   ├── [locale]/             # Locale-based routing
│   │   │   ├── layout.tsx        # Locale layout with RTL support
│   │   │   ├── page.tsx          # Home page
│   │   │   ├── regime-members/   # Regime members section
│   │   │   │   ├── page.tsx      # List view
│   │   │   │   ├── [id]/page.tsx # Detail view
│   │   │   │   └── [id]/history/page.tsx  # Historical versions
│   │   │   ├── victims/          # Victims section
│   │   │   │   ├── page.tsx      # List view
│   │   │   │   ├── [id]/page.tsx # Detail view
│   │   │   │   └── [id]/history/page.tsx  # Historical versions
│   │   │   └── pending/          # Pending updates view
│   │   │       └── page.tsx
│   │   │
│   │   ├── api/
│   │   │   └── backup-webhook/   # Backup storage endpoint
│   │   │       └── route.ts
│   │   │
│   │   └── layout.tsx            # Root layout
│   │
│   ├── components/
│   │   ├── forms/
│   │   │   ├── RegimeMemberForm.tsx
│   │   │   ├── VictimForm.tsx
│   │   │   └── ActionForm.tsx
│   │   ├── verification/
│   │   │   ├── PendingUpdateCard.tsx
│   │   │   └── VerificationButton.tsx
│   │   ├── history/
│   │   │   ├── VersionTimeline.tsx
│   │   │   └── VersionDiff.tsx
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── Navigation.tsx
│   │   │   └── LanguageSwitcher.tsx  # Language toggle
│   │   └── shared/
│   │       ├── DataTable.tsx
│   │       └── SearchBar.tsx
│   │
│   ├── lib/
│   │   ├── convex.ts             # Convex client setup
│   │   ├── session.ts            # Session management
│   │   ├── fingerprint.ts        # Browser fingerprinting
│   │   └── i18n.ts               # i18n configuration
│   │
│   └── types/
│       └── index.ts              # TypeScript types
│
├── public/
│   └── assets/                   # Static assets
│
├── .env.local                    # Environment variables
├── i18n.config.ts                # i18n configuration
├── middleware.ts                 # Locale detection middleware
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## Implementation Phases

### Phase 1: Foundation
1. Set up Next.js project with TypeScript
2. Configure next-intl for Farsi/English with RTL support
3. Create translation files (messages/fa.json, messages/en.json)
4. Set up language switcher component
5. Initialize Convex and define schema
6. Implement anonymous session system
7. Create basic data models and mutations
8. Set up audit logging

### Phase 2: Core Features
1. Build regime members CRUD with forms (bilingual)
2. Build victims CRUD with forms (bilingual)
3. Build actions/incidents CRUD (bilingual)
4. Implement verification system workflow
5. Create pending updates UI with translations

### Phase 3: History & Verification
1. Historical version viewing
2. Version diff visualization
3. Verification UI/UX (bilingual)
4. Timeline of changes
5. Connection between perpetrators and victims
6. Translated status indicators and labels
7. Verification UX guardrails: hide verify/reject after a user has voted; show clear status messaging; enforce duplicate-vote prevention

### Phase 4: Backup & Security
1. Implement automated backups (15-minute cron)
2. Create backup storage webhook
3. Add security headers and CSP
4. Rate limiting implementation
5. Trust score system
6. Test Convex Dashboard backup management

### Phase 5: Polish & Deploy
1. Search and filtering (bilingual)
2. Responsive design with RTL support
3. Performance optimization
4. Security audit
5. Deployment to Vercel + Convex
6. Documentation (Farsi & English)
7. Live marquee banner for recent names/news (RTL/LTR, accessible, pausable)
8. Sidebar metrics: online users, contribution counts, and other community stats

## Critical Files to Create

### 1. `i18n.config.ts` & `middleware.ts`
i18n configuration and locale detection:
- Supported locales (fa, en)
- Default locale (fa)
- Locale detection from URL
- RTL/LTR direction per locale

### 2. `messages/fa.json` & `messages/en.json`
Translation files with all UI text:
- Navigation labels
- Form fields
- Button text
- Status messages
- Error messages
- Instructions

### 3. `convex/schema.ts`
Define all Convex tables with proper indexes for queries.

### 4. `convex/pendingUpdates.ts`
Implement verification logic:
- `proposeUpdate()`
- `verifyUpdate()`
- `checkAndApproveUpdate()`
- `rejectUpdate()`

### 5. `src/lib/session.ts`
Anonymous session management:
- Generate fingerprint
- Store in localStorage
- Retrieve session ID
- Track session activity

### 6. `convex/backups.ts`
Backup implementation:
- Scheduled backup function
- Export to JSON
- Upload to storage
- Checksum generation
- Restore capability via Convex Dashboard

### 7. `src/components/layout/LanguageSwitcher.tsx`
Language toggle component:
- Switch between Farsi/English
- Persist preference in localStorage
- Update URL with locale
- Apply RTL/LTR styling

### 8. `src/components/verification/PendingUpdateCard.tsx`
Show pending updates with:
- Current vs proposed values (in selected language)
- Verification progress (X/3)
- Verify button
- Reason for update

### 9. `src/app/[locale]/regime-members/[id]/history/page.tsx`
Historical view showing:
- Timeline of all versions
- Who proposed changes
- Verification counts
- Diff view of changes
- Translated UI elements

## Testing & Verification Plan

### 1. Data Integrity Tests
- Create entry → verify it appears
- Propose update → verify pending state
- Add 3 verifications → verify approval
- Check old version still accessible
- Verify audit logs captured everything

### 2. Backup Tests
- Trigger manual backup
- Verify backup file created
- Check backup metadata recorded
- Test restore process (on test data)
- Verify checksum validation

### 3. Security Tests
- Test rate limiting (make 20 rapid requests)
- Verify no PII in database/logs
- Check session isolation
- Test XSS prevention (inject script tags)
- Verify HTTPS enforcement

### 4. Anonymity Tests
- Clear browser data, verify new session
- Check no tracking cookies
- Verify IP not stored
- Test with Tor browser
- Confirm no third-party requests

### 5. Real-world Scenario Tests
- Multiple users editing same entry
- Conflicting pending updates
- Spam attempt with same session
- Network interruption during edit
- Backup during active editing

## Security & Privacy Considerations

### Critical Safeguards
1. **No User Tracking**: Never implement analytics that could identify users
2. **Encrypted Transit**: All data over HTTPS/TLS
3. **Minimal Logs**: Only store hashed IPs, never plaintext
4. **Open Source**: Consider open-sourcing for transparency
5. **Tor Support**: Ensure platform works with Tor Browser
6. **No Telemetry**: No error tracking services that phone home
7. **Self-Hosting Option**: Provide Docker deployment option

### Operational Security
1. Use separate admin accounts for platform management
2. Implement 2FA for Convex/Vercel accounts
3. Regular security audits
4. Incident response plan
5. Secure backup encryption keys

## Backup Storage Recommendation

Given hosting constraints, implement **tiered backup strategy**:

1. **Primary**: Convex file storage (automatic, included)
2. **Secondary**: Host server filesystem via webhook
3. **Tertiary**: Optional external service (Backblaze B2, affordable S3 alternative)
4. **Quaternary**: IPFS pinning service (decentralized, censorship-resistant)

Convex provides point-in-time recovery, but external backups ensure you control the data even if Convex account is compromised.

## Deployment Notes

### Environment Variables Needed
```env
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
CONVEX_DEPLOY_KEY=your-deploy-key
BACKUP_WEBHOOK_SECRET=random-secret-string
BACKUP_STORAGE_PATH=/path/to/backups
```

### Deployment Checklist
- [ ] Convex schema deployed
- [ ] Environment variables set
- [ ] Backup cron job active
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] CSP policy set
- [ ] HTTPS enforced
- [ ] Test backup/restore
- [ ] Monitor backup success
- [ ] Document admin procedures

## Success Metrics

The platform is successful when:
1. ✅ Data is never lost (verified via backups)
2. ✅ Users can contribute anonymously
3. ✅ Verification system prevents false information
4. ✅ Historical data is accessible
5. ✅ Platform stays online despite attacks
6. ✅ Contributors feel safe using it
7. ✅ Data integrity maintained under load

## Next Steps After Approval

1. Create Next.js project with TypeScript
2. Configure next-intl with Farsi/English support
3. Set up RTL/LTR layouts and locale routing
4. Create initial translation files (fa.json, en.json)
5. Set up Convex account and initialize
6. Implement schema with all collections
7. Build anonymous session system with fingerprinting
8. Create first bilingual data entry form (regime members)
9. Implement verification workflow with pending updates
10. Set up 15-minute backup cron job
11. Configure backup webhook endpoint
12. Test data integrity and verification system
13. Deploy to staging environment (Vercel + Convex)
14. Security audit and anonymity verification
15. Production deployment with monitoring

---

## Backlog / Ideas to Revisit

### UX & Navigation
- Sidebar layout like news sites with an updates feed.
- Refresh indicator (“updated X seconds ago”) and “New updates available” banner instead of auto-refresh.
- Recent updates feed showing latest entities + verification status (no audit log exposure).

### Tables & Search
- Replace current tables with shadcn DataTable pattern (pagination, sorting, faceted filters).
- Add filters for cities/locations and structured field options.
- Improve column renderers and empty states.

### Pending Updates UX
- Inline “current vs proposed” under each field on detail pages.
- History view as a collapsible/accordion panel.

### Media & Evidence
- Upload photos/videos to Convex storage instead of links.
- Evidence previews and thumbnails.

### Location
- Map picker for incident and last-known locations.
- Map display on detail pages (Google Maps/Mapbox).

### Ops / Deployment
- Deployment docs (Vercel + Convex).
- Optional global/IP rate limiting beyond sessions.

## Platform Management

**Via Convex Dashboard:**
- Monitor database health and performance
- View backup history and status
- Trigger manual backups if needed
- Restore from backups (point-in-time recovery)
- Check query performance and logs
- Monitor rate limiting and session activity
- Review audit logs for suspicious patterns

**No Custom Admin Panel:** All administrative tasks handled through Convex's built-in dashboard, keeping the platform simple and secure.

---

**Note**: This is a sensitive platform dealing with human rights documentation. Every decision prioritizes data integrity, user safety, and historical preservation over convenience or features.
