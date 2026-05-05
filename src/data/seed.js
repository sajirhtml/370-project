export const USERS = [
  { user_id: 1, name: "Aarav Hossain",   email: "aarav@uni.edu",   dept: "CSE", is_guest: 0 },
  { user_id: 2, name: "Lamia Chowdhury", email: "lamia@uni.edu",   dept: "EEE", is_guest: 0 },
  { user_id: 3, name: "Nabil Rahman",    email: "nabil@uni.edu",   dept: "MAT", is_guest: 0 },
  { user_id: 10, name: "Dr. Sultana Karim", email: "skarim@uni.edu",  dept: "CSE", is_guest: 0 },
  { user_id: 11, name: "Dr. Imran Hasan",   email: "ihasan@uni.edu",  dept: "EEE", is_guest: 0 },
  { user_id: 12, name: "Dr. Tahmina Roy",   email: "troy@uni.edu",    dept: "MAT", is_guest: 0 },
];

export const REGULAR_STUDENT = [
  { user_id: 1, student_id: 2210101, cgpa: 3.62, semester: "5", advisor_id: 10, status: "active" },
  { user_id: 2, student_id: 2210202, cgpa: 3.41, semester: "4", advisor_id: 11, status: "active" },
  { user_id: 3, student_id: 2210303, cgpa: 3.85, semester: "6", advisor_id: 12, status: "active" },
];

export const FACULTY = [
  { user_id: 10, faculty_id: 901, email: "skarim@uni.edu", designation: "Associate Prof.", is_active: 1 },
  { user_id: 11, faculty_id: 902, email: "ihasan@uni.edu", designation: "Assistant Prof.", is_active: 1 },
  { user_id: 12, faculty_id: 903, email: "troy@uni.edu",   designation: "Professor",       is_active: 1 },
];

export const ROOM = [
  { room_id: 1, room_no: "A-301", type: "Classroom", building: "A" },
  { room_id: 2, room_no: "A-402", type: "Classroom", building: "A" },
  { room_id: 3, room_no: "B-101", type: "Lab",       building: "B" },
  { room_id: 4, room_no: "B-205", type: "Lab",       building: "B" },
  { room_id: 5, room_no: "C-110", type: "Classroom", building: "C" },
  { room_id: 6, room_no: "C-220", type: "Classroom", building: "C" },
];

export const COURSE = [
  { course_code: "CSE101", title: "Intro to Programming",     description: "Foundations of programming in C.",      semester: "1", credit_hours: 3, capacity: 40 },
  { course_code: "CSE201", title: "Data Structures",          description: "Lists, trees, graphs, complexity.",     semester: "3", credit_hours: 3, capacity: 35 },
  { course_code: "CSE301", title: "Algorithms",               description: "Design and analysis of algorithms.",    semester: "4", credit_hours: 3, capacity: 35 },
  { course_code: "CSE331", title: "Database Systems",         description: "Relational model, SQL, normalization.", semester: "5", credit_hours: 3, capacity: 35 },
  { course_code: "CSE361", title: "Operating Systems",        description: "Processes, memory, file systems.",      semester: "5", credit_hours: 3, capacity: 35 },
  { course_code: "EEE101", title: "Circuit Analysis I",       description: "DC and AC circuit fundamentals.",       semester: "1", credit_hours: 3, capacity: 40 },
  { course_code: "EEE201", title: "Electronics I",            description: "Diodes, transistors, amplifiers.",      semester: "3", credit_hours: 3, capacity: 35 },
  { course_code: "EEE301", title: "Signals & Systems",        description: "Continuous and discrete signals.",      semester: "4", credit_hours: 3, capacity: 35 },
  { course_code: "MAT101", title: "Calculus I",               description: "Limits, derivatives, integrals.",       semester: "1", credit_hours: 3, capacity: 50 },
  { course_code: "MAT201", title: "Linear Algebra",           description: "Vectors, matrices, eigenvalues.",       semester: "2", credit_hours: 3, capacity: 50 },
  { course_code: "MAT301", title: "Probability & Statistics", description: "Probability theory and inference.",     semester: "3", credit_hours: 3, capacity: 50 },
  { course_code: "MAT401", title: "Discrete Mathematics",     description: "Logic, sets, combinatorics, graphs.",   semester: "2", credit_hours: 3, capacity: 50 },
];

