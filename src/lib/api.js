const BASE = "http://localhost/scms-api/api";

async function fetchJSON(endpoint) {
  const res = await fetch(`${BASE}/${endpoint}`);
  if (!res.ok) throw new Error(`API ${endpoint}: ${res.status}`);
  return res.json();
}

async function postJSON(endpoint, body) {
  const res = await fetch(`${BASE}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }
  if (!res.ok) {
    const message = payload?.error || payload?.message || text || `HTTP ${res.status}`;
    throw new Error(`API POST ${endpoint}: ${message}`);
  }
  return payload;
}

async function putJSON(endpoint, body) {
  const res = await fetch(`${BASE}/${endpoint}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }
  if (!res.ok) {
    const message = payload?.error || payload?.message || text || `HTTP ${res.status}`;
    throw new Error(`API PUT ${endpoint}: ${message}`);
  }
  return payload;
}

async function deleteJSON(endpoint, body) {
  const res = await fetch(`${BASE}/${endpoint}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let payload = null;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = null;
  }
  if (!res.ok) {
    const message = payload?.error || payload?.message || text || `HTTP ${res.status}`;
    throw new Error(`API DELETE ${endpoint}: ${message}`);
  }
  return payload;
}

const TABLE_ENDPOINTS = {
  USERS:              { endpoint: "users.php",              transform: (rows) => rows.map(r => ({ ...r, user_id: Number(r.user_id), is_guest: Number(r.is_guest) })) },
  REGULAR_STUDENT:    { endpoint: "students.php",           transform: (rows) => rows.map(r => ({ ...r, user_id: Number(r.user_id), student_id: Number(r.student_id), cgpa: parseFloat(r.cgpa), advisor_id: Number(r.advisor_id) })) },
  FACULTY:            { endpoint: "faculty.php",            transform: (rows) => rows.map(r => ({ ...r, user_id: Number(r.user_id), faculty_id: Number(r.faculty_id), is_active: Number(r.is_active) })) },
  ROOM:               { endpoint: "rooms.php",              transform: (rows) => rows.map(r => ({ ...r, room_id: Number(r.room_id) })) },
  COURSE:             { endpoint: "courses.php",            transform: (rows) => rows.map(r => ({ ...r, credit_hours: Number(r.credit_hours), capacity: Number(r.capacity), semester: String(r.semester) })) },
  PREREQUISITE:       { endpoint: "prerequisites.php",      transform: (rows) => rows },
  SECTION:            { endpoint: "sections.php",           transform: (rows) => rows.map(r => ({ ...r, faculty_id: Number(r.faculty_id), room_id: Number(r.room_id) })) },
  ENROLLMENT:         { endpoint: "enrollments.php",        transform: (rows) => rows.map(r => ({ ...r, student_id: Number(r.student_id), grade_point: parseFloat(r.grade_point) })) },
  PLANNED_ENROLLMENT: { endpoint: "planned_enrollments.php", transform: (rows) => rows.map(r => ({ ...r, student_id: Number(r.student_id) })) },
  TASK:               { endpoint: "tasks.php",              transform: (rows) => rows.map(r => ({ ...r, t_id: Number(r.t_id), student_id: Number(r.student_id) })) },
  CONSULTATION:       {
    endpoint: "consultations.php",
    transform: (rows) => rows.map((r) => ({
      ...r,
      booking_id: Number(r.Booking_id ?? r.booking_id),
      faculty_id: Number(r.Faculty_id ?? r.faculty_id),
      day: r.day ?? r.Day,
      start_time: r.start_time ?? r.Start_Time,
      end_time: r.end_time ?? r.End_Time,
      Day: r.Day ?? r.day,
      Start_Time: r.Start_Time ?? r.start_time,
      End_Time: r.End_Time ?? r.end_time,
      room_id: r.room_id ? Number(r.room_id) : (r.Room_id ? Number(r.Room_id) : undefined),
      room_no: r.room_no ?? r.Room_No,
      Room_No: r.Room_No ?? r.room_no,
      Building: r.Building ?? r.building,
      faculty_name: r.faculty_name,
      dept: r.dept,
    }))
  },
  
  CONSULTATION_BOOKING: { endpoint: "consultation_bookings.php", transform: (rows) => rows.map(r => ({ ...r, cb_id: Number(r.cb_id), booking_id: Number(r.booking_id), student_id: Number(r.student_id) })) },
  RESOURCES:          { endpoint: "resources.php",          transform: (rows) => rows.map(r => ({ ...r, resource_id: Number(r.resource_id), uploaded_by: Number(r.uploaded_by) })) },
};

export async function fetchTable(tableName) {
  const cfg = TABLE_ENDPOINTS[tableName];
  if (!cfg) {
    console.warn(`No API endpoint for table: ${tableName}`);
    return [];
  }
  try {
    const data = await fetchJSON(cfg.endpoint);
    return cfg.transform(Array.isArray(data) ? data : []);
  } catch (err) {
    console.error(`Failed to fetch ${tableName}:`, err);
    return [];
  }
}

export async function fetchAllTables() {
  const names = Object.keys(TABLE_ENDPOINTS);
  const results = await Promise.allSettled(names.map((n) => fetchTable(n)));
  const map = {};
  names.forEach((name, i) => {
    map[name] = results[i].status === "fulfilled" ? results[i].value : [];
  });
  return map;
}

export async function apiAddTask(task) {
  return postJSON("tasks.php", task);
}

export async function apiUpdateTask(task) {
  return putJSON("tasks.php", task);
}

export async function apiDeleteTask(t_id) {
  return deleteJSON("tasks.php", { t_id });
}

export async function apiAddPlannedEnrollment(row) {
  return postJSON("planned_enrollments.php", row);
}

export async function apiAddEnrollment(row) {
  return postJSON("enrollments.php", row);
}

export async function apiAddFaculty(row) {
  return postJSON("create_faculty.php", row);
}

export async function apiUpdateUser(user) {
  return putJSON("users.php", user);
}

export async function apiUpdateStudent(student) {
  return putJSON("students.php", student);
}

export async function apiDeletePlannedEnrollment(student_id, course_code) {
  return deleteJSON("planned_enrollments.php", { student_id, course_code });
}

export async function apiBookConsultation(booking) {
  return postJSON("consultation_bookings.php", booking);
}

export async function apiCancelConsultation(cb_id) {
  return putJSON("consultation_bookings.php", { cb_id, status: "cancelled" });
}

export async function apiUpdateConsultationBookingStatus(cb_id, status) {
  return putJSON("consultation_bookings.php", { cb_id, status });
}

export async function apiAddConsultation(slot) {
  return postJSON("consultations.php", slot);
}

export async function apiUpdateConsultation(slot) {
  return putJSON("consultations.php", slot);
}

export async function apiDeleteConsultation(booking_id) {
  return deleteJSON("consultations.php", { booking_id });
}

export async function apiAddResource(resource) {
  return postJSON("resources.php", resource);
}

export async function apiDeleteResource(resource_id) {
  return deleteJSON("resources.php", { resource_id });
}

export { postJSON, putJSON, deleteJSON, fetchJSON };
