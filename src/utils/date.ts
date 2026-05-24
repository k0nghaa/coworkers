export const formatDate = (isoDate: string) => {
  const dateObj = new Date(isoDate);
  return dateObj.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  });
};

export const formatTime = (date: string | Date) => {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return dateObj.toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Seoul",
  });
};

export const formatListHeaderDate = (isoDate: string) => {
  const dateObj = new Date(isoDate);
  return dateObj.toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Seoul",
  });
};

// 날짜 이동 유틸
export const addDays = (date: Date, diff: number) => {
  const next = new Date(date);
  next.setDate(date.getDate() + diff);
  return next;
};

/** yyyy-mm-dd 형식으로 변환하기 위한 유틸
 *  getTaskList에서 date 파라미터로 사용하기 위함
 */
export const getTodayDate = () => {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" });
};
