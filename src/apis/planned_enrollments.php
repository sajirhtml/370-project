<?php
require_once __DIR__ . '/config.php';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sid = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;
    $sql = "SELECT id, Student_id AS student_id, Course_code AS course_code, Section_num AS section_num FROM planned_enrollment";
    if ($sid) $sql .= " WHERE Student_id = $sid";
    $res = $conn->query($sql);
    $rows = [];
    while ($r = $res->fetch_assoc()) $rows[] = $r;
    echo json_encode($rows);
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $conn->prepare("INSERT INTO planned_enrollment (Student_id, Course_code, Section_num) VALUES (?, ?, ?)");
    $stmt->bind_param("iss", $data['student_id'], $data['course_code'], $data['section_num']);
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "id" => $conn->insert_id]);
    } else {
        http_response_code(400);
        echo json_encode(["error" => $stmt->error]);
    }
} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $conn->prepare("DELETE FROM planned_enrollment WHERE Student_id = ? AND Course_code = ?");
    $stmt->bind_param("is", $data['student_id'], $data['course_code']);
    $stmt->execute();
    echo json_encode(["success" => true]);
}
