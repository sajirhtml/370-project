import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";
import { getTable, updateTable } from "@/lib/db";
import { apiAddResource, apiDeleteResource } from "@/lib/api";
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
import { Plus, Trash2, ExternalLink, Search, Library, FileText, Video, Link as LinkIcon, Presentation } from "lucide-react";
import { toast } from "sonner";

const TYPES = ["Note", "Slides", "Video", "Link", "Assignment", "Reading"];

const TYPE_ICON = {
  Note: FileText, Slides: Presentation, Video: Video, Link: LinkIcon,
  Assignment: FileText, Reading: FileText,
};

function nextId(rows) {
  return rows.reduce((m, r) => Math.max(m, r.resource_id ?? 0), 0) + 1;
}

export default function Resources() {
  const { activeStudent } = useUser();
  const [version, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);

  useEffect(() => {
    const h = () => bump();
    window.addEventListener("scms:change", h);
    return () => window.removeEventListener("scms:change", h);
  }, []);

  const resources = useMemo(() => getTable("RESOURCES"), [version]);
  const courses = useMemo(() => getTable("COURSE"), []);
  const users = useMemo(() => getTable("USERS"), []);

  const [courseFilter, setCourseFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ course_code: "", title: "", type: "Link", url: "" });

  const filtered = useMemo(() => {
    return resources
      .filter((r) => courseFilter === "all" || r.course_code === courseFilter)
      .filter((r) => typeFilter === "all" || r.type === typeFilter)
      .filter((r) =>
        !search ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.course_code.toLowerCase().includes(search.toLowerCase()),
      )
      .sort((a, b) => (b.uploaded_at || "").localeCompare(a.uploaded_at || ""));
  }, [resources, courseFilter, typeFilter, search]);

  const grouped = useMemo(() => {
    const m = {};
    filtered.forEach((r) => {
      m[r.course_code] = m[r.course_code] || [];
      m[r.course_code].push(r);
    });
    return m;
  }, [filtered]);

  const submit = () => {
    if (!draft.course_code || !draft.title || !draft.url) {
      toast.error("Course, title and URL are required.");
      return;
    }
    const newRes = {
      resource_id: nextId(getTable("RESOURCES")),
      course_code: draft.course_code,
      title: draft.title.trim(),
      type: draft.type,
      url: draft.url.trim(),
      uploaded_by: activeStudent?.user_id ?? 0,
      uploaded_at: new Date().toISOString().slice(0, 10),
    };
    updateTable("RESOURCES", (rows) => [...rows, newRes]);
    apiAddResource(newRes).catch((e) => console.error("API addResource:", e));
    setDraft({ course_code: "", title: "", type: "Link", url: "" });
    setOpen(false);
    toast.success("Resource added.");
  };

  const remove = (id) => {
    updateTable("RESOURCES", (rows) => rows.filter((r) => r.resource_id !== id));
    apiDeleteResource(id).catch((e) => console.error("API delResource:", e));
    toast.success("Resource removed.");
  };

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Library</p>
          <h1 className="serif text-5xl mb-2">Course Resource Hub</h1>
          <p className="text-muted-foreground max-w-2xl">
            Lecture notes, slides, videos, and helpful links — organised by course.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> Add resource</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>New resource</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Course</Label>
                <Select value={draft.course_code} onValueChange={(v) => setDraft({ ...draft, course_code: v })}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    {courses.map((c) => (
                      <SelectItem key={c.course_code} value={c.course_code}>
                        {c.course_code} — {c.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Title</Label>
                <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} className="mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={draft.type} onValueChange={(v) => setDraft({ ...draft, type: v })}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>URL</Label>
                  <Input value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value })} className="mt-1" placeholder="https://…" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="paper-card p-4 grid gap-3 md:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search title or course…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All courses</SelectItem>
            {courses.map((c) => (
              <SelectItem key={c.course_code} value={c.course_code}>{c.course_code}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div className="paper-card p-10 text-center text-muted-foreground">
          <Library className="h-8 w-8 mx-auto mb-3 opacity-60" />
          No resources match your filters.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([code, items]) => {
            const course = courses.find((c) => c.course_code === code);
            return (
              <div key={code} className="paper-card p-5">
                <div className="flex items-baseline justify-between mb-4">
                  <div>
                    <span className="serif text-2xl">{code}</span>
                    <span className="text-muted-foreground ml-2">{course?.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{items.length} item{items.length === 1 ? "" : "s"}</span>
                </div>
                <ul className="divide-y divide-border">
                  {items.map((r) => {
                    const Icon = TYPE_ICON[r.type] || LinkIcon;
                    const author = users.find((u) => u.user_id === r.uploaded_by);
                    return (
                      <li key={r.resource_id} className="py-3 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-sm bg-secondary flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium hover:underline inline-flex items-center gap-1"
                          >
                            {r.title}
                            <ExternalLink className="h-3 w-3 opacity-60" />
                          </a>
                          <div className="text-xs text-muted-foreground truncate">
                            {author?.name || "Unknown"} · {r.uploaded_at}
                          </div>
                        </div>
                        <Badge variant="outline">{r.type}</Badge>
                        <Button variant="ghost" size="icon" onClick={() => remove(r.resource_id)} title="Remove">
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
