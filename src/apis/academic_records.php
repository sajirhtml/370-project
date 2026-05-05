<?php
require_once __DIR__ . '/config.php';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sid = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;
    $sql = "SELECT `A-id` AS a_id, Student_id AS student_id, Title AS title, Type AS type, Due_date AS due_date FROM academic_records";
    if ($sid) $sql .= " WHERE Student_id = $sid";
    $res = $conn->query($sql);
    $rows = [];
    while ($r = $res->fetch_assoc()) $rows[] = $r;
    echo json_encode($rows);
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $conn->prepare("INSERT INTO academic_records (Student_id, Title, Type, Due_date) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("isss", $data['student_id'], $data['title'], $data['type'], $data['due_date']);
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "a_id" => $conn->insert_id]);
    } else {
        http_response_code(400);
        echo json_encode(["error" => $stmt->error]);
    }
}
