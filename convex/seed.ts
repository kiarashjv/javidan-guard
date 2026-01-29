import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seed = mutation({
  args: {
    confirm: v.literal("SEED_DATABASE"),
  },
  handler: async (ctx) => {
    const now = Date.now();

    const sessionId = "seed-session";

    const member1 = await ctx.db.insert("regimeMembers", {
      name: "Reza Farhadi",
      aliases: ["Farhadi"],
      photoUrls: [],
      organization: "IRGC",
      unit: "Tehran Unit 3",
      position: "Commander",
      rank: "Colonel",
      status: "active",
      lastKnownLocation: "Tehran",
      createdAt: now,
      createdBySession: sessionId,
      currentVersion: true,
      supersededBy: null,
      verificationCount: 0,
      previousVersions: [],
    });

    const member2 = await ctx.db.insert("regimeMembers", {
      name: "Nima Sadeghi",
      aliases: ["Sadeghi"],
      photoUrls: [],
      organization: "Basij",
      unit: "District 7",
      position: "Unit Lead",
      rank: "Captain",
      status: "unknown",
      lastKnownLocation: "Mashhad",
      createdAt: now,
      createdBySession: sessionId,
      currentVersion: true,
      supersededBy: null,
      verificationCount: 0,
      previousVersions: [],
    });

    const victim1 = await ctx.db.insert("victims", {
      name: "Sara Kamali",
      age: 24,
      photoUrls: [],
      hometown: "Isfahan",
      status: "murdered",
      incidentDate: "2025-10-03",
      incidentLocation: "Isfahan",
      circumstances: "Protest response at central square.",
      evidenceLinks: [],
      newsReports: [],
      witnessAccounts: ["Witness reported use of live ammunition."],
      linkedPerpetrators: [member1],
      createdAt: now,
      createdBySession: sessionId,
      currentVersion: true,
      supersededBy: null,
      verificationCount: 0,
      previousVersions: [],
    });

    const victim2 = await ctx.db.insert("victims", {
      name: "Arman Rahimi",
      age: 19,
      photoUrls: [],
      hometown: "Shiraz",
      status: "vanished",
      incidentDate: "2025-11-12",
      incidentLocation: "Shiraz",
      circumstances: "Detained during nighttime raid.",
      evidenceLinks: [],
      newsReports: [],
      witnessAccounts: ["Neighbors reported masked agents."],
      linkedPerpetrators: [member2],
      createdAt: now,
      createdBySession: sessionId,
      currentVersion: true,
      supersededBy: null,
      verificationCount: 0,
      previousVersions: [],
    });

    const action1 = await ctx.db.insert("actions", {
      perpetratorId: member1,
      victimIds: [victim1],
      date: "2025-10-03",
      location: "Isfahan",
      description: "Security forces dispersed protesters using live fire.",
      actionType: "killing",
      evidenceUrls: [],
      videoLinks: [],
      documentLinks: [],
      witnessStatements: ["Videos show uniformed units firing."],
      createdAt: now,
      createdBySession: sessionId,
      currentVersion: true,
      supersededBy: null,
      verificationCount: 0,
      previousVersions: [],
    });

    const action2 = await ctx.db.insert("actions", {
      perpetratorId: member2,
      victimIds: [victim2],
      date: "2025-11-12",
      location: "Shiraz",
      description: "Mass detentions during a nighttime operation.",
      actionType: "arrest",
      evidenceUrls: [],
      videoLinks: [],
      documentLinks: [],
      witnessStatements: ["Multiple reports of unmarked vehicles."],
      createdAt: now,
      createdBySession: sessionId,
      currentVersion: true,
      supersededBy: null,
      verificationCount: 0,
      previousVersions: [],
    });

    return {
      regimeMembers: [member1, member2],
      victims: [victim1, victim2],
      actions: [action1, action2],
    };
  },
});
