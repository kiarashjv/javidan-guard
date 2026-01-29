import { mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";

export const seed = mutation({
  args: {
    confirm: v.literal("SEED_DATABASE"),
  },
  handler: async (ctx) => {
    const now = Date.now();
    const sessionId = "seed-session";

    const membersData = [
      {
        name: "Reza Farhadi",
        aliases: ["Farhadi"],
        organization: "IRGC",
        unit: "Tehran Unit 3",
        position: "Commander",
        rank: "Colonel",
        status: "active" as const,
        lastKnownLocation: "Tehran",
      },
      {
        name: "Nima Sadeghi",
        aliases: ["Sadeghi"],
        organization: "Basij",
        unit: "District 7",
        position: "Unit Lead",
        rank: "Captain",
        status: "unknown" as const,
        lastKnownLocation: "Mashhad",
      },
      {
        name: "Arash Kiani",
        aliases: ["Kiani"],
        organization: "Law Enforcement",
        unit: "Special Response",
        position: "Operations Lead",
        rank: "Major",
        status: "active" as const,
        lastKnownLocation: "Karaj",
      },
      {
        name: "Mitra Jalali",
        aliases: ["Jalali"],
        organization: "IRGC",
        unit: "Intelligence Unit",
        position: "Analyst",
        rank: "Lieutenant",
        status: "fled" as const,
        lastKnownLocation: "Unknown",
      },
      {
        name: "Pouya Rahmani",
        aliases: ["Rahmani"],
        organization: "Basij",
        unit: "City Zone 2",
        position: "Recruiter",
        rank: "Sergeant",
        status: "arrested" as const,
        lastKnownLocation: "Tabriz",
      },
      {
        name: "Shahin Moradi",
        aliases: ["Moradi"],
        organization: "IRGC",
        unit: "Aerospace Support",
        position: "Logistics",
        rank: "Captain",
        status: "active" as const,
        lastKnownLocation: "Qom",
      },
    ];

    const memberIds: Id<"regimeMembers">[] = [];
    for (const member of membersData) {
      const id = await ctx.db.insert("regimeMembers", {
        name: member.name,
        aliases: member.aliases,
        photoUrls: [],
        organization: member.organization,
        unit: member.unit,
        position: member.position,
        rank: member.rank,
        status: member.status,
        lastKnownLocation: member.lastKnownLocation,
        createdAt: now,
        createdBySession: sessionId,
        currentVersion: true,
        supersededBy: null,
        verificationCount: 0,
        previousVersions: [],
      });
      memberIds.push(id);
    }

    const victimsData = [
      {
        name: "Sara Kamali",
        age: 24,
        hometown: "Isfahan",
        status: "murdered" as const,
        incidentDate: "2025-10-03",
        incidentLocation: "Isfahan",
        circumstances: "Protest response at central square.",
        witnessAccounts: ["Witness reported use of live ammunition."],
        linkedPerpetrators: [memberIds[0]],
      },
      {
        name: "Arman Rahimi",
        age: 19,
        hometown: "Shiraz",
        status: "vanished" as const,
        incidentDate: "2025-11-12",
        incidentLocation: "Shiraz",
        circumstances: "Detained during nighttime raid.",
        witnessAccounts: ["Neighbors reported masked agents."],
        linkedPerpetrators: [memberIds[1]],
      },
      {
        name: "Leyla Norouzi",
        age: 31,
        hometown: "Tehran",
        status: "captured" as const,
        incidentDate: "2025-09-22",
        incidentLocation: "Tehran",
        circumstances: "Arrested during a protest march.",
        witnessAccounts: ["Video shows security detaining multiple people."],
        linkedPerpetrators: [memberIds[2]],
      },
      {
        name: "Kian Tavakoli",
        age: 27,
        hometown: "Karaj",
        status: "released" as const,
        incidentDate: "2025-08-17",
        incidentLocation: "Karaj",
        circumstances: "Released after short detention.",
        witnessAccounts: ["Family confirmed release after 48 hours."],
        linkedPerpetrators: [memberIds[3]],
      },
      {
        name: "Samira Yazdi",
        age: 22,
        hometown: "Tabriz",
        status: "confirmed_dead" as const,
        incidentDate: "2025-12-01",
        incidentLocation: "Tabriz",
        circumstances: "Shot during crowd dispersal.",
        witnessAccounts: ["Medical staff reported fatal injuries."],
        linkedPerpetrators: [memberIds[4]],
      },
      {
        name: "Hadi Mohammadi",
        age: 29,
        hometown: "Qom",
        status: "captured" as const,
        incidentDate: "2025-07-30",
        incidentLocation: "Qom",
        circumstances: "Detained after surveillance.",
        witnessAccounts: ["Neighbors saw multiple vehicles arrive."],
        linkedPerpetrators: [memberIds[5]],
      },
      {
        name: "Neda Akbari",
        age: 26,
        hometown: "Rasht",
        status: "vanished" as const,
        incidentDate: "2025-09-10",
        incidentLocation: "Rasht",
        circumstances: "Disappeared after a checkpoint stop.",
        witnessAccounts: ["Last seen near central checkpoint."],
        linkedPerpetrators: [memberIds[0], memberIds[2]],
      },
      {
        name: "Farid Zand",
        age: 33,
        hometown: "Ahvaz",
        status: "released" as const,
        incidentDate: "2025-10-18",
        incidentLocation: "Ahvaz",
        circumstances: "Released after questioning.",
        witnessAccounts: ["Reported severe intimidation."],
        linkedPerpetrators: [memberIds[1], memberIds[5]],
      },
    ];

    const victimIds: Id<"victims">[] = [];
    for (const victim of victimsData) {
      const id = await ctx.db.insert("victims", {
        name: victim.name,
        age: victim.age,
        photoUrls: [],
        hometown: victim.hometown,
        status: victim.status,
        incidentDate: victim.incidentDate,
        incidentLocation: victim.incidentLocation,
        circumstances: victim.circumstances,
        evidenceLinks: [],
        newsReports: [],
        witnessAccounts: victim.witnessAccounts,
        linkedPerpetrators: victim.linkedPerpetrators,
        createdAt: now,
        createdBySession: sessionId,
        currentVersion: true,
        supersededBy: null,
        verificationCount: 0,
        previousVersions: [],
      });
      victimIds.push(id);
    }

    const actionsData = [
      {
        perpetratorId: memberIds[0],
        victimIds: [victimIds[0], victimIds[6]],
        date: "2025-10-03",
        location: "Isfahan",
        description: "Security forces dispersed protesters using live fire.",
        actionType: "killing" as const,
        witnessStatements: ["Videos show uniformed units firing."],
      },
      {
        perpetratorId: memberIds[1],
        victimIds: [victimIds[1], victimIds[7]],
        date: "2025-11-12",
        location: "Shiraz",
        description: "Mass detentions during a nighttime operation.",
        actionType: "arrest" as const,
        witnessStatements: ["Multiple reports of unmarked vehicles."],
      },
      {
        perpetratorId: memberIds[2],
        victimIds: [victimIds[2]],
        date: "2025-09-22",
        location: "Tehran",
        description: "Protesters were detained after a march.",
        actionType: "arrest" as const,
        witnessStatements: ["Crowd reported baton use."],
      },
      {
        perpetratorId: memberIds[3],
        victimIds: [victimIds[3]],
        date: "2025-08-17",
        location: "Karaj",
        description: "Intelligence units monitored and detained activists.",
        actionType: "other" as const,
        witnessStatements: ["Reports of surveillance over weeks."],
      },
      {
        perpetratorId: memberIds[4],
        victimIds: [victimIds[4]],
        date: "2025-12-01",
        location: "Tabriz",
        description: "Crowd dispersal escalated to lethal force.",
        actionType: "killing" as const,
        witnessStatements: ["Emergency services reported fatalities."],
      },
      {
        perpetratorId: memberIds[5],
        victimIds: [victimIds[5]],
        date: "2025-07-30",
        location: "Qom",
        description: "Targeted detention following protests.",
        actionType: "arrest" as const,
        witnessStatements: ["Witnesses described coordinated raid."],
      },
    ];

    const actionIds: Id<"actions">[] = [];
    for (const action of actionsData) {
      const id = await ctx.db.insert("actions", {
        perpetratorId: action.perpetratorId,
        victimIds: action.victimIds,
        date: action.date,
        location: action.location,
        description: action.description,
        actionType: action.actionType,
        evidenceUrls: [],
        videoLinks: [],
        documentLinks: [],
        witnessStatements: action.witnessStatements,
        createdAt: now,
        createdBySession: sessionId,
        currentVersion: true,
        supersededBy: null,
        verificationCount: 0,
        previousVersions: [],
      });
      actionIds.push(id);
    }

    return {
      regimeMembers: memberIds,
      victims: victimIds,
      actions: actionIds,
    };
  },
});
