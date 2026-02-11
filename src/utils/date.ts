const KST_TIMEZONE = "Asia/Seoul";

export const formatDate = (isoDate: string) => {
  const dateObj = new Date(isoDate);
  return dateObj.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: KST_TIMEZONE,
  });
};

export const formatListHeaderDate = (isoDate: string) => {
  const dateObj = new Date(isoDate);
  return dateObj.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: KST_TIMEZONE,
  });
};

// KST 기준 YYYY-MM-DD
export const toKstDateParam = (date: Date) =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

export const getTodayKstParam = () => toKstDateParam(new Date());

// KST 기준 YYYY-MM-DD 문자열로 날짜 더하기/빼기
export const addDaysToKstParam = (param: string, diff: number) => {
  const [year, month, day] = param.split("-").map(Number);
  if (!year || !month || !day) return param;

  const base = new Date(Date.UTC(year, month - 1, day));
  base.setUTCDate(base.getUTCDate() + diff);
  return toKstDateParam(base);
};

// KST 날짜(YYYY-MM-DD) -> startDate ISO(00:00Z)
export const kstParamToStartDateISO = (param: string) =>
  `${param}T00:00:00.000Z`;
