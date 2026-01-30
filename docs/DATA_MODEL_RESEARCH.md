# Enhanced Data Model for Regime Members and Victims

## Research Summary

Based on extensive research of activist databases, human rights organizations, and recent documentation efforts during the 2025-2026 Iranian protests, I've identified critical data fields that should be added to your platform.

### Existing Documentation Databases Analyzed

1. **Spreading Justice Database (HRANA)** - Over 250 perpetrator profiles
   - Tracks: Names, photos, institutional affiliations, positions, violations, linked victims
   - Features: Searchable by violation type, institution, victim name
   - Languages: English and Farsi

2. **Iran Prison Atlas (IPA)**
   - Tracks: Biodata (gender, religion, ethnicity), judicial officials, judges, court branches
   - Features: Attribution to specific officials at different trial stages

3. **Pasdaran Documentation Project (PDP)**
   - Tracks: IRGC organizational structure, chain of command, unit hierarchies, personnel profiles
   - Approach: Progressive data accumulation with detailed unit profiles

4. **Iran Victims Database (iranvictims.com)**
   - 1,394 documented victims with searchable verified sources
   - Focus: Name, photo, incident details, family information

5. **UN Fact-Finding Mission on Iran (FFMI)**
   - 300+ victim/witness interviews
   - 38,000+ pieces of verified evidence
   - Confidential perpetrator list for national authorities

### Key Data Leaks Referenced

**IRGC Department 40 Leak (December 2025)**
- Exposed: Names, **national ID numbers**, photographs, facility addresses, organizational charts, attack reports, surveillance videos
- Significance: Shows national IDs are valuable identifiers

**69 Million Iranian Citizens Data Leak**
- Exposed: Full names, **birthday**, **national ID**, postal code, address, phone number
- Significance: National IDs are standard government identifiers

## Recommended Data Model Enhancements

### A. Regime Members (Mercenaries/Security Forces)

#### Personal Identification Fields (NEW)
```typescript
nationalId: string | null              // Iranian national ID number (کد ملی)
militaryServiceNumber: string | null   // Military service ID number
dateOfBirth: string | null             // Birth date (separate from incident date)
placeOfBirth: string | null            // Birth city/province
ethnicity: string | null               // Ethnicity (Persian, Azeri, Kurd, etc.)
religion: string | null                // Religious affiliation
gender: string | null                  // Gender
```

#### Social Media & Digital Presence (NEW)
```typescript
socialMedia: {
  telegram: string[]                   // Telegram usernames/channels
  instagram: string[]                  // Instagram handles
  twitter: string[]                    // Twitter/X handles
  other: {platform: string, handle: string}[]
}
phoneNumbers: string[]                 // Known phone numbers
emailAddresses: string[]               // Known email addresses
```

#### Family Relationships (NEW)
```typescript
familyMembers: Array<{
  relationship: "spouse" | "parent" | "child" | "sibling" | "other"
  name: string
  location: string | null              // Especially if living abroad
  notes: string | null                 // Additional context
}>
```

#### Enhanced Organizational Data (ENHANCED)
```typescript
organization: string                   // Existing: "IRGC", "Basij"
unit: string                          // Existing
subUnit: string | null                // NEW: More granular unit tracking
position: string                      // Existing
rank: string                          // Existing
militaryBranch: string | null         // NEW: "Intelligence", "Ground Forces", etc.
commandChainSuperior: Id<"regimeMembers"> | null  // NEW: Reports to whom
commandChainSubordinates: Id<"regimeMembers">[]   // NEW: Who reports to them
serviceStartDate: string | null       // NEW: When they joined
serviceEndDate: string | null         // NEW: If they left/retired
previousPositions: Array<{            // NEW: Career history
  position: string
  unit: string
  startDate: string
  endDate: string
}>
```

