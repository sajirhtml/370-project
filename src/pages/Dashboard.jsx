import { Link } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { getCompletedCodes, plannedCredits, CREDIT_CAP } from "@/lib/academic";
import { useEffect, useState } from "react";

const CARDS = [
  { to: "/planner",       title: "Course Planner",  desc: "Pick eligible courses for next semester." },
  { to: "/schedule",      title: "Schedule",        desc: "Resolve section conflicts visually." },
  { to: "/cgpa",          title: "CGPA Predictor",  desc: "What grades hit your target?" },
  { to: "/tasks",         title: "Task Board",      desc: "Kanban for assignments & exams." },
  { to: "/rooms",         title: "Room Finder",     desc: "Find free study rooms right now." },
  { to: "/resources",     title: "Resources",       desc: "Shared notes & study materials." },
  { to: "/consultations", title: "Consultations",   desc: "Book faculty office hours." },
  { to: "/faculty",       title: "Faculty Portal",  desc: "Approve requests, advise students." },
];

export default function Dashboard() {
  const { activeStudent } = useUser();
  const [stats, setStats] = useState({ completed: 0, credits: 0 });

  useEffect(() => {
    if (!activeStudent) return;
    const refresh = () => setStats({
      completed: getCompletedCodes(activeStudent.user_id).length,
      credits: plannedCredits(activeStudent.user_id),
    });
    refresh();
    window.addEventListener("scms:change", refresh);
    return () => window.removeEventListener("scms:change", refresh);
  }, [activeStudent]);

  if (!activeStudent) return null;

  return (
    <div className="space-y-12">
      <header className="space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground font-medium">Welcome back</p>
          <h1 className="serif text-5xl md:text-6xl mt-4 font-light">{activeStudent.name}</h1>
          <p className="text-muted-foreground mt-3 text-base">
            {activeStudent.dept} · Semester {activeStudent.semester} · CGPA {activeStudent.cgpa?.toFixed(2)}
          </p>
        </div>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Completed Courses" value={stats.completed} />
        <Stat label="Planned Credits" value={`${stats.credits} / ${CREDIT_CAP}`} />
        <Stat label="Current CGPA" value={activeStudent.cgpa?.toFixed(2) ?? "—"} />
      </section>

      <section className="space-y-5">
        <div>
          <h2 className="serif text-3xl font-light">Quick Access</h2>
          <p className="text-muted-foreground text-sm mt-1">Explore all available tools and features</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {CARDS.map((c) => (
            <Link
              key={c.to}
              to={c.to}
              className="paper-card p-5 hover:border-foreground hover:shadow-lg active:scale-95 transition-all group"
            >
              <h4 className="serif text-lg group-hover:text-primary">{c.title}</h4>
              <p className="text-sm text-muted-foreground mt-2">{c.desc}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="paper-card p-6 bg-gradient-to-br from-card to-card/50">
      <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium">{label}</p>
      <p className="serif text-4xl mt-3 font-light">{value}</p>
    </div>
  );
}
