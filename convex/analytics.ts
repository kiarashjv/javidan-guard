import { query } from "./_generated/server";

const PROVINCE_NAMES = {
  "IR-01": { en: "Gilan", fa: "گیلان" },
  "IR-02": { en: "Mazandaran", fa: "مازندران" },
  "IR-03": { en: "E. Azerbaijan", fa: "آذربایجان شرقی" },
  "IR-04": { en: "W. Azerbaijan", fa: "آذربایجان غربی" },
  "IR-05": { en: "Kermanshah", fa: "کرمانشاه" },
  "IR-06": { en: "Khuzestan", fa: "خوزستان" },
  "IR-07": { en: "Fars", fa: "فارس" },
  "IR-08": { en: "Kerman", fa: "کرمان" },
  "IR-09": { en: "Razavi Khorasan", fa: "خراسان رضوی" },
  "IR-10": { en: "Isfahan", fa: "اصفهان" },
  "IR-11": { en: "Sistan & Baluchestan", fa: "سیستان و بلوچستان" },
  "IR-12": { en: "Kurdistan", fa: "کردستان" },
  "IR-13": { en: "Hamadan", fa: "همدان" },
  "IR-14": { en: "Chaharmahal & Bakhtiari", fa: "چهارمحال و بختیاری" },
  "IR-15": { en: "Lorestan", fa: "لرستان" },
  "IR-16": { en: "Ilam", fa: "ایلام" },
  "IR-17": { en: "Kohgiluyeh & Boyer-Ahmad", fa: "کهگیلویه و بویراحمد" },
  "IR-18": { en: "Bushehr", fa: "بوشهر" },
  "IR-19": { en: "Zanjan", fa: "زنجان" },
  "IR-20": { en: "Semnan", fa: "سمنان" },
  "IR-21": { en: "Yazd", fa: "یزد" },
  "IR-22": { en: "Hormozgan", fa: "هرمزگان" },
  "IR-23": { en: "Tehran", fa: "تهران" },
  "IR-24": { en: "Ardabil", fa: "اردبیل" },
  "IR-25": { en: "Qom", fa: "قم" },
  "IR-26": { en: "Qazvin", fa: "قزوین" },
  "IR-27": { en: "Golestan", fa: "گلستان" },
  "IR-28": { en: "N. Khorasan", fa: "خراسان شمالی" },
  "IR-29": { en: "S. Khorasan", fa: "خراسان جنوبی" },
  "IR-30": { en: "Alborz", fa: "البرز" },
  "IR-31": { en: "Markazi", fa: "مرکزی" },
} as const;

const NAME_TO_ISO: Record<string, string> = Object.entries(PROVINCE_NAMES)
  .reduce((acc, [iso, names]) => {
    acc[names.en.toLowerCase()] = iso;
    acc[names.fa] = iso;
    return acc;
  }, {} as Record<string, string>);

function normalizeProvinceToIso(value?: string | null) {
  if (!value) return null;
  if (value.startsWith("IR-")) return value;
  const normalized = value.trim().toLowerCase();
  if (NAME_TO_ISO[normalized]) return NAME_TO_ISO[normalized];
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
      const isoCode =
        normalizeProvinceToIso(victim.incidentProvince) ??
        normalizeProvinceToIso(victim.incidentLocation);
      if (isoCode) {
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
      const isoCode =
        normalizeProvinceToIso(action.locationProvince) ??
        normalizeProvinceToIso(action.location);
      if (isoCode) {
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
      const isoCode =
        normalizeProvinceToIso(member.lastKnownProvince) ??
        normalizeProvinceToIso(member.lastKnownLocation);
      if (isoCode) {
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
