<?php
require_once __DIR__ . '/config.php';

$sql = "SELECT slot_id, faculty_id, day, start_time, end_time, room_id FROM faculty_slot ORDER BY faculty_id, day, start_time";
$result = $conn->query($sql);
$rows = [];
while ($r = $result->fetch_assoc()) {
    $r['slot_id']    = (int)$r['slot_id'];
    $r['faculty_id'] = (int)$r['faculty_id'];
    $r['room_id']    = (int)$r['room_id'];
    $rows[] = $r;
}
echo json_encode($rows);
