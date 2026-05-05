import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";
import { getTable, updateTable } from "@/lib/db";
import { apiAddTask, apiUpdateTask, apiDeleteTask } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, CalendarDays } from "lucide-react";
import { toast } from "sonner";

const COLUMNS = [
  { id: "todo",        label: "To do" },
  { id: "in_progress", label: "In progress" },
  { id: "done",        label: "Done" },
];
const TYPES = ["Assignment", "Exam", "Quiz", "Project", "Reading"];

function nextId(rows) {
  return rows.reduce((m, r) => Math.max(m, r.t_id ?? 0), 0) + 1;
}

function dueClass(dateStr, status) {
  if (!dateStr || status === "done") return "text-muted-foreground";
  const today = new Date(); today.setHours(0,0,0,0);
  const due = new Date(dateStr);
  const diff = (due - today) / 86400000;
  if (diff < 0) return "text-destructive font-medium";
  if (diff <= 3) return "text-accent font-medium";
  return "text-muted-foreground";
}

function buildTaskTitle(courseCode, title) {
  const trimmedTitle = title.trim();
  const trimmedCourse = courseCode.trim();
  return trimmedCourse ? `${trimmedCourse}_${trimmedTitle}` : trimmedTitle;
}

export default function Tasks() {
  const { activeStudent } = useUser();
  const sid = activeStudent?.user_id;
  const [tick, setTick] = useState(0);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({
    title: "", type: "Assignment", course_code: "", due_date: "",
  });

  useEffect(() => {
    const h = () => setTick((t) => t + 1);
    window.addEventListener("scms:change", h);
    return () => window.removeEventListener("scms:change", h);
  }, []);

  const { tasks, courseOptions } = useMemo(() => {
    if (!sid) return { tasks: [], courseOptions: [] };
    const all = getTable("TASK")
      .filter((t) => t.student_id === sid)
      .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""));
    const completed = getTable("ENROLLMENT")
      .filter((e) => e.student_id === sid).map((e) => e.course_code);
    const planned = getTable("PLANNED_ENROLLMENT")
      .filter((p) => p.student_id === sid).map((p) => p.course_code);
    const codes = Array.from(new Set([...completed, ...planned]));
    const courses = getTable("COURSE").filter((c) => codes.includes(c.course_code));
    return { tasks: all, courseOptions: courses };
  }, [sid, tick]);

  const addTask = () => {
    if (!draft.course_code) { toast.error("Course is required"); return; }
    if (!draft.title.trim()) { toast.error("Title is required"); return; }
    const newTask = {
      t_id: nextId(getTable("TASK")),
      student_id: sid,
      title: draft.title.trim(),
      course: draft.course_code,
      type: draft.type,
      status: "todo",
      due_date: draft.due_date,
    };
    updateTable("TASK", (rows) => [...rows, newTask]);
    apiAddTask(newTask).catch((e) => console.error("API addTask:", e));
    setDraft({ title: "", type: "Assignment", course_code: "", due_date: "" });
    setOpen(false);
    toast.success("Task added");
  };

  const moveTask = (t_id, status) => {
    const current = getTable("TASK").find((r) => r.t_id === t_id && r.student_id === sid);
    updateTable("TASK", (rows) =>
      rows.map((r) => (r.t_id === t_id && r.student_id === sid ? { ...r, status } : r))
    );
    apiUpdateTask({
      t_id,
      status,
      title: current?.title,
      course: current?.course,
      type: current?.type,
      due_date: current?.due_date,
    }).catch((e) => console.error("API moveTask:", e));
  };

  const removeTask = (t_id) => {
    updateTable("TASK", (rows) =>
      rows.filter((r) => !(r.t_id === t_id && r.student_id === sid))
    );
    apiDeleteTask(t_id).catch((e) => console.error("API deleteTask:", e));
  };

  const onDragStart = (e, t_id) => {
    e.dataTransfer.setData("text/plain", String(t_id));
    e.dataTransfer.effectAllowed = "move";
  };
  const onDrop = (e, status) => {
    e.preventDefault();
    const id = Number(e.dataTransfer.getData("text/plain"));
    if (id) moveTask(id, status);
  };

  return (
    <div className="space-y-8">
      <header className="border-b border-border pb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Task Tracker</p>
          <h2 className="serif text-4xl mt-2">Assignments & exams</h2>
          <p className="text-muted-foreground mt-2">
            Drag cards between columns. Sorted by earliest due date.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-1" /> New task</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="serif text-2xl">New task</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Title</Label>
                <Input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="e.g. Algorithms HW 3"
                  className="mt-1 bg-background"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Type</Label>
                  <Select value={draft.type} onValueChange={(v) => setDraft({ ...draft, type: v })}>
                    <SelectTrigger className="mt-1 bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Due date</Label>
                  <Input
                    type="date"
                    value={draft.due_date}
                    onChange={(e) => setDraft({ ...draft, due_date: e.target.value })}
                    className="mt-1 bg-background"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Course (optional)</Label>
                <Select value={draft.course_code} onValueChange={(v) => setDraft({ ...draft, course_code: v })}>
                  <SelectTrigger className="mt-1 bg-background">
                    <SelectValue placeholder="Link to a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courseOptions.length === 0 && (
                      <SelectItem value="none" disabled>No enrolled/planned courses</SelectItem>
                    )}
                    {courseOptions.map((c) => (
                      <SelectItem key={c.course_code} value={c.course_code}>
                        {c.course_code} — {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={addTask}>Add task</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => (t.status ?? "todo") === col.id);
          return (
            <div
              key={col.id}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDrop(e, col.id)}
              className="paper-card p-4 min-h-[280px] flex flex-col"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="serif text-xl">{col.label}</h3>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              <div className="space-y-2 flex-1">
                {items.length === 0 && (
                  <p className="text-xs text-muted-foreground italic mt-2">Drop tasks here</p>
                )}
                {items.map((t) => (
                  <article
                    key={t.t_id}
                    draggable
                    onDragStart={(e) => onDragStart(e, t.t_id)}
                    className="border border-border bg-background rounded-sm p-3 cursor-grab active:cursor-grabbing hover:border-foreground transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium leading-tight">{t.title}</h4>
                      <button
                        onClick={() => removeTask(t.t_id)}
                        className="text-muted-foreground hover:text-destructive shrink-0"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{t.type}</Badge>
                      {t.course && (
                        <Badge variant="secondary" className="text-[10px]">{t.course}</Badge>
                      )}
                    </div>
                    {t.due_date && (
                      <div className={`flex items-center gap-1 mt-2 text-xs ${dueClass(t.due_date, t.status)}`}>
                        <CalendarDays className="h-3 w-3" />
                        {new Date(t.due_date).toLocaleDateString(undefined, {
                          month: "short", day: "numeric", year: "numeric",
                        })}
                      </div>
                    )}
                    <div className="flex gap-1 mt-3">
                      {COLUMNS.filter((c) => c.id !== (t.status ?? "todo")).map((c) => (
                        <button
                          key={c.id}
                          onClick={() => moveTask(t.t_id, c.id)}
                          className="text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border px-2 py-0.5 rounded-sm"
                        >
                          → {c.label}
                        </button>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