#### Financial & Asset Information (NEW - OPTIONAL/SENSITIVE)
```typescript
knownAssets: Array<{
  type: "property" | "vehicle" | "business" | "other"
  description: string
  location: string | null
  estimatedValue: string | null
  source: string                       // How this was documented
}>
```

**Note on Banking Information:** Banking account numbers are highly sensitive and not found in any public activist database. Recommend NOT storing actual account numbers for legal/security reasons. Asset tracking (properties, businesses) is more appropriate.

### B. Victims

#### Personal Identification Fields (NEW)
```typescript
nationalId: string | null              // Iranian national ID if known
dateOfBirth: string | null             // Birth date (separate from incident)
placeOfBirth: string | null            // Birth city/province
gender: string | null                  // Gender
ethnicity: string | null               // Ethnicity
religion: string | null                // Religious affiliation
occupation: string | null              // Job/profession
education: string | null               // Education level/institution
```

#### Family Relationships (NEW)
```typescript
familyMembers: Array<{
  relationship: "spouse" | "parent" | "child" | "sibling" | "other"
  name: string
  age: number | null
  status: "alive" | "deceased" | "unknown"
  contactable: boolean                 // Can family be contacted?
  notes: string | null
}>
```

#### Social Media & Digital Presence (NEW)
```typescript
socialMedia: {
  telegram: string[]
  instagram: string[]
  twitter: string[]
  other: {platform: string, handle: string}[]
}
lastKnownOnlineActivity: string | null  // Last social media post date
```

#### Enhanced Incident Tracking (ENHANCED)
```typescript
// Existing fields remain
incidentType: "protest_related" | "arbitrary_arrest" | "execution" | "torture" | "other"  // NEW
detentionLocation: string | null       // NEW: Where held if captured
burialLocation: string | null          // NEW: Where buried if deceased
bodyReturnedToFamily: boolean | null   // NEW: Important for documentation
ransomDemanded: number | null          // NEW: Amount demanded for body return
```

### C. Actions Table (ENHANCED)

The existing actions table links perpetrators to victims, but can be enhanced:

#### Enhanced Action Tracking
```typescript
// Existing fields remain
specificPerpetrators: Array<{          // NEW: More detailed than just perpetratorId
  regimeMemberId: Id<"regimeMembers">
  role: "ordered" | "executed" | "participated" | "witnessed" | "covered_up"
  evidence: string[]                   // Specific evidence linking this person
}>

chainOfCommand: Array<{                // NEW: Track responsibility up the chain
  regimeMemberId: Id<"regimeMembers">
  level: "direct" | "commanding" | "policy"
  responsibility: string               // Description of their role
}>

juridicalStatus: {                     // NEW: Legal tracking
  investigated: boolean
  charged: boolean
  convicted: boolean
  jurisdiction: string | null
  caseNumber: string | null
}
```

### D. New Relationships Table (NEW)

Create a dedicated relationships table for flexible tracking of connections between entities:

```typescript
relationships: defineTable({
  sourceType: v.union(v.literal("regimeMember"), v.literal("victim"))
  sourceId: v.union(v.id("regimeMembers"), v.id("victims"))
  targetType: v.union(v.literal("regimeMember"), v.literal("victim"))
  targetId: v.union(v.id("regimeMembers"), v.id("victims"))

  relationshipType: v.union(
    // Family relationships
    v.literal("family_spouse"),
    v.literal("family_parent"),
    v.literal("family_child"),
    v.literal("family_sibling"),

    // Professional/Organizational
    v.literal("commanding_officer"),
    v.literal("subordinate"),
    v.literal("colleague"),

    // Perpetrator-Victim
    v.literal("killed"),
    v.literal("tortured"),
    v.literal("arrested"),
    v.literal("witnessed_killing")
  )

  details: v.string()                  // Additional context
  evidenceLinks: v.array(v.string())   // Supporting evidence
  dateEstablished: v.string()          // When relationship existed/occurred

  // Versioning (same as other tables)
  createdAt: v.number()
  createdBySession: v.string()
  currentVersion: v.boolean()
  supersededBy: v.union(v.null(), v.id("relationships"))
  verificationCount: v.number()
  previousVersions: v.array(v.id("relationships"))
})
```

