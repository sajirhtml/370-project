<?php
require_once __DIR__ . '/config.php';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $sid = isset($_GET['student_id']) ? intval($_GET['student_id']) : null;
    $sql = "SELECT t_id, Student_id AS student_id, Title AS title, Course AS course, Status AS status, Type AS type, Due_Date AS due_date FROM task";
    if ($sid) $sql .= " WHERE Student_id = $sid";
    $res = $conn->query($sql);
    $rows = [];
    while ($r = $res->fetch_assoc()) $rows[] = $r;
    echo json_encode($rows);
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $conn->prepare("INSERT INTO task (Student_id, Title, Course, Status, Type, Due_Date) VALUES (?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("isssss", $data['student_id'], $data['title'], $data['course'], $data['status'], $data['type'], $data['due_date']);
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "t_id" => $conn->insert_id]);
    } else {
        http_response_code(400);
        echo json_encode(["error" => $stmt->error]);
    }
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $existing = null;
    if (!empty($data['t_id'])) {
        $lookup = $conn->prepare("SELECT Title, Course, Status, Type, Due_Date FROM task WHERE t_id=?");
        $lookup->bind_param("i", $data['t_id']);
        $lookup->execute();
        $existing = $lookup->get_result()->fetch_assoc() ?: null;
    }

    $title = $data['title'] ?? ($existing['Title'] ?? null);
    $course = $data['course'] ?? ($existing['Course'] ?? null);
    $status = $data['status'] ?? ($existing['Status'] ?? null);
    $type = $data['type'] ?? ($existing['Type'] ?? null);
    $dueDate = $data['due_date'] ?? ($existing['Due_Date'] ?? null);

    $stmt = $conn->prepare("UPDATE task SET Title=?, Course=?, Status=?, Type=?, Due_Date=? WHERE t_id=?");
    $stmt->bind_param("sssssi", $title, $course, $status, $type, $dueDate, $data['t_id']);
    $stmt->execute();
    echo json_encode(["success" => true]);
} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $conn->prepare("DELETE FROM task WHERE t_id = ?");
    $stmt->bind_param("i", $data['t_id']);
    $stmt->execute();
    echo json_encode(["success" => true]);
}
