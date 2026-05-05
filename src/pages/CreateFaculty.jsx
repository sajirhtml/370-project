import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { postJSON } from "@/lib/api";

export default function CreateFaculty() {
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", dept: "", designation: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const nav = useNavigate();

  const update = (k) => (e) => setForm(s => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (!form.first_name || !form.last_name || !form.email || !form.designation) {
      setError("Please fill required fields");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        dept: form.dept,
        designation: form.designation,
      };
      await postJSON('create_faculty.php', payload);
      setSuccess('Faculty account created');
      setTimeout(() => nav('/faculty'), 700);
    } catch (err) {
      setError(err.message || 'Failed to create faculty');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="serif text-2xl mb-4">Create Faculty Account</h2>
      {error && <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md text-sm mb-3">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm mb-3">{success}</div>}
      <Card>
        <CardHeader>
          <CardTitle>Faculty Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">First name</label>
                <Input value={form.first_name} onChange={update('first_name')} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Last name</label>
                <Input value={form.last_name} onChange={update('last_name')} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1">Email</label>
                <Input type="email" value={form.email} onChange={update('email')} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Department</label>
                <Input value={form.dept} onChange={update('dept')} />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Designation</label>
              <select value={form.designation} onChange={update('designation')} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="">Select designation</option>
                <option value="Lecturer">Lecturer</option>
                <option value="Associate Lecturer">Associate Lecturer</option>
                <option value="Senior Lecturer">Senior Lecturer</option>
                <option value="Professor">Professor</option>
              </select>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>{loading ? 'Saving…' : 'Create Faculty'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
