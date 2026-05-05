<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $res = $conn->query(
        "SELECT s.User_id AS user_id, s.Student_id AS student_id, s.CGPA AS cgpa,\n         s.Semester AS semester, s.Advisor_id AS advisor_id, s.Booking_id AS booking_id,\n         s.Status AS status,\n         CONCAT(u.First_Name, ' ', u.Last_Name) AS name, u.`E-mail` AS email, u.Dept AS dept\n  FROM regular_student s\n  JOIN user u ON u.User_id = s.User_id"
    );
    $rows = [];
    while ($r = $res->fetch_assoc()) $rows[] = $r;
    echo json_encode($rows);

} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!$data || !isset($data['user_id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid payload"]);
        exit;
    }
    $user_id = intval($data['user_id']);
    $student_id = isset($data['student_id']) ? intval($data['student_id']) : null;
    $cgpa = isset($data['cgpa']) && $data['cgpa'] !== null ? floatval($data['cgpa']) : null;
    $semester = isset($data['semester']) ? $conn->real_escape_string($data['semester']) : null;
    $advisor = isset($data['advisor_id']) ? (is_numeric($data['advisor_id']) ? intval($data['advisor_id']) : null) : null;
    $status = isset($data['status']) ? $conn->real_escape_string($data['status']) : null;

    // Build update dynamically
    $sets = [];
    $params = [];
    $types = '';
    if ($student_id !== null) { $sets[] = 'Student_id = ?'; $types .= 'i'; $params[] = $student_id; }
    if ($cgpa !== null) { $sets[] = 'CGPA = ?'; $types .= 'd'; $params[] = $cgpa; }
    if ($semester !== null) { $sets[] = 'Semester = ?'; $types .= 's'; $params[] = $semester; }
    if ($advisor !== null) { $sets[] = 'Advisor_id = ?'; $types .= 'i'; $params[] = $advisor; }
    if ($status !== null) { $sets[] = 'Status = ?'; $types .= 's'; $params[] = $status; }

    if (count($sets) === 0) {
        echo json_encode(["success" => true]);
        exit;
    }

    $sql = "UPDATE regular_student SET " . implode(', ', $sets) . " WHERE User_id = ?";
    $types .= 'i';
    $params[] = $user_id;

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        http_response_code(500);
        echo json_encode(["error" => $conn->error]);
        exit;
    }
    // bind params dynamically
    $bind_names = [];
    $bind_names[] = $types;
    for ($i=0; $i<count($params); $i++) {
        $bind_name = 'bind' . $i;
        $$bind_name = $params[$i];
        $bind_names[] = &$$bind_name;
    }
    call_user_func_array([$stmt, 'bind_param'], $bind_names);
    if (!$stmt->execute()) {
        http_response_code(500);
        echo json_encode(["error" => $stmt->error]);
        exit;
    }
    echo json_encode(["success" => true]);
}
