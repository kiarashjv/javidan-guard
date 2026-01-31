import { query } from "./_generated/server";

// Mapping of province names to ISO codes
const PROVINCE_TO_ISO: Record<string, string> = {
  Tehran: "IR-23",
  Isfahan: "IR-10",
  Fars: "IR-07",
  Khuzestan: "IR-06",
  "Razavi Khorasan": "IR-09",
  "East Azerbaijan": "IR-03",
  "West Azerbaijan": "IR-04",
  Kermanshah: "IR-05",
  Kerman: "IR-08",
  Gilan: "IR-01",
  Mazandaran: "IR-02",
  "Sistan and Baluchestan": "IR-11",
  Kurdistan: "IR-12",
  Hormozgan: "IR-22",
  Hamadan: "IR-13",
  Yazd: "IR-21",
  Ardabil: "IR-24",
  Markazi: "IR-00",
  Lorestan: "IR-15",
  Bushehr: "IR-18",
  Zanjan: "IR-19",
  Semnan: "IR-20",
  Ilam: "IR-16",
  "Kohgiluyeh and Boyer-Ahmad": "IR-17",
  Qazvin: "IR-26",
  Golestan: "IR-27",
  Qom: "IR-25",
  "North Khorasan": "IR-28",
  "South Khorasan": "IR-29",
  Alborz: "IR-30",
  "Chaharmahal and Bakhtiari": "IR-14",
};

// Helper to extract province from location string
function extractProvince(location: string): string | null {
  const locationLower = location.toLowerCase();

  // Try to find a matching province
  for (const province of Object.keys(PROVINCE_TO_ISO)) {
    if (locationLower.includes(province.toLowerCase())) {
      return province;
    }
  }

  return null;
}

export const getMapData = query({
  args: {},
  handler: async (ctx) => {
    // Initialize data structure
    const provinceData: Record<
      string,
      { victims: number; actions: number; mercenaries: number }
    > = {};

    // Get all current victims
    const victims = await ctx.db
      .query("victims")
      .filter((q) => q.eq(q.field("currentVersion"), true))
      .collect();

    // Count victims by province
    for (const victim of victims) {
      const province = extractProvince(victim.incidentLocation);
      if (province && PROVINCE_TO_ISO[province]) {
        const isoCode = PROVINCE_TO_ISO[province];
        if (!provinceData[isoCode]) {
          provinceData[isoCode] = { victims: 0, actions: 0, mercenaries: 0 };
        }
        provinceData[isoCode].victims++;
      }
    }

    // Get all current actions
    const actions = await ctx.db
      .query("actions")
      .filter((q) => q.eq(q.field("currentVersion"), true))
      .collect();

    // Count actions by province
    for (const action of actions) {
      const province = extractProvince(action.location);
      if (province && PROVINCE_TO_ISO[province]) {
        const isoCode = PROVINCE_TO_ISO[province];
        if (!provinceData[isoCode]) {
          provinceData[isoCode] = { victims: 0, actions: 0, mercenaries: 0 };
        }
        provinceData[isoCode].actions++;
      }
    }

    // Get all current regime members (mercenaries)
    const regimeMembers = await ctx.db
      .query("regimeMembers")
      .filter((q) => q.eq(q.field("currentVersion"), true))
      .collect();

    // Count regime members by province
    for (const member of regimeMembers) {
      const province = extractProvince(member.lastKnownLocation);
      if (province && PROVINCE_TO_ISO[province]) {
        const isoCode = PROVINCE_TO_ISO[province];
        if (!provinceData[isoCode]) {
          provinceData[isoCode] = { victims: 0, actions: 0, mercenaries: 0 };
        }
        provinceData[isoCode].mercenaries++;
      }
    }

    return provinceData;
  },
});

export const getTotalStats = query({
  args: {},
  handler: async (ctx) => {
    const [victimsCount, actionsCount, mercenariesCount] = await Promise.all([
      ctx.db
        .query("victims")
        .filter((q) => q.eq(q.field("currentVersion"), true))
        .collect()
        .then((v) => v.length),
      ctx.db
        .query("actions")
        .filter((q) => q.eq(q.field("currentVersion"), true))
        .collect()
        .then((a) => a.length),
      ctx.db
        .query("regimeMembers")
        .filter((q) => q.eq(q.field("currentVersion"), true))
        .collect()
        .then((m) => m.length),
    ]);

    return {
      victims: victimsCount,
      actions: actionsCount,
      mercenaries: mercenariesCount,
    };
  },
});
