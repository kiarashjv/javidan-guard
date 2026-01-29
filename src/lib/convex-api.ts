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
  },
  victims: {
    listCurrent: makeFunctionReference<"query", Record<string, never>, Victim[]>(
      "victims:listCurrent"
    ),
    getById: makeFunctionReference<"query", { id: string }, Victim | null>(
      "victims:getById"
    ),
  },
  actions: {
    listCurrent: makeFunctionReference<"query", Record<string, never>, unknown[]>(
      "actions:listCurrent"
    ),
  },
} as const;
