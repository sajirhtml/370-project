<?php
require_once __DIR__ . '/config.php';
$res = $conn->query("SELECT course_code, title, description, credit_hours, capacity, semester FROM course");
$rows = [];
while ($r = $res->fetch_assoc()) $rows[] = $r;
echo json_encode($rows);
