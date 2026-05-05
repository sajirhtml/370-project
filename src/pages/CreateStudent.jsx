import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { postJSON } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function CreateStudent() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    student_id: "",
    email: "",
    dept: "",
    cgpa: "",
    semester: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const update = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.first_name || !form.last_name || !form.student_id || !form.email) {
      setError("Please fill required fields (first name, last name, student id, email).");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        student_id: form.student_id.trim(),
        email: form.email.trim(),
        dept: form.dept.trim(),
        cgpa: form.cgpa === "" ? null : parseFloat(form.cgpa),
        semester: form.semester.trim(),
      };
      const res = await postJSON("create_student.php", payload);
      window.dispatchEvent(new Event("scms:change"));
      const sid = encodeURIComponent(payload.student_id);
      const sem = encodeURIComponent(payload.semester || "");
      navigate(`/students/new/courses?student_id=${sid}&semester=${sem}`);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to create student");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create Student</CardTitle>
          <p className="text-sm text-muted-foreground">Fill basic details, then add completed courses.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="First name" value={form.first_name} onChange={update("first_name")} />
              <Input placeholder="Last name" value={form.last_name} onChange={update("last_name")} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Student ID" value={form.student_id} onChange={update("student_id")} />
              <Input placeholder="Email" value={form.email} onChange={update("email")} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Department" value={form.dept} onChange={update("dept")} />
              <Input placeholder="Semester" value={form.semester} onChange={update("semester")} />
            </div>

            <div>
              <Input placeholder="CGPA (optional)" value={form.cgpa} onChange={update("cgpa")} />
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={loading}>{loading ? "Creating…" : "Create Student"}</Button>
              <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
