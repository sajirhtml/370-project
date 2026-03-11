# SCMS - Student Course Management System

## Overview

The Smart Course Management System (SCMS) is a comprehensive academic planning platform designed to streamline course selection, time management, and academic tracking for students. By combining intelligent prerequisite checking, schedule optimization, and progress monitoring, SCMS empowers students to make informed decisions about their academic journey.

## Key Features

### 1. Intelligent Course Prerequisite Planner

Students input their current semester and completed courses. The backend validates prerequisite data and generates a curated list of eligible courses for the upcoming semester. This core feature ensures students pursue courses they are academically qualified to take.

### 2. Conflict-Free Routine Generator

When students select specific sections for their upcoming courses, the system cross-references class timings. Any detected time overlaps trigger an immediate notification, preventing scheduling conflicts and ensuring students can attend all selected courses without conflicts.

### 3. Dynamic CGPA & Target Grade Predictor

A sophisticated calculator that tracks historical academic performance. Students can set a target CGPA, and the system computes the exact grades required in current courses to achieve that goal. This feature provides clarity on academic objectives and necessary effort.

### 4. Dynamic Course Planner

An interactive interface enabling students to select courses for the upcoming semester. The system calculates total credit hours and enforces credit-load limitations, preventing registration overload and maintaining academic sustainability.

### 5. Academic Task Tracker

A Kanban-style task management board where students organize assignments and exams. The backend automatically links tasks to enrolled courses and sorts them by due date, keeping students focused on immediate priorities.

### 6. Vacant Lab & Room Finder

Students can search for unoccupied study spaces. The system queries the schedule database against the current time or a specified time block, delivering real-time availability of rooms suitable for group study or independent work.

### 7. Course Resource Hub

A centralized repository for student-shared academic resources including notes, video tutorials, and study guides organized by course. The upvote/downvote mechanism ensures highly-rated resources appear at the top, facilitating peer-driven learning.

### 8. Faculty Consultation Booking

A directory displaying faculty office hours with a robust booking system. The backend handles concurrent requests, allowing students to reserve 15-minute consultation slots while ensuring no double-booking conflicts occur.