## Implementation Priority

### Phase 1: High-Priority Fields (Immediate Value)
1. **Family relationships** - Critical for documentation, highly requested
2. **Social media accounts** - Activists actively tracking this
3. **National ID numbers** - Standard identifier in leaks/documents
4. **Gender, ethnicity** - Important for demographic analysis
5. **Command chain relationships** - Essential for accountability

### Phase 2: Medium-Priority Fields (Important Context)
1. Date of birth, place of birth
2. Occupation, education (for victims)
3. Service dates, previous positions (for regime members)
4. Enhanced incident tracking (burial location, detention location)
5. Detailed perpetrator roles in actions

### Phase 3: Optional/Sensitive Fields
1. Asset information (properties, businesses)
2. Phone numbers, email addresses
3. Banking information (NOT RECOMMENDED - too sensitive)

## Critical Files to Modify

### Database Schema
- [convex/schema.ts](../convex/schema.ts) - Add new fields to regimeMembers, victims, actions tables; create relationships table

### Type Definitions
- [src/types/records.ts](../src/types/records.ts) - Update TypeScript types for RegimeMember, Victim, Action

### Convex Mutations
- [convex/regimeMembers.ts](../convex/regimeMembers.ts) - Update create/update mutations to handle new fields
- [convex/victims.ts](../convex/victims.ts) - Update create/update mutations to handle new fields
- [convex/actions.ts](../convex/actions.ts) - Update for enhanced action tracking
- Create new file: `convex/relationships.ts` - CRUD operations for relationships table

### Convex Queries
- Update query functions to include new fields in responses
- Add relationship queries (e.g., "get all family members", "get command chain")

### Pending Updates System
- [convex/pendingUpdates.ts](../convex/pendingUpdates.ts) - Add new fields to editable field lists

### UI Components
Need to create/update forms for:
- [src/app/\[locale\]/regime-members/page.tsx](../src/app/[locale]/regime-members/page.tsx) - Add form fields for new regime member data
- [src/app/\[locale\]/victims/\[id\]/page.tsx](../src/app/[locale]/victims/[id]/page.tsx) - Add form fields for new victim data
- Create new: Family relationship management UI component
- Create new: Social media accounts UI component
- Create new: Command chain visualization component

### Seed Data
- [convex/seed_enhanced.ts](../convex/seed_enhanced.ts) - Add example data with new fields

## Data Model Best Practices from Research

### 1. Progressive Data Accumulation
Following PDP's approach: Don't require all fields upfront. Allow incremental profile building as more information becomes available.

### 2. Crowdsource Verification
Current implementation already handles this well. New fields should follow same verification workflow:
- Multiple users verify additions
- Trust scores affect verification requirements
- All changes auditable

### 3. Evidence-Based Documentation
Every sensitive field (especially national IDs, family members, social media) should have:
- Source attribution
- Evidence links
- Verification status

### 4. Privacy Considerations
**Sensitive Fields Should Have:**
- Visibility controls (who can see national IDs, family info)
- Optional redaction for public views
- Strong evidence requirements before approval

**DO NOT Store:**
- Banking account numbers (too sensitive, legal risks)
- Passwords or credentials
- Unverified addresses that could endanger families

### 5. Relationship Flexibility
The dedicated relationships table allows:
- Tracking any connection between entities
- "Who killed who" relationships
- Command chain documentation
- Family network mapping
- Easy querying ("show all victims killed by X")

## Example Use Cases Enabled by New Data

### 1. Command Chain Accountability
Query: "Show everyone in the command chain responsible for killings in Tehran on January 5, 2026"
- Follows commandChainSuperior links
- Shows chain of command from on-ground perpetrator to commanding officers

