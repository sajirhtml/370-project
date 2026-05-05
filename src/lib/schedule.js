import { getTable } from "@/lib/db";

export const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu"];
export const HOURS = Array.from({ length: 11 }, (_, i) => 8 + i);

const toMin = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

export function overlaps(a, b) {
  if (a.day !== b.day) return false;
  return toMin(a.start_time) < toMin(b.end_time) && toMin(b.start_time) < toMin(a.end_time);
}

export function sectionsForCourse(courseCode) {
  return getTable("SECTION").filter((s) => s.course_code === courseCode);
}

export function generateSchedule(plannedCourseCodes) {
  const optionLists = plannedCourseCodes.map((code) => ({
    code,
    options: sectionsForCourse(code),
  }));
  optionLists.sort((a, b) => a.options.length - b.options.length);

  const result = [];
  const conflicts = [];

  function backtrack(i) {
    if (i === optionLists.length) return true;
    const { code, options } = optionLists[i];
    for (const opt of options) {
      if (result.every((r) => !overlaps(r, opt))) {
        result.push(opt);
        if (backtrack(i + 1)) return true;
        result.pop();
      }
    }
    conflicts.push(code);
    return false;
  }

  const ok = backtrack(0);
  return { ok, picks: ok ? result : [], conflicts: ok ? [] : [...new Set(conflicts)] };
}
