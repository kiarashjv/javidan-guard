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
  },
} as const;
