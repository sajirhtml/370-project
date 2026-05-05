import { useEffect, useMemo, useState } from "react";
import { useUser } from "@/context/UserContext";
import { getTable, updateTable } from "@/lib/db";
import { apiBookConsultation, apiCancelConsultation } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CalendarCheck, Clock, MapPin, X, User } from "lucide-react";
import { toast } from "sonner";

const DAY_ORDER = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4 };

export default function Consultations() {
  const { activeStudent } = useUser();
  const sid = activeStudent?.student_id;

  const [version, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);
  useEffect(() => {
    const h = () => bump();
    window.addEventListener("scms:change", h);
    return () => window.removeEventListener("scms:change", h);
  }, []);

  const slots = useMemo(() => getTable("CONSULTATION"), [version]);
  const bookings = useMemo(() => getTable("CONSULTATION_BOOKING"), [version]);
  const users = useMemo(() => getTable("USERS"), []);
  const faculty = useMemo(() => getTable("FACULTY"), []);
  const rooms = useMemo(() => getTable("ROOM"), []);

  const facultyById = (id) => users.find((u) => u.user_id === id);
  const roomById = (id) => rooms.find((r) => r.room_id === id);

  const bookedSlotIds = useMemo(
    () => new Set(bookings.filter((b) => b.status === "booked").map((b) => b.booking_id)),
    [bookings],
  );

  const myBookings = useMemo(
    () => bookings
      .filter((b) => b.student_id === sid && b.status !== "cancelled")
      .map((b) => ({ ...b, slot: slots.find((s) => s.booking_id === b.booking_id) }))
      .sort((a, b) => (DAY_ORDER[a.slot?.Day] ?? 9) - (DAY_ORDER[b.slot?.Day] ?? 9)),
    [bookings, slots, sid],
  );

  const byFaculty = useMemo(() => {
    const m = {};
    faculty.forEach((f) => { m[f.faculty_id] = []; });
    slots.forEach((s) => {
      const fid = s.faculty_id;
      m[fid] = m[fid] || [];
      m[fid].push(s);
    });
    Object.values(m).forEach((arr) =>
      arr.sort((a, b) =>
        (DAY_ORDER[a.Day] - DAY_ORDER[b.Day]) || (a.Start_Time || "").localeCompare(b.Start_Time || ""),
      ),
    );
    return m;
  }, [slots, faculty]);

  const [dialog, setDialog] = useState({ open: false, slot: null });
  const [topic, setTopic] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const openBook = (slot) => { setTopic(""); setDialog({ open: true, slot }); };

  const confirmBook = async () => {
    if (!topic.trim()) { toast.error("Add a brief topic."); return; }
    if (!sid) { toast.error("No active student."); return; }
    setSubmitting(true);
    try {
      const res = await apiBookConsultation({
        booking_id: dialog.slot.booking_id,
        student_id: sid,
        topic: topic.trim(),
      });
      updateTable("CONSULTATION_BOOKING", (rows) => [
        ...rows,
        {
          cb_id: res.cb_id,
          booking_id: dialog.slot.booking_id,
          student_id: sid,
          topic: topic.trim(),
          status: "booked",
          booked_at: new Date().toISOString(),
        },
      ]);
      setDialog({ open: false, slot: null });
      toast.success("Consultation booked.");
    } catch (err) {
      toast.error(err.message || "Failed to book.");
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async (cbId) => {
    try {
      await apiCancelConsultation(cbId);
      updateTable("CONSULTATION_BOOKING", (rows) =>
        rows.map((r) => (r.cb_id === cbId ? { ...r, status: "cancelled" } : r)),
      );
      toast.success("Booking cancelled.");
    } catch (err) {
      toast.error("Failed to cancel.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Office Hours</p>
        <h1 className="serif text-5xl mb-2">Faculty Consultations</h1>
        <p className="text-muted-foreground max-w-2xl">
          Browse weekly office-hour slots and reserve a 30-minute consultation with your professors.
        </p>
      </div>

      <div>
        <h2 className="serif text-2xl mb-3">My bookings</h2>
        {myBookings.length === 0 ? (
          <div className="paper-card p-8 text-center text-muted-foreground">
            <CalendarCheck className="h-7 w-7 mx-auto mb-2 opacity-60" />
            You have no upcoming consultations.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {myBookings.map((b) => {
              const fac = facultyById(b.slot?.faculty_id);
              return (
                <div key={b.cb_id} className="paper-card p-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="serif text-xl">{fac?.name}</div>
                    <p className="text-xs text-muted-foreground">{fac?.dept}</p>
                    <div className="mt-2 text-sm flex flex-wrap gap-x-4 gap-y-1">
                      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{b.slot?.Day} · {b.slot?.Start_Time}–{b.slot?.End_Time}</span>
                    </div>
                    <p className="text-sm mt-2"><span className="text-muted-foreground">Topic:</span> {b.topic}</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => cancel(b.cb_id)} title="Cancel">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="serif text-2xl mb-3">Available slots</h2>
        <div className="space-y-4">
          {faculty.map((f) => {
            const u = facultyById(f.user_id);
            const slotsList = byFaculty[f.faculty_id] || [];
            return (
              <div key={f.faculty_id} className="paper-card p-5">
                <div className="flex items-baseline justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-sm bg-secondary flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="serif text-2xl leading-tight">{u?.name}</div>
                      <p className="text-xs text-muted-foreground">{f.designation} · {u?.dept}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{slotsList.length} slot{slotsList.length === 1 ? "" : "s"}</span>
                </div>
                {slotsList.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No slots posted.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {slotsList.map((s) => {
                      const taken = bookedSlotIds.has(s.booking_id);
                      return (
                        <button
                          key={s.booking_id}
                          disabled={taken}
                          onClick={() => openBook(s)}
                          className={`text-left px-3 py-2 rounded-sm border transition-colors ${
                            taken
                              ? "bg-secondary/50 border-border text-muted-foreground cursor-not-allowed line-through"
                              : "border-border hover:bg-foreground hover:text-background"
                          }`}
                        >
                          <div className="text-sm font-medium">{s.Day} · {s.Start_Time}–{s.End_Time}</div>
                          <div className="text-[11px] opacity-80">{taken ? "booked" : "available"}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={dialog.open} onOpenChange={(o) => setDialog({ open: o, slot: o ? dialog.slot : null })}>
        <DialogContent>
          <DialogHeader><DialogTitle>Book consultation</DialogTitle></DialogHeader>
          {dialog.slot && (
            <div className="space-y-3">
              <div className="paper-card p-3 text-sm">
                <div className="font-medium">{facultyById(dialog.slot.faculty_id)?.name}</div>
                <div className="text-muted-foreground text-xs mt-1">
                  {dialog.slot.Day} · {dialog.slot.Start_Time}–{dialog.slot.End_Time}
                </div>
              </div>
              <div>
                <Label>Topic</Label>
                <Textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="What would you like to discuss?"
                  className="mt-1"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialog({ open: false, slot: null })}>Cancel</Button>
            <Button onClick={confirmBook} disabled={submitting}>
              {submitting ? "Booking…" : "Book slot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
