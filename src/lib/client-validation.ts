import { z } from "zod";

const trimmedString = () => z.string().trim().min(1, "Required");

const regimeMemberStatusSchema = z.enum([
  "active",
  "arrested",
  "fled",
  "deceased",
  "unknown",
]);

const victimStatusSchema = z.enum([
  "murdered",
  "captured",
  "vanished",
  "released",
  "confirmed_dead",
]);

const actionTypeSchema = z.enum([
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
  lastKnownLocation: trimmedString(),
  createdBySession: trimmedString(),
  ipHash: trimmedString(),
  userAgent: trimmedString(),
  reason: trimmedString(),
});

export const regimeMemberFormSchema = z.object({
  name: trimmedString(),
  organization: trimmedString(),
  unit: trimmedString(),
  position: trimmedString(),
  rank: trimmedString(),
  status: regimeMemberStatusSchema,
  lastKnownLocation: trimmedString(),
  aliases: z.string(),
  photoUrls: z.string(),
  reason: trimmedString(),
});

export const victimCreateSchema = z.object({
  name: trimmedString(),
  age: z.number().min(0),
  photoUrls: z.array(trimmedString()),
  hometown: trimmedString(),
  status: victimStatusSchema,
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

export const victimFormSchema = z.object({
  name: trimmedString(),
  age: z.coerce.number().min(0),
  hometown: trimmedString(),
  status: victimStatusSchema,
  incidentDate: trimmedString(),
  incidentLocation: trimmedString(),
  circumstances: trimmedString(),
  evidenceLinks: z.string(),
  newsReports: z.string(),
  witnessAccounts: z.string(),
  linkedPerpetrators: z.string(),
  photoUrls: z.string(),
  reason: trimmedString(),
});

export const actionCreateSchema = z.object({
  perpetratorId: trimmedString(),
  victimIds: z.array(trimmedString()),
  date: trimmedString(),
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

export const actionFormSchema = z.object({
  actionType: actionTypeSchema,
  date: trimmedString(),
  location: trimmedString(),
  description: trimmedString(),
  perpetratorId: trimmedString(),
  victimIds: z.string(),
  evidenceUrls: z.string(),
  videoLinks: z.string(),
  documentLinks: z.string(),
  witnessStatements: z.string(),
  reason: trimmedString(),
});

export const regimeMemberUpdateSchema = z
  .object({
    name: trimmedString().optional(),
    aliases: z.array(trimmedString()).optional(),
    photoUrls: z.array(trimmedString()).optional(),
    organization: trimmedString().optional(),
    unit: trimmedString().optional(),
    position: trimmedString().optional(),
    rank: trimmedString().optional(),
    status: regimeMemberStatusSchema.optional(),
    lastKnownLocation: trimmedString().optional(),
  })
  .strict();

export const victimUpdateSchema = z
  .object({
    name: trimmedString().optional(),
    age: z.number().min(0).optional(),
    photoUrls: z.array(trimmedString()).optional(),
    hometown: trimmedString().optional(),
    status: victimStatusSchema.optional(),
    incidentDate: trimmedString().optional(),
    incidentLocation: trimmedString().optional(),
    circumstances: trimmedString().optional(),
    evidenceLinks: z.array(trimmedString()).optional(),
    newsReports: z.array(trimmedString()).optional(),
    witnessAccounts: z.array(trimmedString()).optional(),
    linkedPerpetrators: z.array(trimmedString()).optional(),
  })
  .strict();

export const actionUpdateSchema = z
  .object({
    perpetratorId: trimmedString().optional(),
    victimIds: z.array(trimmedString()).optional(),
    date: trimmedString().optional(),
    location: trimmedString().optional(),
    description: trimmedString().optional(),
    actionType: actionTypeSchema.optional(),
    evidenceUrls: z.array(trimmedString()).optional(),
    videoLinks: z.array(trimmedString()).optional(),
    documentLinks: z.array(trimmedString()).optional(),
    witnessStatements: z.array(trimmedString()).optional(),
  })
  .strict();

export function firstZodIssueMessage(error: z.ZodError): string {
  const issue = error.issues[0];
  if (!issue) {
    return "Invalid input.";
  }
  const path = issue.path.length ? issue.path.join(".") : "input";
  return `${path}: ${issue.message}`;
}
