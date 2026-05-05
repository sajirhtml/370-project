import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserProvider } from "@/context/UserContext";
import Layout from "@/components/Layout.jsx";
import Dashboard from "@/pages/Dashboard.jsx";
import CoursePlanner from "@/pages/CoursePlanner.jsx";
import CGPA from "@/pages/CGPA.jsx";
import Tasks from "@/pages/Tasks.jsx";
import Schedule from "@/pages/Schedule.jsx";
import Rooms from "@/pages/Rooms.jsx";
import Resources from "@/pages/Resources.jsx";
import Consultations from "@/pages/Consultations.jsx";
import Faculty from "@/pages/Faculty.jsx";
import Placeholder from "@/pages/Placeholder.jsx";
import NotFound from "./pages/NotFound.tsx";
import CreateStudent from "@/pages/CreateStudent.jsx";
import CreateStudentCourses from "@/pages/CreateStudentCourses.jsx";
import EditStudent from "@/pages/EditStudent.jsx";
import ManageCourses from "@/pages/ManageCourses.jsx";
import CreateFaculty from "@/pages/CreateFaculty.jsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <UserProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/planner" element={<CoursePlanner />} />
              <Route path="/schedule"      element={<Schedule />} />
              <Route path="/cgpa"          element={<CGPA />} />
              <Route path="/tasks"         element={<Tasks />} />
              <Route path="/rooms"         element={<Rooms />} />
              <Route path="/resources"     element={<Resources />} />
              <Route path="/consultations" element={<Consultations />} />
              <Route path="/faculty"       element={<Faculty />} />
              <Route path="/students/new" element={<CreateStudent />} />
              <Route path="/students/new/courses" element={<CreateStudentCourses />} />
              <Route path="/faculty/new" element={<CreateFaculty />} />
              <Route path="/students/:userId/edit" element={<EditStudent />} />
              <Route path="/students/:userId/courses" element={<CreateStudentCourses />} />
              <Route path="/courses" element={<ManageCourses />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </UserProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
