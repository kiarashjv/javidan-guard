export type PendingUpdateDraft = {
  targetCollection: "regimeMembers" | "victims" | "actions";
  targetId: string;
  proposedChanges: Record<string, unknown>;
  reason: string;
};

export function serializeChanges(changes: Record<string, unknown>) {
  return JSON.stringify(changes);
}
