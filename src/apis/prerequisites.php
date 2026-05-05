<?php
require_once __DIR__ . '/config.php';
$res = $conn->query("SELECT Course_code AS course_code, Prerequisite_course_code AS prerequisite_course_code FROM prerequisite");
$rows = [];
while ($r = $res->fetch_assoc()) $rows[] = $r;
echo json_encode($rows);
