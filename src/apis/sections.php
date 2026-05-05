<?php
require_once __DIR__ . '/config.php';
$res = $conn->query("
  SELECT Course_Code AS course_code, `Section-num` AS section_num,
         Faculty_id AS faculty_id, Room_id AS room_id,
         `Day` AS day, Start_time AS start_time, End_time AS end_time
  FROM section
");
$rows = [];
while ($r = $res->fetch_assoc()) $rows[] = $r;
echo json_encode($rows);
