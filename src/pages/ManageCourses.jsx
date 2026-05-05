import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import { getTable, setTable } from "@/lib/db";
import { fetchTable, apiAddEnrollment, deleteJSON } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Plus } from "lucide-react";

function gradePointToLetter(gp) {
  if (gp >= 3.7) return "A";
  if (gp >= 3.0) return "B";
  if (gp >= 2.0) return "C";
  if (gp >= 1.0) return "D";
  return "F";
}

export default function ManageCourses() {
  const { activeStudent } = useUser();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [form, setForm] = useState({ course_code: "", semester: "", grade_point: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (!activeStudent) return null;
  const user_id = activeStudent.user_id;

  useEffect(() => {
    Promise.all([fetchTable("COURSE"), fetchTable("ENROLLMENT")])
      .then(([c, e]) => {
        setCourses(c);
        const myEnroll = e.filter((en) => en.student_id === user_id);
        setEnrollments(myEnroll);
      })
      .catch((err) => console.error(err));
  }, [user_id]);

  const availableCourses = courses.filter(
    (c) => !enrollments.some((e) => e.course_code === c.course_code)
  );

  const updateForm = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const addEnrollment = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.course_code || form.grade_point === "") {
      setError("Please select a course and enter a grade.");
      return;
    }

    setLoading(true);
    try {
      const gp = parseFloat(form.grade_point);
      const payload = {
        student_id: user_id,
        course_code: form.course_code,
        semester: form.semester || activeStudent.semester,
        grade_point: gp,
        grade: gradePointToLetter(gp),
        status: "completed",
      };
      await apiAddEnrollment(payload);
      window.dispatchEvent(new Event("scms:change"));
      setForm({ course_code: "", semester: "", grade_point: "" });
      setSuccess("Course added successfully!");
      const updated = await fetchTable("ENROLLMENT");
      const myEnroll = updated.filter((en) => en.student_id === user_id);
      setEnrollments(myEnroll);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to add course");
    } finally {
      setLoading(false);
    }
  };

  const removeEnrollment = async (course_code) => {
    setError(null);
    setSuccess(null);
    try {
      await deleteJSON("enrollments.php", { student_id: user_id, course_code });
      window.dispatchEvent(new Event("scms:change"));
      setEnrollments((prev) => prev.filter((e) => e.course_code !== course_code));
      setSuccess("Course removed successfully!");
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to remove course");
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="serif text-3xl mb-2">Manage Completed Courses</h2>
        <p className="text-muted-foreground">
          Track and manage all the courses you've completed. Add courses with their grades.
        </p>
      </div>

      {error && <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md text-sm">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">{success}</div>}

      <Card>
        <CardHeader>
          <CardTitle>Add Completed Course</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={addEnrollment} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Course</label>
                <select
                  value={form.course_code}
                  onChange={(e) => setForm((s) => ({ ...s, course_code: e.target.value }))}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">Select a course</option>
                  {availableCourses.map((c) => (
                    <option key={c.course_code} value={c.course_code}>
                      {c.course_code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Semester</label>
                <Input
                  placeholder="e.g., Spring 2024"
                  value={form.semester}
                  onChange={updateForm("semester")}
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Grade (0-4)</label>
                <Input
                  type="number"
                  min="0"
                  max="4"
                  step="0.01"
                  placeholder="3.5"
                  value={form.grade_point}
                  onChange={updateForm("grade_point")}
                />
              </div>

              <div className="flex items-end">
                <Button type="submit" disabled={loading} className="w-full">
                  <Plus className="h-4 w-4 mr-1" />
                  {loading ? "Adding…" : "Add"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Your Completed Courses
            {enrollments.length > 0 && (
              <span className="text-sm font-normal text-muted-foreground ml-2">({enrollments.length})</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">No completed courses yet. Add one above to get started.</p>
          ) : (
            <div className="space-y-3">
              {enrollments.map((e) => {
                const course = courses.find((c) => c.course_code === e.course_code);
                return (
                  <div key={e.course_code} className="flex items-center justify-between p-4 border rounded-md hover:bg-secondary/50 transition">
                    <div className="flex-1">
                      <div className="font-medium">
                        {e.course_code} — {course?.title || "Unknown Course"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Grade: <span className="font-medium">{e.grade} ({e.grade_point})</span> · Semester: {e.semester}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeEnrollment(e.course_code)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
