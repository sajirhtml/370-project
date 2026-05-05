import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";
import { resetAll } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  LayoutDashboard, BookOpen, CalendarClock, Calculator, KanbanSquare,
  DoorOpen, Library, CalendarCheck, GraduationCap, RotateCcw, Plus, CheckSquare, UserPlus,
  Settings, LogOut
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Academic",
    items: [
      { to: "/",              label: "Dashboard",     icon: LayoutDashboard },
      { to: "/planner",       label: "Course Planner", icon: BookOpen },
      { to: "/schedule",      label: "Schedule",       icon: CalendarClock },
      { to: "/courses",       label: "My Courses",     icon: CheckSquare },
      { to: "/cgpa",          label: "CGPA Predictor", icon: Calculator },
    ]
  },
  {
    label: "Management",
    items: [
      { to: "/tasks",         label: "Tasks",          icon: KanbanSquare },
      { to: "/resources",     label: "Resources",      icon: Library },
      { to: "/rooms",         label: "Rooms",          icon: DoorOpen },
      { to: "/consultations", label: "Consultations",  icon: CalendarCheck },
    ]
  },
  {
    label: "Administration",
    items: [
      { to: "/faculty",       label: "Faculty Portal", icon: GraduationCap },
      { to: "/faculty/new",   label: "Add Faculty",    icon: UserPlus },
      { to: "/students/new",  label: "Add Student",    icon: Plus },
    ]
  }
];

export default function Layout() {
  const { students, activeStudent, switchUser } = useUser();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar - Fixed the squishing with min-w */}
      <aside className="w-72 min-w-[280px] hidden md:flex flex-col border-r border-border bg-card">
        <div className="p-6">
          <div className="flex items-center gap-2 px-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">SCMS</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                Academic Portal
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 pb-4 space-y-8 overflow-y-auto custom-scrollbar">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="space-y-2">
              <h3 className="px-4 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
                {group.label}
              </h3>
              <div className="space-y-1">
                {group.items.map(({ to, label, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={to === "/"}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors ${
                        isActive
                          ? "bg-secondary text-secondary-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            onClick={() => { if (confirm("Reset all data?")) resetAll(); }}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Environment
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-4 flex-1">
            <Select value={String(activeStudent?.user_id ?? "")} onValueChange={(v) => switchUser(v)}>
              <SelectTrigger className="w-[300px] h-9 bg-muted/50 border-none shadow-none focus:ring-1">
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.user_id} value={String(s.user_id)}>
                    <span className="font-medium">{s.name}</span>
                    <span className="ml-2 text-muted-foreground text-xs">{s.dept} • Sem {s.semester}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 px-4"
              onClick={() => navigate(`/students/${activeStudent?.user_id}/edit`)}
            >
              Profile Settings
            </Button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-muted/20">
          <div className="max-w-7xl mx-auto p-6 md:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}