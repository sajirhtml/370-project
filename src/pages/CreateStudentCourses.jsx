import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { fetchTable, apiAddEnrollment } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function gradePointToLetter(gp) {
  if (gp >= 3.7) return "A";
  if (gp >= 3.0) return "B";
  if (gp >= 2.0) return "C";
  if (gp >= 1.0) return "D";
  return "F";
}

export default function CreateStudentCourses() {
  const { search } = useLocation();
  const nav = useNavigate();
  const params = new URLSearchParams(search);
  const routeParams = useParams();
  const student_id = routeParams.userId ?? params.get("student_id");
  const defaultSemester = params.get("semester") || "";

  const [courses, setCourses] = useState([]);
  const [selected, setSelected] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTable("COURSE").then(setCourses).catch((e) => console.error(e));
  }, []);

  const toggle = (code) => (e) => {
    const checked = e.target.checked;
    setSelected((s) => {
      const next = { ...s };
      if (checked) {
        next[code] = { grade_point: "", semester: defaultSemester };
      } else {
        delete next[code];
      }
      return next;
    });
  };

  const updateField = (code, field) => (e) => {
    const val = e.target.value;
    setSelected((s) => ({ ...s, [code]: { ...(s[code] || {}), [field]: val } }));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!student_id) {
      setError("Missing student id");
      return;
    }
    const entries = Object.entries(selected).map(([course_code, v]) => ({
      student_id: Number(student_id),
      course_code,
      semester: v.semester || defaultSemester,
      grade_point: parseFloat(v.grade_point),
      grade: gradePointToLetter(parseFloat(v.grade_point)),
      status: "completed",
    }));
    if (entries.length === 0) {
      nav("/");
      return;
    }
    setLoading(true);
    try {
      for (const row of entries) {
        await apiAddEnrollment(row);
      }
      window.dispatchEvent(new Event("scms:change"));
      nav("/");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to save enrollments");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="serif text-2xl mb-4">Completed Courses</h2>
      <p className="text-sm text-muted-foreground mb-4">Select courses the student has completed and enter the grade (0–4).</p>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3">
          {courses.map((c) => (
            <div key={c.course_code} className="paper-card p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{c.course_code} — {c.title}</div>
                <div className="text-sm text-muted-foreground">{c.credit_hours} credits · {c.semester}</div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <Checkbox onCheckedChange={(v) => toggle(c.course_code)({ target: { checked: !!v } })} checked={!!selected[c.course_code]} />
                  <span className="text-sm">Done</span>
                </label>
                <Input placeholder="Semester" value={(selected[c.course_code]?.semester) ?? defaultSemester} onChange={updateField(c.course_code, 'semester')} className="w-28" />
                <Input placeholder="Grade (0-4)" value={selected[c.course_code]?.grade_point ?? ''} onChange={updateField(c.course_code, 'grade_point')} className="w-24" type="number" min="0" max="4" step="0.01" />
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={loading}>{loading ? "Saving…" : "Save Completed Courses"}</Button>
          <Button type="button" variant="ghost" onClick={() => nav(-1)}>Back</Button>
        </div>
      </form>
    </div>
  );
}
