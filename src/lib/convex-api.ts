import { makeFunctionReference } from "convex/server";
import type { RegimeMember, Victim } from "@/types/records";

type PaginatedResult<T> = {
  page: T[];
  isDone: boolean;
  continueCursor?: string;
};

export const api = {
  regimeMembers: {
    listCurrent: makeFunctionReference<
      "query",
      { limit?: number },
      RegimeMember[]
    >(
      "regimeMembers:listCurrent"
    ),
    listCurrentPaginated: makeFunctionReference<
      "query",
      { paginationOpts?: { numItems: number; cursor?: string | null } },
      PaginatedResult<RegimeMember>
    >(
      "regimeMembers:listCurrentPaginated"
    ),
    getById: makeFunctionReference<
      "query",
      { id: string },
      RegimeMember | null
    >("regimeMembers:getById"),
    create: makeFunctionReference<
      "mutation",
      {
        name: string;
        aliases: string[];
        photoUrls: string[];
        organization: string;
        unit: string;
        position: string;
        rank: string;
        status: RegimeMember["status"];
        lastKnownLocation: string;
        createdBySession: string;
        ipHash: string;
        userAgent: string;
        reason: string;
      },
      string
    >("regimeMembers:create"),
  },
  victims: {
    listCurrent: makeFunctionReference<
      "query",
      { limit?: number },
      Victim[]
    >(
      "victims:listCurrent"
    ),
    listCurrentPaginated: makeFunctionReference<
      "query",
      { paginationOpts?: { numItems: number; cursor?: string | null } },
      PaginatedResult<Victim>
    >(
      "victims:listCurrentPaginated"
    ),
    getById: makeFunctionReference<"query", { id: string }, Victim | null>(
      "victims:getById"
    ),
    create: makeFunctionReference<
      "mutation",
      {
        name: string;
        age: number;
        photoUrls: string[];
        hometown: string;
        status: Victim["status"];
        incidentDate: string;
        incidentLocation: string;
        circumstances: string;
        evidenceLinks: string[];
        newsReports: string[];
        witnessAccounts: string[];
        linkedPerpetrators: string[];
        createdBySession: string;
        ipHash: string;
        userAgent: string;
        reason: string;
      },
      string
    >("victims:create"),
  },
  actions: {
    listCurrent: makeFunctionReference<
      "query",
      { limit?: number },
      unknown[]
    >(
      "actions:listCurrent"
    ),
    listCurrentPaginated: makeFunctionReference<
      "query",
      { paginationOpts?: { numItems: number; cursor?: string | null } },
      PaginatedResult<unknown>
    >(
      "actions:listCurrentPaginated"
    ),
    getById: makeFunctionReference<"query", { id: string }, unknown | null>(
      "actions:getById"
    ),
    create: makeFunctionReference<
      "mutation",
      {
        perpetratorId: string;
        victimIds: string[];
        date: string;
        location: string;
        description: string;
        actionType: "killing" | "torture" | "arrest" | "assault" | "other";
        evidenceUrls: string[];
        videoLinks: string[];
        documentLinks: string[];
        witnessStatements: string[];
        createdBySession: string;
        ipHash: string;
        userAgent: string;
        reason: string;
      },
      string
    >("actions:create"),
  },
  pendingUpdates: {
    listPending: makeFunctionReference<
      "query",
      { targetCollection: "regimeMembers" | "victims" | "actions" },
      {
        _id: string;
        targetCollection: string;
        targetId: string;
        proposedChanges: string;
        targetSnapshot?: string;
        requiredVerifications: number;
        currentVerifications: number;
        status: "pending" | "approved" | "rejected" | "expired";
        verifiedBySessions: string[];
        rejectedBySessions: string[];
        proposedAt: number;
        expiresAt: number;
        reason: string;
      }[]
    >("pendingUpdates:listPending"),
    propose: makeFunctionReference<
      "mutation",
      {
        targetCollection: "regimeMembers" | "victims" | "actions";
        targetId: string;
        proposedChanges: string;
        reason: string;
        proposedBy: string;
        ipHash: string;
        userAgent: string;
      },
      string
    >("pendingUpdates:proposeUpdate"),
    verify: makeFunctionReference<
      "mutation",
      {
        pendingUpdateId: string;
        sessionId: string;
        ipHash: string;
        userAgent: string;
      },
      number
    >("pendingUpdates:verifyUpdate"),
    reject: makeFunctionReference<
      "mutation",
      {
        pendingUpdateId: string;
        sessionId: string;
        ipHash: string;
        userAgent: string;
        reason: string;
      },
      boolean
    >("pendingUpdates:rejectUpdate"),
    listForTarget: makeFunctionReference<
      "query",
      {
        targetCollection: "regimeMembers" | "victims" | "actions";
        targetId: string;
      },
      {
        _id: string;
        targetCollection: string;
        targetId: string;
        proposedChanges: string;
        targetSnapshot?: string;
        requiredVerifications: number;
        currentVerifications: number;
        status: "pending" | "approved" | "rejected" | "expired";
        verifiedBySessions: string[];
        rejectedBySessions: string[];
        proposedAt: number;
        expiresAt: number;
        reason: string;
      }[]
    >("pendingUpdates:listPendingForTarget"),
  },
  history: {
    regimeMembers: makeFunctionReference<
      "query",
      { id: string },
      { current: RegimeMember; history: RegimeMember[] } | null
    >("history:getRegimeMemberHistory"),
    victims: makeFunctionReference<
      "query",
      { id: string },
      { current: Victim; history: Victim[] } | null
    >("history:getVictimHistory"),
    actions: makeFunctionReference<
      "query",
      { id: string },
      {
        current: {
          _id: string;
          actionType: string;
          location: string;
          date: string;
          description: string;
          createdAt: number;
        };
        history: {
          _id: string;
          actionType: string;
          location: string;
          date: string;
          description: string;
          createdAt: number;
        }[];
      } | null
    >("history:getActionHistory"),
  },
  sessions: {
    upsert: makeFunctionReference<
      "mutation",
      {
        sessionId: string;
        fingerprint: string;
        ipHash: string;
        userAgent: string;
      },
      string
    >("sessions:upsertSession"),
    canContribute: makeFunctionReference<
      "query",
      { sessionId: string },
      { allowed: boolean; remaining: number }
    >("sessions:canContribute"),
    recordContribution: makeFunctionReference<
      "mutation",
      { sessionId: string },
      boolean
    >("sessions:recordContribution"),
  },
  recent: {
    feed: makeFunctionReference<
      "query",
      { limit?: number },
      {
        _id: string;
        type: "regimeMembers" | "victims" | "actions";
        title: string;
        subtitle: string;
        status: string;
        createdAt: number;
      }[]
    >("recent:feed"),
  },
  files: {
    generateUploadUrl: makeFunctionReference<
      "mutation",
      Record<string, never>,
      string
    >("files:generateUploadUrl"),
    getUrl: makeFunctionReference<
      "mutation",
      { storageId: string },
      string | null
    >("files:getUrl"),
  },
} as const;
