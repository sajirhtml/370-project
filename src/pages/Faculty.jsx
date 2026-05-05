import { useEffect, useMemo, useState } from "react";
import { getTable, updateTable } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  apiAddConsultation,
  apiDeleteConsultation,
  apiUpdateConsultation,
  apiUpdateConsultationBookingStatus,
} from "@/lib/api";
import {
  GraduationCap, Users, BookOpen, CalendarCheck, Library, Plus, Trash2, Check, X, Pencil,
} from "lucide-react";
import { toast } from "sonner";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu"];
const DAY_ORDER = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
const TYPES = ["Note", "Slides", "Video", "Link", "Assignment", "Reading"];

const createSlotDraft = (roomId = "") => ({
  booking_id: null,
  day: "Mon",
  start_time: "14:00",
  end_time: "14:30",
  room_id: roomId,
});

const nextId = (rows, key) => rows.reduce((m, r) => Math.max(m, r[key] ?? 0), 0) + 1;

export default function Faculty() {
  const [version, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);
  useEffect(() => {
    const h = () => bump();
    window.addEventListener("scms:change", h);
    return () => window.removeEventListener("scms:change", h);
  }, []);

  const users = useMemo(() => getTable("USERS"), []);
  const facultyRows = useMemo(() => getTable("FACULTY"), []);
  const facultyList = useMemo(
    () => facultyRows.map((f) => ({ ...f, ...users.find((u) => u.user_id === f.user_id) })),
    [facultyRows, users],
  );

  const [activeId, setActiveId] = useState(facultyList[0]?.user_id ?? null);
  const active = facultyList.find((f) => f.user_id === activeId);

  const sections = useMemo(() => getTable("SECTION"), [version]);
  const courses = useMemo(() => getTable("COURSE"), []);
  const rooms = useMemo(() => getTable("ROOM"), []);
  const students = useMemo(() => getTable("REGULAR_STUDENT"), [version]);
  const enrollments = useMemo(() => getTable("ENROLLMENT"), [version]);
  const consultationSlots = useMemo(() => getTable("CONSULTATION"), [version]);
  const consultationBookings = useMemo(() => getTable("CONSULTATION_BOOKING"), [version]);
  const resources = useMemo(() => getTable("RESOURCES"), [version]);

  const mySections = sections.filter((s) => s.faculty_id === activeId);
  const myCourseCodes = [...new Set(mySections.map((s) => s.course_code))];
  const advisees = students
    .filter((s) => s.advisor_id === activeId)
    .map((s) => ({ ...s, ...users.find((u) => u.user_id === s.user_id) }));
  const myConsultationSlots = consultationSlots
    .filter((slot) => Number(slot.faculty_id) === Number(active?.faculty_id))
    .sort((a, b) => {
      const dayDiff = (DAY_ORDER[a.day ?? a.Day] ?? 9) - (DAY_ORDER[b.day ?? b.Day] ?? 9);
      if (dayDiff !== 0) return dayDiff;
      return String(a.start_time ?? a.Start_Time ?? "").localeCompare(String(b.start_time ?? b.Start_Time ?? ""));
    });
  const myConsultationBookings = consultationBookings
    .map((booking) => {
      const slot = consultationSlots.find((s) => Number(s.booking_id) === Number(booking.booking_id));
      if (!slot || Number(slot.faculty_id) !== Number(active?.faculty_id)) return null;
      return {
        ...booking,
        slot,
        student: users.find((u) => u.user_id === booking.student_id),
      };
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.booked_at ?? 0) - new Date(a.booked_at ?? 0));
  const myResources = resources.filter((r) => myCourseCodes.includes(r.course_code));

  const [resOpen, setResOpen] = useState(false);
  const [resDraft, setResDraft] = useState({ course_code: "", title: "", type: "Link", url: "" });
  const [slotOpen, setSlotOpen] = useState(false);
  const [slotMode, setSlotMode] = useState("create");
  const [slotDraft, setSlotDraft] = useState(createSlotDraft());

  const openSlotDialog = (slot = null) => {
    if (slot) {
      setSlotMode("edit");
      setSlotDraft({
        booking_id: slot.booking_id,
        day: slot.day ?? slot.Day ?? "Mon",
        start_time: slot.start_time ?? slot.Start_Time ?? "14:00",
        end_time: slot.end_time ?? slot.End_Time ?? "14:30",
        room_id: String(slot.room_id ?? ""),
      });
    } else {
      setSlotMode("create");
      setSlotDraft(createSlotDraft(String(rooms[0]?.room_id ?? "")));
    }
    setSlotOpen(true);
  };

  const submitResource = () => {
    if (!resDraft.course_code || !resDraft.title || !resDraft.url) {
      toast.error("Course, title and URL are required."); return;
    }
    updateTable("RESOURCES", (rows) => [
      ...rows,
      {
        resource_id: nextId(rows, "resource_id"),
        course_code: resDraft.course_code,
        title: resDraft.title.trim(),
        type: resDraft.type,
        url: resDraft.url.trim(),
        uploaded_by: activeId,
        uploaded_at: new Date().toISOString().slice(0, 10),
      },
    ]);
    setResDraft({ course_code: "", title: "", type: "Link", url: "" });
    setResOpen(false);
    toast.success("Resource posted.");
  };
  const removeResource = (id) => {
    updateTable("RESOURCES", (rows) => rows.filter((r) => r.resource_id !== id));
  };

  const submitSlot = async () => {
    if (!slotDraft.day || !slotDraft.start_time || !slotDraft.end_time || !slotDraft.room_id) {
      toast.error("All slot fields are required."); return;
    }
    const payload = {
      faculty_id: active.faculty_id,
      day: slotDraft.day,
      start_time: slotDraft.start_time,
      end_time: slotDraft.end_time,
      room_id: Number(slotDraft.room_id),
    };

    try {
      if (slotMode === "edit") {
        await apiUpdateConsultation({ ...payload, booking_id: slotDraft.booking_id });
        updateTable("CONSULTATION", (rows) =>
          rows.map((row) => (Number(row.booking_id) === Number(slotDraft.booking_id) ? { ...row, ...payload } : row)),
        );
        toast.success("Office-hour slot updated.");
      } else {
        const res = await apiAddConsultation(payload);
        const bookingId = Number(res.booking_id ?? res.Booking_id);
        updateTable("CONSULTATION", (rows) => [
          ...rows,
          { booking_id: bookingId, ...payload },
        ]);
        toast.success("Office-hour slot added.");
      }
      setSlotDraft(createSlotDraft(String(rooms[0]?.room_id ?? "")));
      setSlotOpen(false);
    } catch (err) {
      toast.error(err.message || "Failed to save slot.");
    }
  };
  const removeSlot = async (bookingId) => {
    try {
      await apiDeleteConsultation(bookingId);
      updateTable("CONSULTATION", (rows) => rows.filter((row) => Number(row.booking_id) !== Number(bookingId)));
      toast.success("Office-hour slot removed.");
    } catch (err) {
      toast.error(err.message || "Failed to remove slot.");
    }
  };

  const setConsultStatus = async (cbId, status) => {
    try {
      await apiUpdateConsultationBookingStatus(cbId, status);
      updateTable("CONSULTATION_BOOKING", (rows) =>
        rows.map((row) => (Number(row.cb_id) === Number(cbId) ? { ...row, status } : row)),
      );
      toast.success(`Marked as ${status}.`);
    } catch (err) {
      toast.error(err.message || "Failed to update booking.");
    }
  };

  if (!active) return <div className="paper-card p-10 text-center text-muted-foreground">No faculty seeded.</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Faculty Portal</p>
          <h1 className="serif text-5xl mb-2">Faculty & Advisor Dashboard</h1>
          <p className="text-muted-foreground max-w-2xl">
            Sections taught, advisees, incoming consultation requests, and course materials — all in one place.
          </p>
        </div>
        <div className="min-w-[260px]">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Viewing as</Label>
          <Select value={String(activeId)} onValueChange={(v) => setActiveId(Number(v))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {facultyList.map((f) => (
                <SelectItem key={f.user_id} value={String(f.user_id)}>
                  {f.name} · {f.dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <StatCard icon={BookOpen}      label="Sections"   value={mySections.length} />
        <StatCard icon={Users}         label="Advisees"   value={advisees.length} />
        <StatCard icon={CalendarCheck} label="Bookings"   value={myConsultationBookings.filter((b) => b.status === "booked").length} />
        <StatCard icon={Library}       label="Resources"  value={myResources.length} />
      </div>

      <Tabs defaultValue="sections">
        <TabsList>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="advisees">Advisees</TabsTrigger>
          <TabsTrigger value="consultations">Consultations</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="sections" className="mt-4">
          <div className="paper-card p-5">
            {mySections.length === 0 ? (
              <p className="text-muted-foreground text-sm">No sections assigned.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                  <tr className="border-b border-border">
                    <th className="text-left py-2">Course</th>
                    <th className="text-left py-2">Sec</th>
                    <th className="text-left py-2">Day</th>
                    <th className="text-left py-2">Time</th>
                    <th className="text-left py-2">Room</th>
                  </tr>
                </thead>
                <tbody>
                  {mySections.map((s) => {
                    const c = courses.find((c) => c.course_code === s.course_code);
                    const r = rooms.find((r) => r.room_id === s.room_id);
                    return (
                      <tr key={s.course_code + s.section_num} className="border-b border-border/60">
                        <td className="py-2">
                          <div className="font-medium">{s.course_code}</div>
                          <div className="text-xs text-muted-foreground">{c?.title}</div>
                        </td>
                        <td className="py-2">{s.section_num}</td>
                        <td className="py-2">{s.day}</td>
                        <td className="py-2">{s.start_time}–{s.end_time}</td>
                        <td className="py-2">{r?.room_no}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="advisees" className="mt-4">
          <div className="paper-card p-5">
            {advisees.length === 0 ? (
              <p className="text-muted-foreground text-sm">No advisees assigned.</p>
            ) : (
              <ul className="divide-y divide-border">
                {advisees.map((a) => {
                  const completed = enrollments.filter((e) => e.student_id === a.user_id && e.status === "completed").length;
                  return (
                    <li key={a.user_id} className="py-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{a.name}</div>
                        <div className="text-xs text-muted-foreground">
                          ID {a.student_id} · {a.dept} · Sem {a.semester}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">CGPA {a.cgpa?.toFixed(2)}</Badge>
                        <Badge variant="outline">{completed} completed</Badge>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="consultations" className="mt-4 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="serif text-2xl">Office-hour slots</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Slots assigned to {active.name}.
              </p>
            </div>
            <Dialog
              open={slotOpen}
              onOpenChange={(open) => {
                setSlotOpen(open);
                if (!open) {
                  setSlotMode("create");
                  setSlotDraft(createSlotDraft(String(rooms[0]?.room_id ?? "")));
                }
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm" onClick={() => openSlotDialog()}>
                  <Plus className="h-4 w-4" /> Add slot
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{slotMode === "edit" ? "Edit office-hour slot" : "New office-hour slot"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Day</Label>
                      <Select value={slotDraft.day} onValueChange={(v) => setSlotDraft({ ...slotDraft, day: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Room</Label>
                      <Select value={slotDraft.room_id} onValueChange={(v) => setSlotDraft({ ...slotDraft, room_id: v })}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {rooms.map((r) => <SelectItem key={r.room_id} value={String(r.room_id)}>{r.room_no}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Start</Label>
                      <Input type="time" value={slotDraft.start_time} onChange={(e) => setSlotDraft({ ...slotDraft, start_time: e.target.value })} className="mt-1" />
                    </div>
                    <div>
                      <Label>End</Label>
                      <Input type="time" value={slotDraft.end_time} onChange={(e) => setSlotDraft({ ...slotDraft, end_time: e.target.value })} className="mt-1" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setSlotOpen(false)}>Cancel</Button>
                  <Button onClick={submitSlot}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="paper-card p-4">
            {myConsultationSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No office-hour slots posted.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {myConsultationSlots.map((slot) => {
                  const room = rooms.find((rm) => rm.room_id === slot.room_id);
                  const bookingCount = myConsultationBookings.filter((booking) => Number(booking.booking_id) === Number(slot.booking_id)).length;
                  return (
                    <div key={slot.booking_id} className="flex items-center gap-2 px-3 py-2 border border-border rounded-sm bg-secondary/30">
                      <div className="text-sm min-w-0">
                        <div className="font-medium">{slot.day ?? slot.Day} · {slot.start_time ?? slot.Start_Time}–{slot.end_time ?? slot.End_Time}</div>
                        <div className="text-xs text-muted-foreground">{room?.room_no} · {bookingCount} booking{bookingCount === 1 ? "" : "s"}</div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => openSlotDialog(slot)} title="Edit slot">
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeSlot(slot.booking_id)} title="Delete slot">
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <h3 className="serif text-2xl pt-2">Booking requests</h3>
          <div className="paper-card p-4">
            {myConsultationBookings.length === 0 ? (
              <p className="text-sm text-muted-foreground">No bookings yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {myConsultationBookings.map((booking) => {
                  const room = rooms.find((r) => r.room_id === booking.slot?.room_id);
                  const badgeVariant = booking.status === "cancelled" ? "outline" : booking.status === "completed" ? "secondary" : "default";
                  return (
                    <li key={booking.cb_id} className="py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium">{booking.student?.name ?? "Unknown student"}</div>
                        <div className="text-xs text-muted-foreground">
                          ID {booking.student_id} · {booking.student?.dept ?? ""}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {booking.slot?.day ?? booking.slot?.Day} · {booking.slot?.start_time ?? booking.slot?.Start_Time}–{booking.slot?.end_time ?? booking.slot?.End_Time} · {room?.room_no}
                        </div>
                        <p className="text-sm mt-1"><span className="text-muted-foreground">Topic:</span> {booking.topic}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Booked {booking.booked_at ? new Date(booking.booked_at).toLocaleString() : "recently"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant={badgeVariant}>{booking.status}</Badge>
                        {booking.status === "booked" && (
                          <>
                            <Button size="icon" variant="ghost" title="Mark completed" onClick={() => setConsultStatus(booking.cb_id, "completed")}>
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" title="Cancel" onClick={() => setConsultStatus(booking.cb_id, "cancelled")}>
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </TabsContent>

        <TabsContent value="resources" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="serif text-2xl">Course materials</h3>
            <Dialog open={resOpen} onOpenChange={setResOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4" /> Post resource</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>New resource</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Course</Label>
                    <Select value={resDraft.course_code} onValueChange={(v) => setResDraft({ ...resDraft, course_code: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select course" /></SelectTrigger>
                      <SelectContent>
                        {(myCourseCodes.length ? myCourseCodes : courses.map((c) => c.course_code)).map((code) => (
                          <SelectItem key={code} value={code}>{code}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Title</Label>
                    <Input value={resDraft.title} onChange={(e) => setResDraft({ ...resDraft, title: e.target.value })} className="mt-1" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Type</Label>
                      <Select value={resDraft.type} onValueChange={(v) => setResDraft({ ...resDraft, type: v })}>
                        <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>URL</Label>
                      <Input value={resDraft.url} onChange={(e) => setResDraft({ ...resDraft, url: e.target.value })} className="mt-1" placeholder="https://…" />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setResOpen(false)}>Cancel</Button>
                  <Button onClick={submitResource}>Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="paper-card p-4">
            {myResources.length === 0 ? (
              <p className="text-sm text-muted-foreground">No resources posted yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {myResources.map((r) => (
                  <li key={r.resource_id} className="py-3 flex items-center gap-3">
                    <Badge variant="outline" className="shrink-0">{r.course_code}</Badge>
                    <div className="flex-1 min-w-0">
                      <a href={r.url} target="_blank" rel="noreferrer" className="font-medium hover:underline">
                        {r.title}
                      </a>
                      <div className="text-xs text-muted-foreground">{r.uploaded_at}</div>
                    </div>
                    <Badge variant="secondary">{r.type}</Badge>
                    <Button variant="ghost" size="icon" onClick={() => removeResource(r.resource_id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="paper-card p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div className="serif text-3xl mt-1">{value}</div>
    </div>
  );
}
