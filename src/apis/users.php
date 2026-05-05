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
        $res = $conn->query("SELECT User_id AS user_id, CONCAT(First_Name, ' ', Last_Name) AS name, `E-mail` AS email, Dept AS dept, Is_guest AS is_guest FROM user");
        $rows = [];
        while ($r = $res->fetch_assoc()) $rows[] = $r;
        if (ob_get_length()) ob_clean();
        echo json_encode($rows);
    } catch (Throwable $e) {
        fail_json(500, $e->getMessage());
    }
} elseif ($method === 'PUT') {
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        if (!$data || !isset($data['user_id'])) {
            fail_json(400, "Invalid payload");
        }
        $uid = intval($data['user_id']);
        
        // Check if email is being changed to one that already exists (excluding current user)
        if (isset($data['email'])) {
            $newemail = $conn->real_escape_string($data['email']);
            $check = $conn->prepare("SELECT 1 FROM user WHERE `E-mail` = ? AND User_id != ? LIMIT 1");
            if (!$check) fail_json(500, "Prepare check failed: " . $conn->error);
            $check->bind_param('si', $newemail, $uid);
            $check->execute();
            $check->store_result();
            if ($check->num_rows > 0) {
                $check->close();
                fail_json(409, "Email already in use by another user.");
            }
            $check->close();
        }
        
        $stmt = $conn->prepare("UPDATE user SET First_Name = ?, Last_Name = ?, `E-mail` = ?, Dept = ? WHERE User_id = ?");
        if (!$stmt) fail_json(500, "Prepare failed: " . $conn->error);
        $stmt->bind_param('ssssi', $data['first_name'], $data['last_name'], $data['email'], $data['dept'], $uid);
        if (!$stmt->execute()) fail_json(500, "Update failed: " . $stmt->error);
        $stmt->close();
        
        if (ob_get_length()) ob_clean();
        echo json_encode(["success" => true]);
    } catch (Throwable $e) {
        fail_json(500, $e->getMessage());
    }
}