export const PREREQUISITE = [
  { course_code: "CSE201", prerequisite_course_code: "CSE101" },
  { course_code: "CSE301", prerequisite_course_code: "CSE201" },
  { course_code: "CSE301", prerequisite_course_code: "MAT401" },
  { course_code: "CSE331", prerequisite_course_code: "CSE201" },
  { course_code: "CSE361", prerequisite_course_code: "CSE201" },
  { course_code: "EEE201", prerequisite_course_code: "EEE101" },
  { course_code: "EEE301", prerequisite_course_code: "MAT201" },
  { course_code: "MAT201", prerequisite_course_code: "MAT101" },
  { course_code: "MAT301", prerequisite_course_code: "MAT201" },
];

export const SECTION = [
  { course_code: "CSE101", section_num: "A", faculty_id: 10, room_id: 1, day: "Sun", start_time: "09:00", end_time: "10:30" },
  { course_code: "CSE101", section_num: "B", faculty_id: 10, room_id: 1, day: "Tue", start_time: "09:00", end_time: "10:30" },
  { course_code: "CSE201", section_num: "A", faculty_id: 10, room_id: 2, day: "Sun", start_time: "11:00", end_time: "12:30" },
  { course_code: "CSE301", section_num: "A", faculty_id: 10, room_id: 2, day: "Mon", start_time: "09:00", end_time: "10:30" },
  { course_code: "CSE331", section_num: "A", faculty_id: 10, room_id: 3, day: "Mon", start_time: "11:00", end_time: "12:30" },
  { course_code: "CSE361", section_num: "A", faculty_id: 10, room_id: 4, day: "Wed", start_time: "09:00", end_time: "10:30" },
  { course_code: "EEE101", section_num: "A", faculty_id: 11, room_id: 5, day: "Sun", start_time: "09:00", end_time: "10:30" },
  { course_code: "EEE201", section_num: "A", faculty_id: 11, room_id: 5, day: "Tue", start_time: "11:00", end_time: "12:30" },
  { course_code: "EEE301", section_num: "A", faculty_id: 11, room_id: 6, day: "Wed", start_time: "11:00", end_time: "12:30" },
  { course_code: "MAT101", section_num: "A", faculty_id: 12, room_id: 6, day: "Mon", start_time: "14:00", end_time: "15:30" },
  { course_code: "MAT201", section_num: "A", faculty_id: 12, room_id: 6, day: "Tue", start_time: "14:00", end_time: "15:30" },
  { course_code: "MAT301", section_num: "A", faculty_id: 12, room_id: 5, day: "Wed", start_time: "14:00", end_time: "15:30" },
  { course_code: "MAT401", section_num: "A", faculty_id: 12, room_id: 5, day: "Sun", start_time: "14:00", end_time: "15:30" },
];

export const ENROLLMENT = [
  { student_id: 1, course_code: "CSE101", grade: "A",  grade_point: 4.0, status: "completed" },
  { student_id: 1, course_code: "MAT101", grade: "A-", grade_point: 3.7, status: "completed" },
  { student_id: 1, course_code: "MAT201", grade: "B+", grade_point: 3.3, status: "completed" },
  { student_id: 1, course_code: "MAT401", grade: "A",  grade_point: 4.0, status: "completed" },
  { student_id: 1, course_code: "CSE201", grade: "B+", grade_point: 3.3, status: "completed" },
  { student_id: 1, course_code: "CSE301", grade: "A-", grade_point: 3.7, status: "completed" },
  { student_id: 2, course_code: "EEE101", grade: "B+", grade_point: 3.3, status: "completed" },
  { student_id: 2, course_code: "MAT101", grade: "A-", grade_point: 3.7, status: "completed" },
  { student_id: 2, course_code: "MAT201", grade: "B",  grade_point: 3.0, status: "completed" },
  { student_id: 3, course_code: "MAT101", grade: "A",  grade_point: 4.0, status: "completed" },
  { student_id: 3, course_code: "MAT201", grade: "A",  grade_point: 4.0, status: "completed" },
  { student_id: 3, course_code: "MAT301", grade: "A",  grade_point: 4.0, status: "completed" },
  { student_id: 3, course_code: "MAT401", grade: "A-", grade_point: 3.7, status: "completed" },
];

