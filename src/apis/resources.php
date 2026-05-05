<?php
require_once __DIR__ . '/config.php';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $cc = isset($_GET['course_code']) ? $conn->real_escape_string($_GET['course_code']) : null;
    $sql = "SELECT Course_Code AS course_code, Title AS title, Type AS type FROM resources";
    if ($cc) $sql .= " WHERE Course_Code = '$cc'";
    $res = $conn->query($sql);
    $rows = [];
    while ($r = $res->fetch_assoc()) $rows[] = $r;
    echo json_encode($rows);
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $stmt = $conn->prepare("INSERT INTO resources (Course_Code, Title, Type) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $data['course_code'], $data['title'], $data['type']);
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(400);
        echo json_encode(["error" => $stmt->error]);
    }
}
