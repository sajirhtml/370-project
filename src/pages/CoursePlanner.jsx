import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";
import { getTable, updateTable } from "@/lib/db";
import { eligibleCourses, plannedCredits, CREDIT_CAP } from "@/lib/academic";
import { apiAddPlannedEnrollment, apiDeletePlannedEnrollment } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Check, Lock, Plus, X } from "lucide-react";
import { toast } from "sonner";

export default function CoursePlanner() {
  const { activeStudent } = useUser();
  const sid = activeStudent?.user_id;
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener("scms:change", h);
    return () => window.removeEventListener("scms:change", h);
  }, []);

  const data = useMemo(() => {
    if (!sid) return null;
    const courses = eligibleCourses(sid);
    const planned = getTable("PLANNED_ENROLLMENT").filter((p) => p.student_id === sid);
    const plannedSet = new Set(planned.map((p) => p.course_code));
    const credits = plannedCredits(sid);
    return { courses, planned, plannedSet, credits };
  }, [sid, tick]);

  if (!data) return null;
  const { courses, planned, plannedSet, credits } = data;

  const filtered = courses.filter((c) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return c.course_code.toLowerCase().includes(q) || c.title.toLowerCase().includes(q);
  });

  const addCourse = (course) => {
    if (plannedSet.has(course.course_code)) return;
    if (!course.eligible) {
      toast.error(`Missing prerequisite: ${course.missing.join(", ")}`);
      return;
    }
    if (credits + course.credit_hours > CREDIT_CAP) {
      toast.error(`Credit cap exceeded (max ${CREDIT_CAP}).`);
      return;
    }
    const row = { student_id: sid, course_code: course.course_code, section_num: null };
    updateTable("PLANNED_ENROLLMENT", (rows) => [...rows, row]);
    apiAddPlannedEnrollment(row).catch((e) => console.error("API addPlanned:", e));
    toast.success(`Added ${course.course_code}`);
  };

  const removeCourse = (code) => {
    updateTable("PLANNED_ENROLLMENT", (rows) =>
      rows.filter((p) => !(p.student_id === sid && p.course_code === code))
    );
    apiDeletePlannedEnrollment(sid, code).catch((e) => console.error("API delPlanned:", e));
  };

  const allCourses = getTable("COURSE");

  return (
    <div className="space-y-8">
      <header className="border-b border-border pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Course Planner</p>
        <h2 className="serif text-4xl mt-2">Plan next semester</h2>
        <p className="text-muted-foreground mt-2">
          Eligible courses are listed below. Locked rows show missing prerequisites.
        </p>
      </header>

      <section className="paper-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="serif text-2xl">Your selection</h3>
          <div className="text-sm">
            <span className={credits > CREDIT_CAP ? "text-destructive font-medium" : ""}>
              {credits}
            </span>
            <span className="text-muted-foreground"> / {CREDIT_CAP} credits</span>
          </div>
        </div>
        {planned.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No courses selected yet.</p>
        ) : (
          <ul className="space-y-2">
            {planned.map((p) => {
              const c = allCourses.find((x) => x.course_code === p.course_code);
              if (!c) return null;
              return (
                <li
                  key={p.course_code}
                  className="flex items-center justify-between border border-border bg-background rounded-sm px-3 py-2"
                >
                  <div>
                    <span className="font-medium">{c.course_code}</span>
                    <span className="text-muted-foreground"> — {c.title}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{c.credit_hours} cr</Badge>
                    <button
                      onClick={() => removeCourse(c.course_code)}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Remove"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <div className="flex items-center justify-between mb-4 gap-4">
          <h3 className="serif text-2xl">Course catalog</h3>
          <Input
            placeholder="Search by code or title…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs bg-background"
          />
        </div>

        <div className="paper-card divide-y divide-border">
          {filtered.length === 0 && (
            <p className="p-5 text-sm text-muted-foreground italic">No courses match.</p>
          )}
          {filtered.map((c) => {
            const inBasket = plannedSet.has(c.course_code);
            return (
              <div key={c.course_code} className="p-4 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{c.course_code}</span>
                    <span className="text-muted-foreground">— {c.title}</span>
                    <Badge variant="outline">{c.credit_hours} cr</Badge>
                    <Badge variant="outline">Sem {c.semester}</Badge>
                    {!c.eligible && (
                      <Badge variant="destructive" className="gap-1">
                        <Lock className="h-3 w-3" /> Needs {c.missing.join(", ")}
                      </Badge>
                    )}
                    {c.eligible && (
                      <Badge className="bg-success text-success-foreground gap-1">
                        <Check className="h-3 w-3" /> Eligible
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                </div>
                <div className="shrink-0">
                  {inBasket ? (
                    <Button size="sm" variant="secondary" onClick={() => removeCourse(c.course_code)}>
                      <X className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => addCourse(c)}
                      disabled={!c.eligible}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