### 2. Family Network Analysis
Query: "Show all regime members whose family members live abroad"
- Critical for sanctions and accountability
- Currently tracked informally by activists

### 3. Perpetrator Identification
Query: "Find regime members with Instagram handle @username"
- Activists crowdsource identification via social media
- Links online presence to documented violations

### 4. Victim Family Support
Query: "List all victims whose families can be contacted"
- Enables support organizations to reach families
- Tracks family status and needs

### 5. Pattern Analysis
Analyze:
- Which units committed the most violations
- Ethnic/demographic breakdown of victims
- Geographic patterns of violence
- Age demographics of perpetrators vs victims

## Verification & Testing Plan

### Data Integrity Tests
1. Verify relationships are bidirectional (if A is B's superior, B is A's subordinate)
2. Verify version chains remain intact with new fields
3. Test pending updates system with new field types
4. Validate that all new fields properly trigger verification workflows

### UI/UX Testing
1. Form validation for national ID format (10-digit number in Iran)
2. Social media URL validation
3. Family relationship adding/editing flows
4. Mobile responsiveness for new form fields

### Privacy/Security Testing
1. Verify sensitive fields (national ID, family info) have appropriate access controls
2. Test that evidence is required for sensitive field verification
3. Ensure no personal data leaks in public API endpoints

### Performance Testing
1. Query performance with expanded schema
2. Relationship queries at scale
3. Search functionality with additional indexed fields

## Sources & Research References

