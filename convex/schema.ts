import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  regimeMembers: defineTable({
    name: v.string(),
    aliases: v.array(v.string()),
    photoUrls: v.array(v.string()),
    organization: v.string(),
    unit: v.string(),
    position: v.string(),
    rank: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("arrested"),
      v.literal("fled"),
      v.literal("deceased"),
      v.literal("unknown"),
    ),
    lastKnownProvince: v.optional(v.string()),
    lastKnownCity: v.optional(v.string()),
    lastKnownLocation: v.string(),
    createdAt: v.number(),
    createdBySession: v.string(),
    currentVersion: v.boolean(),
    supersededBy: v.union(v.null(), v.id("regimeMembers")),
    verificationCount: v.number(),
    previousVersions: v.array(v.id("regimeMembers")),
  })
    .index("by_current_version", ["currentVersion", "createdAt"])
    .index("by_session", ["createdBySession", "currentVersion"])
    .index("by_status", ["status", "currentVersion"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["currentVersion"],
    }),

  victims: defineTable({
    name: v.string(),
    age: v.number(),
    photoUrls: v.array(v.string()),
    hometownProvince: v.optional(v.string()),
    hometownCity: v.optional(v.string()),
    hometown: v.string(),
    status: v.union(
      v.literal("murdered"),
      v.literal("captured"),
      v.literal("vanished"),
      v.literal("released"),
      v.literal("confirmed_dead"),
    ),
    incidentProvince: v.optional(v.string()),
    incidentCity: v.optional(v.string()),
    incidentDate: v.string(),
    incidentLocation: v.string(),
    circumstances: v.string(),
    evidenceLinks: v.array(v.string()),
    newsReports: v.array(v.string()),
    witnessAccounts: v.array(v.string()),
    linkedPerpetrators: v.array(v.id("regimeMembers")),
    createdAt: v.number(),
    createdBySession: v.string(),
    currentVersion: v.boolean(),
    supersededBy: v.union(v.null(), v.id("victims")),
    verificationCount: v.number(),
    previousVersions: v.array(v.id("victims")),
  })
    .index("by_current_version", ["currentVersion", "createdAt"])
    .index("by_session", ["createdBySession", "currentVersion"])
    .index("by_status", ["status", "currentVersion"])
    .searchIndex("search_name", {
      searchField: "name",
      filterFields: ["currentVersion"],
    }),

  actions: defineTable({
    perpetratorId: v.id("regimeMembers"),
    victimIds: v.array(v.id("victims")),
    date: v.string(),
    locationProvince: v.optional(v.string()),
    locationCity: v.optional(v.string()),
    location: v.string(),
    description: v.string(),
    actionType: v.union(
      v.literal("killing"),
      v.literal("torture"),
      v.literal("arrest"),
      v.literal("assault"),
      v.literal("other"),
    ),
    evidenceUrls: v.array(v.string()),
    videoLinks: v.array(v.string()),
    documentLinks: v.array(v.string()),
    witnessStatements: v.array(v.string()),
    createdAt: v.number(),
    createdBySession: v.string(),
    currentVersion: v.boolean(),
    supersededBy: v.union(v.null(), v.id("actions")),
    verificationCount: v.number(),
    previousVersions: v.array(v.id("actions")),
  })
    .index("by_current_version", ["currentVersion", "createdAt"])
    .index("by_session", ["createdBySession", "currentVersion"])
    .index("by_perpetrator", ["perpetratorId", "currentVersion"])
    .searchIndex("search_description", {
      searchField: "description",
      filterFields: ["currentVersion"],
    }),

  pendingUpdates: defineTable({
    targetCollection: v.union(
      v.literal("regimeMembers"),
      v.literal("victims"),
      v.literal("actions"),
    ),
    targetId: v.union(v.id("regimeMembers"), v.id("victims"), v.id("actions")),
    proposedChanges: v.string(),
    requiredVerifications: v.number(),
    currentVerifications: v.number(),
    verifiedBySessions: v.array(v.string()),
    rejectedBySessions: v.array(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("expired"),
    ),
    proposedBy: v.string(),
    proposedAt: v.number(),
    expiresAt: v.number(),
    reason: v.string(),
    targetSnapshot: v.string(),
  })
    .index("by_target", ["targetCollection", "targetId", "status"])
    .index("by_status", ["status", "proposedAt"])
    .index("by_collection_status", ["targetCollection", "status", "proposedAt"]),

  auditLogs: defineTable({
    action: v.union(
      v.literal("create"),
      v.literal("update"),
      v.literal("verify"),
      v.literal("reject"),
    ),
    collection: v.string(),
    documentId: v.union(
      v.id("regimeMembers"),
      v.id("victims"),
      v.id("actions"),
      v.id("pendingUpdates"),
    ),
    changes: v.string(),
    sessionId: v.string(),
    timestamp: v.number(),
    ipHash: v.string(),
    userAgent: v.string(),
    reason: v.string(),
  })
    .index("by_session", ["sessionId", "timestamp"])
    .index("by_timestamp", ["timestamp"]),

  sessions: defineTable({
    sessionId: v.string(),
    fingerprint: v.string(),
    firstSeen: v.number(),
    lastSeen: v.number(),
    contributionCount: v.number(),
    verificationCount: v.number(),
    trustScore: v.number(),
    ipHash: v.string(),
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_fingerprint", ["fingerprint"]),

  backups: defineTable({
    timestamp: v.number(),
    backupType: v.union(
      v.literal("scheduled"),
      v.literal("manual"),
      v.literal("pre-restore"),
    ),
    status: v.union(
      v.literal("in_progress"),
      v.literal("completed"),
      v.literal("failed"),
    ),
    recordCounts: v.object({
      regimeMembers: v.number(),
      victims: v.number(),
      actions: v.number(),
      pendingUpdates: v.number(),
      auditLogs: v.number(),
    }),
    storageLocation: v.string(),
    checksumHash: v.string(),
  }),
});
