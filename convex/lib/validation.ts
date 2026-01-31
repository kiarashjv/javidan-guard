import { z } from "zod";

const trimmedString = () => z.string().trim().min(1);

export const regimeMemberStatusSchema = z.enum([
  "active",
  "arrested",
  "fled",
  "deceased",
  "unknown",
]);

export const victimStatusSchema = z.enum([
  "murdered",
  "captured",
  "vanished",
  "released",
  "confirmed_dead",
]);

export const actionTypeSchema = z.enum([
  "killing",
  "torture",
  "arrest",
  "assault",
  "other",
]);

export const regimeMemberCreateSchema = z.object({
  name: trimmedString(),
  aliases: z.array(trimmedString()),
  photoUrls: z.array(trimmedString()),
  organization: trimmedString(),
  unit: trimmedString(),
  position: trimmedString(),
  rank: trimmedString(),
  status: regimeMemberStatusSchema,
  lastKnownProvince: trimmedString(),
  lastKnownCity: trimmedString(),
  lastKnownLocation: trimmedString(),
  createdBySession: trimmedString(),
  ipHash: trimmedString(),
  userAgent: trimmedString(),
  reason: trimmedString(),
});

export const victimCreateSchema = z.object({
  name: trimmedString(),
  age: z.number().min(0),
  photoUrls: z.array(trimmedString()),
  hometownProvince: trimmedString(),
  hometownCity: trimmedString(),
  hometown: trimmedString(),
  status: victimStatusSchema,
  incidentProvince: trimmedString(),
  incidentCity: trimmedString(),
  incidentDate: trimmedString(),
  incidentLocation: trimmedString(),
  circumstances: trimmedString(),
  evidenceLinks: z.array(trimmedString()),
  newsReports: z.array(trimmedString()),
  witnessAccounts: z.array(trimmedString()),
  linkedPerpetrators: z.array(trimmedString()),
  createdBySession: trimmedString(),
  ipHash: trimmedString(),
  userAgent: trimmedString(),
  reason: trimmedString(),
});

export const actionCreateSchema = z.object({
  perpetratorId: trimmedString(),
  victimIds: z.array(trimmedString()),
  date: trimmedString(),
  locationProvince: trimmedString(),
  locationCity: trimmedString(),
  location: trimmedString(),
  description: trimmedString(),
  actionType: actionTypeSchema,
  evidenceUrls: z.array(trimmedString()),
  videoLinks: z.array(trimmedString()),
  documentLinks: z.array(trimmedString()),
  witnessStatements: z.array(trimmedString()),
  createdBySession: trimmedString(),
  ipHash: trimmedString(),
  userAgent: trimmedString(),
  reason: trimmedString(),
});

const regimeMemberUpdateSchema = z
  .object({
    name: trimmedString().optional(),
    aliases: z.array(trimmedString()).optional(),
    photoUrls: z.array(trimmedString()).optional(),
    organization: trimmedString().optional(),
    unit: trimmedString().optional(),
    position: trimmedString().optional(),
    rank: trimmedString().optional(),
    status: regimeMemberStatusSchema.optional(),
    lastKnownProvince: trimmedString().optional(),
    lastKnownCity: trimmedString().optional(),
    lastKnownLocation: trimmedString().optional(),
  })
  .strict();

export type RegimeMemberUpdate = z.infer<typeof regimeMemberUpdateSchema>;

const victimUpdateSchema = z
  .object({
    name: trimmedString().optional(),
    age: z.number().min(0).optional(),
    photoUrls: z.array(trimmedString()).optional(),
    hometownProvince: trimmedString().optional(),
    hometownCity: trimmedString().optional(),
    hometown: trimmedString().optional(),
    status: victimStatusSchema.optional(),
    incidentProvince: trimmedString().optional(),
    incidentCity: trimmedString().optional(),
    incidentDate: trimmedString().optional(),
    incidentLocation: trimmedString().optional(),
    circumstances: trimmedString().optional(),
    evidenceLinks: z.array(trimmedString()).optional(),
    newsReports: z.array(trimmedString()).optional(),
    witnessAccounts: z.array(trimmedString()).optional(),
    linkedPerpetrators: z.array(trimmedString()).optional(),
  })
  .strict();

export type VictimUpdate = z.infer<typeof victimUpdateSchema>;

const actionUpdateSchema = z
  .object({
    perpetratorId: trimmedString().optional(),
    victimIds: z.array(trimmedString()).optional(),
    date: trimmedString().optional(),
    locationProvince: trimmedString().optional(),
    locationCity: trimmedString().optional(),
    location: trimmedString().optional(),
    description: trimmedString().optional(),
    actionType: actionTypeSchema.optional(),
    evidenceUrls: z.array(trimmedString()).optional(),
    videoLinks: z.array(trimmedString()).optional(),
    documentLinks: z.array(trimmedString()).optional(),
    witnessStatements: z.array(trimmedString()).optional(),
  })
  .strict();

export type ActionUpdate = z.infer<typeof actionUpdateSchema>;

export function validatePendingUpdate(
  targetCollection: "regimeMembers",
  proposedChanges: Record<string, unknown>
): RegimeMemberUpdate;
export function validatePendingUpdate(
  targetCollection: "victims",
  proposedChanges: Record<string, unknown>
): VictimUpdate;
export function validatePendingUpdate(
  targetCollection: "actions",
  proposedChanges: Record<string, unknown>
): ActionUpdate;
export function validatePendingUpdate(
  targetCollection: "regimeMembers" | "victims" | "actions",
  proposedChanges: Record<string, unknown>
): RegimeMemberUpdate | VictimUpdate | ActionUpdate {
  if (targetCollection === "regimeMembers") {
    return regimeMemberUpdateSchema.parse(proposedChanges);
  }
  if (targetCollection === "victims") {
    return victimUpdateSchema.parse(proposedChanges);
  }
  return actionUpdateSchema.parse(proposedChanges);
}
