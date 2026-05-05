import { getTable, CREDIT_CAP } from "@/lib/db";

export function getCompletedCodes(studentId) {
  return getTable("ENROLLMENT")
    .filter((e) => e.student_id === studentId && e.status === "completed")
    .map((e) => e.course_code);
}

export function getPlanned(studentId) {
  return getTable("PLANNED_ENROLLMENT").filter((p) => p.student_id === studentId);
}

export function prereqsFor(courseCode) {
  return getTable("PREREQUISITE")
    .filter((p) => p.course_code === courseCode)
    .map((p) => p.prerequisite_course_code);
}

export function isEligible(courseCode, completedCodes) {
  const reqs = prereqsFor(courseCode);
  const missing = reqs.filter((r) => !completedCodes.includes(r));
  return { eligible: missing.length === 0, missing };
}

export function eligibleCourses(studentId) {
  const completed = getCompletedCodes(studentId);
  const courses = getTable("COURSE");
  return courses
    .filter((c) => !completed.includes(c.course_code))
    .map((c) => ({ ...c, ...isEligible(c.course_code, completed) }));
}

export function plannedCredits(studentId) {
  const planned = getPlanned(studentId);
  const courses = getTable("COURSE");
  return planned.reduce((sum, p) => {
    const c = courses.find((x) => x.course_code === p.course_code);
    return sum + (c?.credit_hours ?? 0);
  }, 0);
}

export { CREDIT_CAP };
