<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }

$conn = new mysqli("localhost", "root", "", "scms");
if ($conn->connect_error) { http_response_code(500); echo json_encode(["error" => "DB connection failed"]); exit; }

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $result = $conn->query("SELECT cb_id, booking_id, student_id, topic, status, booked_at FROM consultation_booking");
    $rows = [];
    while ($row = $result->fetch_assoc()) $rows[] = $row;
    echo json_encode($rows);

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $booking_id = intval($data['booking_id']);
    $student_id = intval($data['student_id']);
    $topic = $conn->real_escape_string($data['topic'] ?? '');

    // Check if slot already booked
    $check = $conn->query("SELECT cb_id FROM consultation_booking WHERE booking_id = $booking_id AND status = 'booked'");
    if ($check->num_rows > 0) {
        http_response_code(409);
        echo json_encode(["error" => "Slot already booked"]);
        exit;
    }

    $stmt = $conn->prepare("INSERT INTO consultation_booking (booking_id, student_id, topic, status) VALUES (?, ?, ?, 'booked')");
    $stmt->bind_param("iis", $booking_id, $student_id, $topic);
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "cb_id" => $conn->insert_id]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }

} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $cb_id = intval($data['cb_id']);
    $status = $conn->real_escape_string($data['status'] ?? 'cancelled');

    $stmt = $conn->prepare("UPDATE consultation_booking SET status = ? WHERE cb_id = ?");
    $stmt->bind_param("si", $status, $cb_id);
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
    }

} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $cb_id = intval($data['cb_id']);
    $conn->query("DELETE FROM consultation_booking WHERE cb_id = $cb_id");
    echo json_encode(["success" => true]);
}

$conn->close();