import { useMemo, useState } from "react";
import { getTable } from "@/lib/db";
import { DAYS, HOURS } from "@/lib/schedule";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DoorOpen, CheckCircle2, XCircle } from "lucide-react";

const toMin = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const overlap = (aS, aE, bS, bE) => toMin(aS) < toMin(bE) && toMin(bS) < toMin(aE);

export default function Rooms() {
  const rooms = getTable("ROOM");
  const sections = getTable("SECTION");
  const courses = getTable("COURSE");

  const [day, setDay] = useState("Sun");
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("10:30");
  const [type, setType] = useState("any");
  const [building, setBuilding] = useState("any");

  const buildings = useMemo(() => [...new Set(rooms.map((r) => r.building))], [rooms]);

  const results = useMemo(() => {
    return rooms
      .filter((r) => (type === "any" || r.type === type))
      .filter((r) => (building === "any" || r.building === building))
      .map((r) => {
        const conflict = sections.find(
          (s) => s.room_id === r.room_id && s.day === day && overlap(start, end, s.start_time, s.end_time),
        );
        return { ...r, free: !conflict, conflict };
      });
  }, [rooms, sections, day, start, end, type, building]);

  const HOUR_PX = 36;
  const bookingsFor = (roomId) =>
    sections.filter((s) => s.room_id === roomId);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-2">Facilities</p>
        <h1 className="serif text-5xl mb-2">Room & Lab Finder</h1>
        <p className="text-muted-foreground max-w-2xl">
          Search for free classrooms and labs in any time window, or browse the weekly booking grid
          for each room.
        </p>
      </div>

      <div className="paper-card p-5 grid gap-4 md:grid-cols-5">
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Day</label>
          <Select value={day} onValueChange={setDay}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              {DAYS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Start</label>
          <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">End</label>
          <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Type</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="Classroom">Classroom</SelectItem>
              <SelectItem value="Lab">Lab</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wider text-muted-foreground">Building</label>
          <Select value={building} onValueChange={setBuilding}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              {buildings.map((b) => <SelectItem key={b} value={b}>Building {b}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <h2 className="serif text-2xl mb-3">
          Availability on {day}, {start}–{end}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((r) => (
            <div key={r.room_id} className="paper-card p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <DoorOpen className="h-4 w-4 text-muted-foreground" />
                    <span className="serif text-2xl">{r.room_no}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {r.type} · Building {r.building}
                  </p>
                </div>
                {r.free ? (
                  <Badge className="bg-success text-success-foreground hover:bg-success">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Free
                  </Badge>
                ) : (
                  <Badge variant="destructive">
                    <XCircle className="h-3 w-3 mr-1" /> Booked
                  </Badge>
                )}
              </div>
              {!r.free && r.conflict && (
                <p className="text-xs text-muted-foreground mt-3">
                  Booked by <span className="font-medium">{r.conflict.course_code}-{r.conflict.section_num}</span>{" "}
                  ({r.conflict.start_time}–{r.conflict.end_time})
                </p>
              )}
            </div>
          ))}
          {results.length === 0 && (
            <div className="paper-card p-10 text-center text-muted-foreground col-span-full">
              No rooms match your filters.
            </div>
          )}
        </div>
      </div>

      <div>
        <h2 className="serif text-2xl mb-3">Weekly bookings</h2>
        <div className="space-y-4">
          {results.map((r) => (
            <div key={r.room_id} className="paper-card p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="serif text-xl">{r.room_no}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    {r.type} · Building {r.building}
                  </span>
                </div>
              </div>
              <div className="grid" style={{ gridTemplateColumns: "50px repeat(5, 1fr)" }}>
                <div />
                {DAYS.map((d) => (
                  <div key={d} className="text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border px-2 py-1">
                    {d}
                  </div>
                ))}
                <div className="relative">
                  {HOURS.map((h) => (
                    <div key={h} className="border-b border-border/60 text-[10px] text-muted-foreground px-1 pt-0.5" style={{ height: HOUR_PX }}>
                      {String(h).padStart(2, "0")}
                    </div>
                  ))}
                </div>
                {DAYS.map((d) => (
                  <div key={d} className="relative border-l border-border" style={{ height: HOUR_PX * HOURS.length }}>
                    {HOURS.map((h) => (
                      <div key={h} className="border-b border-border/60" style={{ height: HOUR_PX }} />
                    ))}
                    {bookingsFor(r.room_id).filter((s) => s.day === d).map((s) => {
                      const top = ((toMin(s.start_time) - HOURS[0] * 60) / 60) * HOUR_PX;
                      const height = ((toMin(s.end_time) - toMin(s.start_time)) / 60) * HOUR_PX;
                      const course = courses.find((c) => c.course_code === s.course_code);
                      return (
                        <div
                          key={s.course_code + s.section_num}
                          className="absolute left-0.5 right-0.5 rounded-sm p-1 text-[10px] bg-foreground text-background overflow-hidden"
                          style={{ top, height }}
                          title={`${course?.title} (${s.start_time}–${s.end_time})`}
                        >
                          <div className="font-semibold">{s.course_code}·{s.section_num}</div>
                          <div className="opacity-80">{s.start_time}</div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
