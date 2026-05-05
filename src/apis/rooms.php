<?php
require_once __DIR__ . '/config.php';
$res = $conn->query("SELECT Room_id AS room_id, Room_No AS room_no, Type AS type, Building AS building, `time` FROM room");
$rows = [];
while ($r = $res->fetch_assoc()) $rows[] = $r;
echo json_encode($rows);
