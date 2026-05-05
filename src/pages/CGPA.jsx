import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";
import { getTable } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const GRADE_POINTS = {
  "A+": 4.0, "A": 4.0, "A-": 3.7,
  "B+": 3.3, "B": 3.0, "B-": 2.7,
  "C+": 2.3, "C": 2.0, "C-": 1.7,
  "D+": 1.3, "D": 1.0, "F": 0.0,
};
const GRADES = Object.keys(GRADE_POINTS);

function pointToLetter(p) {
  const sorted = [...new Set(Object.values(GRADE_POINTS))].sort((a, b) => a - b);
  const found = sorted.find((v) => v >= p);
  const target = found ?? 4.0;
  return Object.entries(GRADE_POINTS).find(([, v]) => v === target)?.[0] ?? "A";
}

export default function CGPA() {
  const { activeStudent } = useUser();
  const sid = activeStudent?.user_id;
  const [tick, setTick] = useState(0);
  const [target, setTarget] = useState(3.75);

  const [predicted, setPredicted] = useState({});

  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener("scms:change", h);
    return () => window.removeEventListener("scms:change", h);
  }, []);

  const data = useMemo(() => {
    if (!sid) return null;
    const enrollments = getTable("ENROLLMENT").filter(
      (e) => e.student_id === sid && e.status === "completed"
    );
    const courses = getTable("COURSE");
    const planned = getTable("PLANNED_ENROLLMENT").filter((p) => p.student_id === sid);

    const completedRows = enrollments.map((e) => {
      const c = courses.find((x) => x.course_code === e.course_code);
      return { ...e, credit_hours: c?.credit_hours ?? 3, title: c?.title ?? "" };
    });
    const completedPoints = completedRows.reduce(
      (acc, r) => acc + r.grade_point * r.credit_hours, 0
    );
    const completedCredits = completedRows.reduce((a, r) => a + r.credit_hours, 0);
    const currentCgpa = completedCredits ? completedPoints / completedCredits : 0;

    const plannedRows = planned.map((p) => {
      const c = courses.find((x) => x.course_code === p.course_code);
      return { course_code: p.course_code, title: c?.title ?? "", credit_hours: c?.credit_hours ?? 3 };
    });
    const plannedCredits = plannedRows.reduce((a, r) => a + r.credit_hours, 0);

    return { completedRows, completedPoints, completedCredits, currentCgpa, plannedRows, plannedCredits };
  }, [sid, tick]);

  if (!data) return null;
  const {
    completedRows, completedPoints, completedCredits, currentCgpa, plannedRows, plannedCredits,
  } = data;

  const totalCreditsAfter = completedCredits + plannedCredits;
  const requiredPoints = target * totalCreditsAfter - completedPoints;
  const requiredAvg = plannedCredits > 0 ? requiredPoints / plannedCredits : 0;
  const feasible = plannedCredits > 0 && requiredAvg <= 4.0 + 1e-9;
  const trivial = plannedCredits > 0 && requiredAvg <= 0;

  const predictedPoints = plannedRows.reduce((acc, r) => {
    const g = predicted[r.course_code];
    const gp = g ? GRADE_POINTS[g] : null;
    return gp == null ? acc : acc + gp * r.credit_hours;
  }, 0);
  const predictedFilledCredits = plannedRows.reduce((acc, r) => {
    return predicted[r.course_code] ? acc + r.credit_hours : acc;
  }, 0);
  const projectedCgpa = (completedCredits + predictedFilledCredits)
    ? (completedPoints + predictedPoints) / (completedCredits + predictedFilledCredits)
    : currentCgpa;

  return (
    <div className="space-y-8">
      <header className="border-b border-border pb-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">CGPA Predictor</p>
        <h2 className="serif text-4xl mt-2">Plan your grades</h2>
        <p className="text-muted-foreground mt-2">
          See exactly what you need on planned courses to reach your target CGPA.
        </p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Current CGPA" value={currentCgpa.toFixed(2)} sub={`${completedCredits} credits done`} />
        <Stat label="Planned credits" value={plannedCredits} sub={`${plannedRows.length} courses`} />
        <Stat label="Projected CGPA" value={projectedCgpa.toFixed(2)} sub="from your predictions" />
      </section>

      <section className="paper-card p-6 space-y-4">
        <div className="flex items-end gap-4 flex-wrap">
          <div>
            <Label htmlFor="target" className="text-xs uppercase tracking-wider text-muted-foreground">
              Target CGPA
            </Label>
            <Input
              id="target"
              type="number"
              step="0.01"
              min="0"
              max="4"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
              className="w-32 mt-1 bg-background serif text-2xl"
            />
          </div>
          <div className="flex gap-2">
            {[3.0, 3.25, 3.5, 3.75, 4.0].map((v) => (
              <Button key={v} size="sm" variant="outline" onClick={() => setTarget(v)}>
                {v.toFixed(2)}
              </Button>
            ))}
          </div>
        </div>

        <div className="ink-divider" />

        {plannedCredits === 0 ? (
          <p className="text-sm text-muted-foreground italic">
            Add courses in the Course Planner to see what grades you need.
          </p>
        ) : trivial ? (
          <p className="text-sm">
            <Badge className="bg-success text-success-foreground mr-2">Already there</Badge>
            Your current CGPA already meets {target.toFixed(2)}. Any passing grade keeps you above target.
          </p>
        ) : feasible ? (
          <p className="text-sm">
            To hit <span className="font-medium">{target.toFixed(2)}</span>, you need an average of{" "}
            <span className="serif text-2xl text-accent">{requiredAvg.toFixed(2)}</span>{" "}
            (~ <Badge variant="secondary">{pointToLetter(requiredAvg)}</Badge>) across your{" "}
            {plannedCredits} planned credits.
          </p>
        ) : (
          <p className="text-sm">
            <Badge variant="destructive" className="mr-2">Not reachable</Badge>
            Even straight A's would yield{" "}
            <span className="font-medium">
              {((completedPoints + 4.0 * plannedCredits) / totalCreditsAfter).toFixed(2)}
            </span>. Lower the target or plan more credits.
          </p>
        )}
      </section>

      <section>
        <h3 className="serif text-2xl mb-4">Predict per-course grades</h3>
        {plannedRows.length === 0 ? (
          <p className="text-sm text-muted-foreground italic">No planned courses yet.</p>
        ) : (
          <div className="paper-card divide-y divide-border">
            {plannedRows.map((r) => (
              <div key={r.course_code} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <span className="font-medium">{r.course_code}</span>
                  <span className="text-muted-foreground"> — {r.title}</span>
                  <Badge variant="outline" className="ml-2">{r.credit_hours} cr</Badge>
                </div>
                <Select
                  value={predicted[r.course_code] ?? ""}
                  onValueChange={(v) => setPredicted((p) => ({ ...p, [r.course_code]: v }))}
                >
                  <SelectTrigger className="w-32 bg-background">
                    <SelectValue placeholder="Grade" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADES.map((g) => (
                      <SelectItem key={g} value={g}>{g} ({GRADE_POINTS[g].toFixed(1)})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="serif text-2xl mb-4">Completed courses</h3>
        <div className="paper-card divide-y divide-border">
          {completedRows.length === 0 && (
            <p className="p-5 text-sm text-muted-foreground italic">No completed courses on record.</p>
          )}
          {completedRows.map((r) => (
            <div key={r.course_code} className="p-4 flex items-center justify-between">
              <div>
                <span className="font-medium">{r.course_code}</span>
                <span className="text-muted-foreground"> — {r.title}</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline">{r.credit_hours} cr</Badge>
                <Badge variant="secondary">{r.grade}</Badge>
                <span className="text-sm text-muted-foreground w-10 text-right">
                  {r.grade_point.toFixed(1)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, sub }) {
  return (
    <div className="paper-card p-5">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="serif text-4xl mt-2">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
