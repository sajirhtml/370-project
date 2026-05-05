import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTable } from "@/lib/db";
import { apiUpdateUser, apiUpdateStudent } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function EditStudent() {
  const { userId } = useParams();
  const uid = Number(userId);
  const nav = useNavigate();
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", dept: "" });
  const [student, setStudent] = useState({ student_id: "", cgpa: "", semester: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const users = getTable("USERS");
    const regs = getTable("REGULAR_STUDENT");
    const u = users.find((r) => r.user_id === uid);
    const s = regs.find((r) => r.user_id === uid);
    if (u) setForm({ first_name: (u.name || "").split(" ").slice(0,1).join(' '), last_name: (u.name || "").split(" ").slice(1).join(' '), email: u.email || "", dept: u.dept || "" });
    if (s) setStudent({ student_id: s.student_id ?? "", cgpa: s.cgpa ?? "", semester: s.semester ?? "" });
  }, [userId]);

  const update = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));
  const updateStudent = (k) => (e) => setStudent((s) => ({ ...s, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiUpdateUser({ user_id: uid, first_name: form.first_name, last_name: form.last_name, email: form.email, dept: form.dept });
      await apiUpdateStudent({ user_id: uid, student_id: Number(student.student_id), cgpa: student.cgpa === "" ? null : Number(student.cgpa), semester: student.semester });
      window.dispatchEvent(new Event("scms:change"));
      nav('/');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Save failed');
    } finally { setLoading(false); }
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Student</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="First name" value={form.first_name} onChange={update('first_name')} />
              <Input placeholder="Last name" value={form.last_name} onChange={update('last_name')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Email" value={form.email} onChange={update('email')} />
              <Input placeholder="Department" value={form.dept} onChange={update('dept')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Student ID" value={student.student_id} onChange={updateStudent('student_id')} />
              <Input placeholder="Semester" value={student.semester} onChange={updateStudent('semester')} />
            </div>
            <Input placeholder="CGPA" value={student.cgpa} onChange={updateStudent('cgpa')} />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Save'}</Button>
              <Button type="button" variant="ghost" onClick={() => nav(-1)}>Cancel</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
