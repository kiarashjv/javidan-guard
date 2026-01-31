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
  lastKnownProvince?: string;
  lastKnownCity?: string;
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
  hometownProvince?: string;
  hometownCity?: string;
  hometown: string;
  status: VictimStatus;
  incidentProvince?: string;
  incidentCity?: string;
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
