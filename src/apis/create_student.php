<?php
require_once __DIR__ . '/config.php';

ob_start();
set_error_handler(function ($severity, $message, $file, $line) {
    throw new ErrorException($message, 0, $severity, $file, $line);
});

function fail_json(int $status, string $message): void
{
    if (ob_get_length()) {
        ob_clean();
    }
    http_response_code($status);
    echo json_encode(["error" => $message]);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
if (!$data) {
    fail_json(400, "Invalid JSON");
}

$first = $conn->real_escape_string($data['first_name'] ?? '');
$last = $conn->real_escape_string($data['last_name'] ?? '');
$email = $conn->real_escape_string($data['email'] ?? '');
$dept = $conn->real_escape_string($data['dept'] ?? '');
$student_id = $conn->real_escape_string($data['student_id'] ?? '');
$cgpa = isset($data['cgpa']) && $data['cgpa'] !== null ? floatval($data['cgpa']) : null;
$semester = $conn->real_escape_string($data['semester'] ?? '');

if (!$first || !$last || !$email || !$student_id) {
    fail_json(400, "Missing required fields");
}

// Prevent duplicate accounts before attempting inserts.
$email_check = $conn->prepare("SELECT 1 FROM user WHERE `E-mail` = ? LIMIT 1");
if (!$email_check) {
    fail_json(500, "Prepare email check failed: " . $conn->error);
}
$email_check->bind_param('s', $email);
$email_check->execute();
$email_check->store_result();
if ($email_check->num_rows > 0) {
    $email_check->close();
    fail_json(409, "A user with this email already exists.");
}
$email_check->close();

$student_check = $conn->prepare("SELECT 1 FROM regular_student WHERE Student_id = ? LIMIT 1");
if (!$student_check) {
    fail_json(500, "Prepare student check failed: " . $conn->error);
}
$student_id_int = intval($student_id);
$student_check->bind_param('i', $student_id_int);
$student_check->execute();
$student_check->store_result();
if ($student_check->num_rows > 0) {
    $student_check->close();
    fail_json(409, "A student with this student ID already exists.");
}
$student_check->close();

try {
    $conn->begin_transaction();

    // Insert into user table
    $stmt = $conn->prepare("INSERT INTO user (First_Name, Last_Name, `E-mail`, Dept, Is_guest) VALUES (?, ?, ?, ?, 0)");
    if (!$stmt) {
        throw new RuntimeException("Prepare user insert failed: " . $conn->error);
    }
    $stmt->bind_param('ssss', $first, $last, $email, $dept);
    if (!$stmt->execute()) {
        throw new RuntimeException("Insert user failed: " . $stmt->error);
    }
    $user_id = $conn->insert_id;
    $stmt->close();

    // Insert into regular_student
    if ($cgpa === null) {
        $stmt2 = $conn->prepare("INSERT INTO regular_student (User_id, Student_id, CGPA, Semester, Advisor_id, Status) VALUES (?, ?, NULL, ?, NULL, 'active')");
        if (!$stmt2) {
            throw new RuntimeException("Prepare student insert failed: " . $conn->error);
        }
        $stmt2->bind_param('iis', $user_id, $student_id_int, $semester);
    } else {
        $stmt2 = $conn->prepare("INSERT INTO regular_student (User_id, Student_id, CGPA, Semester, Advisor_id, Status) VALUES (?, ?, ?, ?, NULL, 'active')");
        if (!$stmt2) {
            throw new RuntimeException("Prepare student insert failed: " . $conn->error);
        }
        $stmt2->bind_param('iids', $user_id, $student_id_int, $cgpa, $semester);
    }

    if (!$stmt2->execute()) {
        throw new RuntimeException("Insert student failed: " . $stmt2->error);
    }
    $stmt2->close();

    $conn->commit();
    if (ob_get_length()) {
        ob_clean();
    }
    echo json_encode(["success" => true, "user_id" => $user_id]);
} catch (Throwable $e) {
    if ($conn->errno) {
        $conn->rollback();
    }
    fail_json(500, $e->getMessage());
}
