import { createContext, useContext, useEffect, useState } from "react";
import { getTable, loadFromAPI, isReady } from "@/lib/db";

const UserContext = createContext(null);
const ACTIVE_KEY = "scms.activeUserId";

export function UserProvider({ children }) {
  const [loading, setLoading] = useState(!isReady());
  const [students, setStudents] = useState([]);
  const [activeId, setActiveId] = useState(() => {
    const raw = localStorage.getItem(ACTIVE_KEY);
    return raw ? Number(raw) : 1;
  });

  useEffect(() => {
    loadFromAPI().then(() => {
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (loading) return;
    const load = () => {
      const users = getTable("USERS");
      const regs = getTable("REGULAR_STUDENT");
      const studs = regs.map((s) => ({
        ...s,
        ...users.find((u) => u.user_id === s.user_id),
      }));
      setStudents(studs);
    };
    load();
    window.addEventListener("scms:change", load);
    return () => window.removeEventListener("scms:change", load);
  }, [loading]);

  const switchUser = (id) => {
    localStorage.setItem(ACTIVE_KEY, String(id));
    setActiveId(Number(id));
  };

  const activeStudent = students.find((s) => s.user_id === activeId) ?? students[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 border-2 border-foreground border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground">Loading data from server…</p>
        </div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ students, activeStudent, switchUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used inside UserProvider");
  return ctx;
}
