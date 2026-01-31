export function formatIranLocation(
  province?: string | null,
  city?: string | null,
): string {
  const cleanProvince = province?.trim() ?? "";
  const cleanCity = city?.trim() ?? "";
  if (cleanProvince && cleanCity) {
    return `${cleanProvince} - ${cleanCity}`;
  }
  if (cleanProvince) {
    return cleanProvince;
  }
  if (cleanCity) {
    return cleanCity;
  }
  return "";
}
