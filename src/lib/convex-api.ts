import { makeFunctionReference } from "convex/server";
import type { RegimeMember, Victim } from "@/types/records";

export const api = {
  regimeMembers: {
    listCurrent: makeFunctionReference<"query", Record<string, never>, RegimeMember[]>(
      "regimeMembers:listCurrent"
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
    listCurrent: makeFunctionReference<"query", Record<string, never>, Victim[]>(
      "victims:listCurrent"
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
    listCurrent: makeFunctionReference<"query", Record<string, never>, unknown[]>(
      "actions:listCurrent"
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
        requiredVerifications: number;
        currentVerifications: number;
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
        requiredVerifications: number;
        currentVerifications: number;
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
} as const;
