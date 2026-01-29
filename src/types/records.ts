export type RegimeMemberStatus =
  | "active"
  | "arrested"
  | "fled"
  | "deceased"
  | "unknown";

export type VictimStatus =
  | "murdered"
  | "captured"
  | "vanished"
  | "released"
  | "confirmed_dead";

export type BaseRecord = {
  _id: string;
  _creationTime: number;
};

export type RegimeMember = BaseRecord & {
  name: string;
  aliases: string[];
  photoUrls: string[];
  organization: string;
  unit: string;
  position: string;
  rank: string;
  status: RegimeMemberStatus;
  lastKnownLocation: string;
  createdAt: number;
  createdBySession: string;
  currentVersion: boolean;
  supersededBy: string | null;
  verificationCount: number;
  previousVersions: string[];
};

export type Victim = BaseRecord & {
  name: string;
  age: number;
  photoUrls: string[];
  hometown: string;
  status: VictimStatus;
  incidentDate: string;
  incidentLocation: string;
  circumstances: string;
  evidenceLinks: string[];
  newsReports: string[];
  witnessAccounts: string[];
  linkedPerpetrators: string[];
  createdAt: number;
  createdBySession: string;
  currentVersion: boolean;
  supersededBy: string | null;
  verificationCount: number;
  previousVersions: string[];
};
