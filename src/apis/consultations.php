<?php
require_once __DIR__ . '/config.php';
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Joining room table to get Room_No and Building
    $res = $conn->query("
      SELECT 
        c.Booking_id AS booking_id, 
        c.Faculty_id AS faculty_id,
        c.`Day` AS day, 
        c.Start_time AS start_time, 
        c.End_time AS end_time,
        c.room_id,
        r.Room_No,
        r.Building,
        CONCAT(u.First_Name, ' ', u.Last_Name) AS faculty_name, 
        u.Dept AS dept
      FROM consultation c
      JOIN faculty f ON f.Faculty_id = c.Faculty_id
      JOIN user u ON u.User_id = f.User_id
      LEFT JOIN room r ON c.room_id = r.Room_id
    ");
    $rows = [];
    while ($r = $res->fetch_assoc()) $rows[] = $r;
    echo json_encode($rows);

} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    
    // Updated to include room_id (integer)
    $stmt = $conn->prepare("INSERT INTO consultation (Faculty_id, `Day`, Start_time, End_time, room_id) VALUES (?, ?, ?, ?, ?)");
    $stmt->bind_param("isssi", $data['faculty_id'], $data['day'], $data['start_time'], $data['end_time'], $data['room_id']);
    
    if ($stmt->execute()) {
        echo json_encode(["success" => true, "booking_id" => $conn->insert_id]);
    } else {
        http_response_code(400);
        echo json_encode(["error" => $stmt->error]);
    }
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    $booking_id = intval($data['booking_id'] ?? $data['Booking_id'] ?? 0);

    $stmt = $conn->prepare("UPDATE consultation SET Faculty_id = ?, `Day` = ?, Start_time = ?, End_time = ?, room_id = ? WHERE Booking_id = ?");
    $stmt->bind_param("isssii", $data['faculty_id'], $data['day'], $data['start_time'], $data['end_time'], $data['room_id'], $booking_id);

    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        http_response_code(400);
        echo json_encode(["error" => $stmt->error]);
    }
} elseif ($method === 'DELETE') {
    $data = json_decode(file_get_contents("php://input"), true);
    $booking_id = intval($data['booking_id'] ?? $data['Booking_id'] ?? 0);
    $stmt = $conn->prepare("DELETE FROM consultation WHERE Booking_id = ?");
    $stmt->bind_param("i", $booking_id);
    $stmt->execute();
    echo json_encode(["success" => true]);
}