export type PendingUpdateDraft = {
  targetCollection: "regimeMembers" | "victims" | "actions";
  targetId: string;
  proposedChanges: Record<string, string>;
  reason: string;
};

export function serializeChanges(changes: Record<string, string>) {
  return JSON.stringify(changes);
}
