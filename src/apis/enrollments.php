<?php
require_once __DIR__ . '/config.php';

ob_start();
set_error_handler(function ($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

function fail_json(int $status, string $message): void
{
    if (ob_get_length()) ob_clean();
    http_response_code($status);
    echo json_encode(["error" => $message]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $sid = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;
        $sql = "SELECT Student_id AS student_id, Course_code AS course_code, semester, grade, grade_point, status FROM enrollment";
        if ($sid) $sql .= " WHERE Student_id = $sid";
        $res = $conn->query($sql);
        $rows = [];
        while ($r = $res->fetch_assoc()) $rows[] = $r;
        if (ob_get_length()) ob_clean();
        echo json_encode($rows);
    } catch (Throwable $e) {
        fail_json(500, $e->getMessage());
    }
} elseif ($method === 'POST') {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data) fail_json(400, "Invalid JSON");
        
        $sid = intval($data['student_id'] ?? 0);
        $code = $conn->real_escape_string($data['course_code'] ?? '');
        $semester = $conn->real_escape_string($data['semester'] ?? '');
        $grade = $conn->real_escape_string($data['grade'] ?? '');
        $gp = floatval($data['grade_point'] ?? 0);
        $status = $conn->real_escape_string($data['status'] ?? 'completed');
        
        if (!$sid || !$code) fail_json(400, "Missing student_id or course_code");
        
        // Debug: Check what exists in regular_student for this ID
        $debug_check = $conn->prepare("SELECT User_id, Student_id FROM regular_student WHERE User_id = ? OR Student_id = ?");
        if (!$debug_check) fail_json(500, "Debug check prepare failed: " . $conn->error);
        $debug_check->bind_param('ii', $sid, $sid);
        $debug_check->execute();
        $debug_result = $debug_check->get_result();
        if ($debug_result->num_rows === 0) {
            $debug_check->close();
            fail_json(404, "Student ID $sid not found - no rows in regular_student match User_id=$sid OR Student_id=$sid");
        }
        $debug_row = $debug_result->fetch_assoc();
        $user_id = intval($debug_row['User_id']);
        $found_student_id = intval($debug_row['Student_id']);
        $debug_check->close();
        
        // Use the resolved user_id for the enrollment
        $sid = $user_id;
        
        // Check for duplicate
        $check = $conn->prepare("SELECT 1 FROM enrollment WHERE Student_id = ? AND Course_code = ? LIMIT 1");
        if (!$check) fail_json(500, "Prepare failed: " . $conn->error);
        $check->bind_param('is', $sid, $code);
        $check->execute();
        $check->store_result();
        if ($check->num_rows > 0) {
            $check->close();
            fail_json(409, "This course is already in the student's enrollment.");
        }
        $check->close();
        
        // Verify the User_id actually exists in regular_student (before inserting)
        $verify = $conn->prepare("SELECT 1 FROM regular_student WHERE User_id = ? LIMIT 1");
        if (!$verify) fail_json(500, "Verify prepare failed: " . $conn->error);
        $verify->bind_param('i', $sid);
        $verify->execute();
        $verify->store_result();
        if ($verify->num_rows === 0) {
            $verify->close();
            fail_json(500, "FK Constraint Error: User_id=$sid does not exist in regular_student, cannot insert into enrollment");
        }
        $verify->close();
        
        $stmt = $conn->prepare("INSERT INTO enrollment (Student_id, Course_code, semester, grade, grade_point, status) VALUES (?, ?, ?, ?, ?, ?)");
        if (!$stmt) fail_json(500, "Prepare insert failed: " . $conn->error);
        $stmt->bind_param('isssds', $sid, $code, $semester, $grade, $gp, $status);
        if (!$stmt->execute()) fail_json(500, "Insert failed - trying to insert User_id=$sid for course $code: " . $stmt->error);
        $stmt->close();
        
        if (ob_get_length()) ob_clean();
        echo json_encode(["success" => true]);
    } catch (Throwable $e) {
        fail_json(500, $e->getMessage());
    }
} elseif ($method === 'DELETE') {
    try {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || !isset($data['student_id']) || !isset($data['course_code'])) {
            fail_json(400, "Missing student_id or course_code");
        }
        $sid = intval($data['student_id']);
        $code = $conn->real_escape_string($data['course_code']);
        
        // Resolve student_id to User_id: check if it's a User_id directly, or if it's a Student_id that needs lookup
        $lookup_stmt = $conn->prepare("SELECT User_id FROM regular_student WHERE User_id = ? OR Student_id = ? LIMIT 1");
        if (!$lookup_stmt) fail_json(500, "Prepare lookup failed: " . $conn->error);
        $lookup_stmt->bind_param('ii', $sid, $sid);
        $lookup_stmt->execute();
        $lookup_result = $lookup_stmt->get_result();
        if ($lookup_result->num_rows === 0) {
            $lookup_stmt->close();
            fail_json(404, "Student not found");
        }
        $lookup_row = $lookup_result->fetch_assoc();
        $user_id = intval($lookup_row['User_id']);
        $lookup_stmt->close();
        
        // Use the resolved user_id for the delete
        $sid = $user_id;
        
        $stmt = $conn->prepare("DELETE FROM enrollment WHERE Student_id = ? AND Course_code = ?");
        if (!$stmt) fail_json(500, "Prepare delete failed: " . $conn->error);
        $stmt->bind_param('is', $sid, $code);
        if (!$stmt->execute()) fail_json(500, "Delete failed: " . $stmt->error);
        $stmt->close();
        
        if (ob_get_length()) ob_clean();
        echo json_encode(["success" => true]);
    } catch (Throwable $e) {
        fail_json(500, $e->getMessage());
    }
}
