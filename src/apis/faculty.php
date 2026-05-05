<?php
require_once __DIR__ . '/config.php';
$res = $conn->query("
  SELECT f.User_id AS user_id, f.Faculty_id AS faculty_id,
         u.`E-mail` AS email, f.Designation AS designation,
         f.Is_active AS is_active, f.Consult_time AS consult_time,
         f.Consult_date AS consult_date, f.Assigned AS assigned,
         CONCAT(u.First_Name, ' ', u.Last_Name) AS name, u.Dept AS dept
  FROM faculty f
  JOIN user u ON u.User_id = f.User_id
");
$rows = [];
while ($r = $res->fetch_assoc()) $rows[] = $r;
echo json_encode($rows);