### Documentation Databases
- [Spreading Justice Database](https://spreadingjustice.org/database/)
- [Iran Prison Atlas Methodology](https://ipa.united4iran.org/en/about/methodology/)
- [The Databases Shining a Light on Iran's Human Rights Record](https://iranwire.com/en/features/70400/)
- [Iran Protest Victims 2025-2026](https://iranvictims.com/)

### Human Rights Documentation
- [Iran: Growing Evidence of Countrywide Massacres | Human Rights Watch](https://www.hrw.org/news/2026/01/16/iran-growing-evidence-of-countrywide-massacres)
- [UN Fact-Finding Mission on Iran](https://news.un.org/en/story/2026/01/1166737)
- [HURIDOCS Documentation Approaches](https://huridocs.org/2018/09/tools-for-human-rights-documentation-our-2018-snapshot/)

### Data Leaks & Intelligence
- [Department 40 Exposed: Inside the IRGC Unit](https://blog.narimangharib.com/posts/2025/11/1763938840948?lang=en)
- [Iranian-American Activists Want Relatives of Senior Regime Officials Deported](https://www.breitbart.com/immigration/2026/01/20/iranian-american-activists-want-relatives-senior-regime-officials-deported/)

### Activist Efforts
- [Atlantic Council: State Department should dox security forces](https://www.atlanticcouncil.org/blogs/iransource/to-help-protect-iranian-protesters-the-state-department-should-dox-security-forces/)
- [2025-2026 Iranian protests - Wikipedia](https://en.wikipedia.org/wiki/2025%E2%80%932026_Iranian_protests)

## User Requirements & Decisions

### Privacy Model
**Decision:** Fully public - all data visible to anyone
- No access controls or redaction needed
- Focus on strong verification requirements instead
- All sensitive data (national IDs, family info) requires robust evidence

### Financial Information
**Decision:** Track assets (property, businesses), NOT banking accounts
- Document known properties, businesses, vehicles
- No direct banking account numbers (security/legal risks)
- Asset tracking more actionable for sanctions and accountability

### Implementation Scope
**Decision:** Implement all high and medium priority fields
- Full implementation of enhanced data model
- All phases 1 and 2 fields included
- Progressive approach: fields optional, build incrementally

## Implementation Checklist

### ✅ High Priority - Phase 1 (Implement First)

**Schema Changes:**
- [ ] Add family relationships to regimeMembers table
- [ ] Add family relationships to victims table
- [ ] Add social media fields (telegram, instagram, twitter) to both tables
- [ ] Add nationalId to both tables
- [ ] Add gender, ethnicity, religion to both tables
- [ ] Add dateOfBirth, placeOfBirth to both tables
- [ ] Add command chain fields to regimeMembers (commandChainSuperior, commandChainSubordinates)
- [ ] Create new relationships table for flexible relationship tracking
- [ ] Add relationship type enums for family, professional, perpetrator-victim links

**Mutations & Queries:**
- [ ] Update regimeMembers.create() to accept new fields
- [ ] Update victims.create() to accept new fields
- [ ] Create relationships.ts with CRUD operations
- [ ] Add queries for relationship traversal (getFamily, getCommandChain, getVictims)
- [ ] Update pendingUpdates to support new editable fields

**UI Components:**
- [ ] Add family members form section (add/edit/remove family members)
- [ ] Add social media accounts form section
- [ ] Add national ID input field with validation (10-digit format)
- [ ] Add gender, ethnicity, religion dropdowns
- [ ] Add date pickers for birth dates
- [ ] Create command chain visualization component
- [ ] Create family tree/relationship viewer component

### ✅ Medium Priority - Phase 2 (Implement Second)

**Schema Changes:**
- [ ] Add occupation, education to victims table
- [ ] Add serviceStartDate, serviceEndDate to regimeMembers
- [ ] Add previousPositions array to regimeMembers
- [ ] Add militaryBranch, subUnit to regimeMembers
- [ ] Add detentionLocation, burialLocation to victims
- [ ] Add bodyReturnedToFamily, ransomDemanded to victims
- [ ] Add incidentType to victims
- [ ] Add phoneNumbers, emailAddresses arrays to both tables
- [ ] Add knownAssets array to regimeMembers (property, vehicle, business)
- [ ] Enhance actions table with specificPerpetrators and chainOfCommand arrays
- [ ] Add juridicalStatus to actions table

**Mutations & Queries:**
- [ ] Update mutations for Phase 2 fields
- [ ] Add query for asset tracking
- [ ] Add query for career history (previousPositions)
- [ ] Add enhanced action queries with chain of command

**UI Components:**
- [ ] Add career history timeline component
- [ ] Add asset tracking form section
- [ ] Add enhanced incident details form
- [ ] Add action creation form with chain of command selection
- [ ] Add juridical status tracking form

### 📝 Data Migration & Seeding
- [ ] Update seed_enhanced.ts with example data for all new fields
- [ ] Create migration strategy for existing records (add null/empty values for new fields)
- [ ] Test version control system with new fields

### ✅ Testing & Validation
- [ ] Validate national ID format (10-digit number)
- [ ] Validate social media URL formats
- [ ] Test relationship bidirectionality
- [ ] Test version chains with new fields
- [ ] Test pending updates workflow with new field types
- [ ] Test query performance with expanded schema
- [ ] Verify all new fields trigger appropriate verification requirements

## Recommendations Summary

### ✅ WILL Implement (per user decisions):
- Family relationship tracking (high priority)
- Social media account fields (high priority)
- National ID numbers with verification (high priority)
- Command chain relationships (high priority)
- Enhanced demographic data - gender, ethnicity, DOB (high priority)
- Dedicated relationships table (high priority)
- Occupation, education for victims (medium priority)
- Service dates and career history for regime members (medium priority)
- Enhanced incident tracking - detention/burial locations (medium priority)
- Asset tracking - properties, businesses, vehicles (medium priority)
- Phone numbers and email addresses (medium priority)
- Enhanced action tracking with chain of command (medium priority)
- Juridical status tracking (medium priority)

### ❌ Will NOT Implement:
- Banking account numbers (user chose asset tracking instead)
- Access controls / privacy redaction (data is fully public)
- Unverified sensitive fields without strong evidence requirements
