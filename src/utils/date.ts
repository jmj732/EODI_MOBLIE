const DATE_PATTERN = /^\d{4}(-\d{2}(-\d{2})?)?$/;
const FULL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isFoundAtInput(value: string) {
  return DATE_PATTERN.test(value);
}

export function isDateString(value: string) {
  return FULL_DATE_PATTERN.test(value);
}

export function todayInKorea() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function isPastDateString(value: string) {
  return isDateString(value) && value < todayInKorea();
}
