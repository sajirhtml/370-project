import { useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";
import { getTable } from "@/lib/db";
import { getPlanned } from "@/lib/academic";
import { DAYS, HOURS, generateSchedule, sectionsForCourse, overlaps } from "@/lib/schedule";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, Sparkles, AlertTriangle } from "lucide-react";

const toMin = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const PALETTE = [
  "25 45% 35%", "210 50% 35%", "140 35% 32%", "280 35% 38%",
  "10 55% 40%", "190 45% 32%", "45 60% 35%", "330 40% 38%",
];
const colorFor = (code, idx) => PALETTE[idx % PALETTE.length];

export default function Schedule() {
  const { activeStudent } = useUser();
  const [picks, setPicks] = useState([]);
  const [conflicts, setConflicts] = useState([]);
  const [generated, setGenerated] = useState(false);

  const planned = activeStudent ? getPlanned(activeStudent.user_id) : [];
  const courses = getTable("COURSE");
  const rooms = getTable("ROOM");
  const faculty = getTable("USERS");

  const plannedCourses = useMemo(
    () => planned.map((p) => courses.find((c) => c.course_code === p.course_code)).filter(Boolean),
    [planned, courses],
  );

  const colorMap = useMemo(() => {
    const m = {};
    plannedCourses.forEach((c, i) => (m[c.course_code] = colorFor(c.course_code, i)));
    return m;
  }, [plannedCourses]);

  const handleGenerate = () => {
    const codes = plannedCourses.map((c) => c.course_code);
    const result = generateSchedule(codes);
    setPicks(result.picks);
    setConflicts(result.conflicts);
    setGenerated(true);
  };

  const HOUR_PX = 56;
  const dayItems = (day) => picks.filter((p) => p.day === day);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Schedule</p>
        <h1 className="serif text-5xl mb-2">Conflict-free Schedule</h1>
        <p className="text-muted-foreground max-w-2xl">
          Pick one section per planned course such that no two classes overlap. The solver tries
          combinations and reports any course it could not place without a clash.
        </p>
      </div>

      <div className="paper-card p-5 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[200px]">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Planned courses</p>
          <p className="serif text-2xl">
            {plannedCourses.length}{" "}
            <span className="text-base text-muted-foreground">
              · {plannedCourses.reduce((s, c) => s + c.credit_hours, 0)} credits
            </span>
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={plannedCourses.length === 0}>
          <Sparkles className="h-4 w-4" /> Generate schedule
        </Button>
      </div>

      {plannedCourses.length === 0 && (
        <div className="paper-card p-10 text-center text-muted-foreground">
          <CalendarClock className="h-8 w-8 mx-auto mb-3 opacity-60" />
          No planned courses yet. Add some in the Course Planner first.
        </div>
      )}

      {generated && conflicts.length > 0 && (
        <div className="paper-card p-5 border-destructive/40 bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Could not build a clash-free schedule.</p>
              <p className="text-sm text-muted-foreground mt-1">
                The following courses have unavoidable conflicts with the rest of your plan:{" "}
                {conflicts.map((c) => (
                  <Badge key={c} variant="outline" className="mr-1">{c}</Badge>
                ))}
              </p>
            </div>
          </div>
        </div>
      )}

      {picks.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {plannedCourses.map((c) => (
              <div key={c.course_code} className="flex items-center gap-2 text-sm">
                <span
                  className="inline-block h-3 w-3 rounded-sm"
                  style={{ background: `hsl(${colorMap[c.course_code]})` }}
                />
                <span className="font-medium">{c.course_code}</span>
                <span className="text-muted-foreground">— {c.title}</span>
              </div>
            ))}
          </div>

          <div className="paper-card overflow-hidden">
            <div className="grid" style={{ gridTemplateColumns: "60px repeat(5, 1fr)" }}>
              <div className="border-b border-border bg-secondary/40" />
              {DAYS.map((d) => (
                <div
                  key={d}
                  className="border-b border-l border-border bg-secondary/40 px-3 py-2 text-xs uppercase tracking-wider text-muted-foreground"
                >
                  {d}
                </div>
              ))}

              <div className="relative">
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="border-b border-border text-[10px] text-muted-foreground px-2 pt-1"
                    style={{ height: HOUR_PX }}
                  >
                    {String(h).padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {DAYS.map((day) => (
                <div
                  key={day}
                  className="relative border-l border-border"
                  style={{ height: HOUR_PX * HOURS.length }}
                >
                  {HOURS.map((h) => (
                    <div
                      key={h}
                      className="border-b border-border/60"
                      style={{ height: HOUR_PX }}
                    />
                  ))}
                  {dayItems(day).map((s) => {
                    const top = ((toMin(s.start_time) - HOURS[0] * 60) / 60) * HOUR_PX;
                    const height = ((toMin(s.end_time) - toMin(s.start_time)) / 60) * HOUR_PX;
                    const room = rooms.find((r) => r.room_id === s.room_id);
                    const fac = faculty.find((u) => u.user_id === s.faculty_id);
                    const color = colorMap[s.course_code];
                    return (
                      <div
                        key={s.course_code + s.section_num}
                        className="absolute left-1 right-1 rounded-sm p-2 text-xs text-background overflow-hidden"
                        style={{
                          top,
                          height,
                          background: `hsl(${color})`,
                        }}
                      >
                        <div className="font-semibold">
                          {s.course_code} · {s.section_num}
                        </div>
                        <div className="opacity-90">
                          {s.start_time}–{s.end_time}
                        </div>
                        <div className="opacity-90">{room?.room_no}</div>
                        <div className="opacity-80 truncate">{fac?.name}</div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="paper-card p-5">
            <h2 className="serif text-2xl mb-4">Selected sections</h2>
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="text-left py-2">Course</th>
                  <th className="text-left py-2">Section</th>
                  <th className="text-left py-2">Day</th>
                  <th className="text-left py-2">Time</th>
                  <th className="text-left py-2">Room</th>
                  <th className="text-left py-2">Faculty</th>
                </tr>
              </thead>
              <tbody>
                {picks.map((s) => {
                  const room = rooms.find((r) => r.room_id === s.room_id);
                  const fac = faculty.find((u) => u.user_id === s.faculty_id);
                  const course = courses.find((c) => c.course_code === s.course_code);
                  return (
                    <tr key={s.course_code + s.section_num} className="border-b border-border/60">
                      <td className="py-2">
                        <div className="font-medium">{s.course_code}</div>
                        <div className="text-xs text-muted-foreground">{course?.title}</div>
                      </td>
                      <td className="py-2">{s.section_num}</td>
                      <td className="py-2">{s.day}</td>
                      <td className="py-2">{s.start_time}–{s.end_time}</td>
                      <td className="py-2">{room?.room_no}</td>
                      <td className="py-2">{fac?.name}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
