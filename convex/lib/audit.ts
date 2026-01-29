import type { GenericMutationCtx, GenericDataModel } from "convex/server";
import type { GenericId } from "convex/values";

type AuditDocumentId =
  | GenericId<"regimeMembers">
  | GenericId<"victims">
  | GenericId<"actions">
  | GenericId<"pendingUpdates">;

export async function logAudit(
  ctx: GenericMutationCtx<GenericDataModel>,
  args: {
    action: "create" | "update" | "verify" | "reject";
    collection: string;
    documentId: AuditDocumentId;
    changes: string;
    sessionId: string;
    ipHash: string;
    userAgent: string;
    reason: string;
  }
) {
  await ctx.db.insert("auditLogs", {
    action: args.action,
    collection: args.collection,
    documentId: args.documentId,
    changes: args.changes,
    sessionId: args.sessionId,
    timestamp: Date.now(),
    ipHash: args.ipHash,
    userAgent: args.userAgent,
    reason: args.reason,
  });
}