export const PLANNED_ENROLLMENT = [];

export const TASK = [];
export const ACADEMIC_RECORDS = [];
export const FACULTY_SLOT = [
  { slot_id: 1, faculty_id: 10, day: "Mon", start_time: "14:00", end_time: "14:30", room_id: 2 },
  { slot_id: 2, faculty_id: 10, day: "Mon", start_time: "14:30", end_time: "15:00", room_id: 2 },
  { slot_id: 3, faculty_id: 10, day: "Wed", start_time: "11:00", end_time: "11:30", room_id: 2 },
  { slot_id: 4, faculty_id: 11, day: "Tue", start_time: "13:00", end_time: "13:30", room_id: 5 },
  { slot_id: 5, faculty_id: 11, day: "Tue", start_time: "13:30", end_time: "14:00", room_id: 5 },
  { slot_id: 6, faculty_id: 11, day: "Thu", start_time: "10:00", end_time: "10:30", room_id: 5 },
  { slot_id: 7, faculty_id: 12, day: "Sun", start_time: "11:00", end_time: "11:30", room_id: 6 },
  { slot_id: 8, faculty_id: 12, day: "Wed", start_time: "15:30", end_time: "16:00", room_id: 6 },
];

export const CONSULTATION = [];
export const RESOURCES = [
  { resource_id: 1, course_code: "CSE101", title: "C Programming Cheatsheet", type: "Note",     url: "https://en.cppreference.com/w/c/language", uploaded_by: 10, uploaded_at: "2026-01-12" },
  { resource_id: 2, course_code: "CSE101", title: "Lecture 1 — Hello World",  type: "Slides",   url: "https://example.com/cse101-l1.pdf",         uploaded_by: 10, uploaded_at: "2026-01-15" },
  { resource_id: 3, course_code: "CSE201", title: "Visualizing Data Structures", type: "Link",  url: "https://visualgo.net/en",                   uploaded_by: 10, uploaded_at: "2026-02-02" },
  { resource_id: 4, course_code: "CSE301", title: "MIT 6.006 — Algorithms",   type: "Video",    url: "https://ocw.mit.edu/6-006",                 uploaded_by: 10, uploaded_at: "2026-02-10" },
  { resource_id: 5, course_code: "CSE331", title: "SQL Practice — LeetCode",  type: "Link",     url: "https://leetcode.com/studyplan/top-sql-50/", uploaded_by: 10, uploaded_at: "2026-02-18" },
  { resource_id: 6, course_code: "MAT101", title: "Khan Academy — Calculus",  type: "Video",    url: "https://www.khanacademy.org/math/calculus-1", uploaded_by: 12, uploaded_at: "2026-01-20" },
  { resource_id: 7, course_code: "MAT201", title: "3Blue1Brown — Linear Algebra", type: "Video", url: "https://www.3blue1brown.com/topics/linear-algebra", uploaded_by: 12, uploaded_at: "2026-01-22" },
  { resource_id: 8, course_code: "EEE101", title: "All About Circuits",       type: "Link",     url: "https://www.allaboutcircuits.com/textbook/", uploaded_by: 11, uploaded_at: "2026-01-25" },
];

export const CREDIT_CAP = 15;
