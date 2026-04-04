# University Database Management System

A Next.js + Supabase application for managing university batches, students, teachers, courses, schedules, and fees.

---

## Database Schema (ERD)

```mermaid
erDiagram
    batch {
        uuid id PK
        text batch_id
        text intake_session
        text program_code
        int  number_of_students
        timestamptz created_at
        timestamptz updated_at
    }

    student {
        uuid studentid PK
        text rollno
        uuid batchid FK
        text firstname
        text lastname
        text email
        text phone
        text workexperience
        bool isactive
        timestamptz createdat
    }

    teacher {
        uuid InstructorID PK
        text FirstName
        text LastName
        text Email
        text Phone
        text Designation
        text Department
        text Specialization
        date JoinDate
        bool IsActive
        timestamptz CreatedAt
    }

    course {
        uuid CourseID PK
        text CourseCode
        text CourseTitle
        int  Credits
        int  SemesterNo
        text CourseType
        bool IsActive
        text Description
        text Prerequisites
        timestamptz CreatedAt
    }

    academic_period {
        uuid id PK
        uuid batch_id FK
        int  semester_number
        text name
        date start_date
        date end_date
        bool is_active
        timestamptz created_at
        timestamptz updated_at
    }

    batch_courses {
        uuid id PK
        uuid batch_id FK
        uuid CourseID FK
        uuid academic_period_id FK
        text academic_year
        date start_date
        date end_date
        timestamptz created_at
        timestamptz updated_at
    }

    batch_course_schedules {
        uuid id PK
        uuid batch_course_id FK
        text class_day
        time start_time
        time end_time
        timestamptz created_at
        timestamptz updated_at
    }

    assigned_teachers {
        uuid id PK
        uuid batch_course_schedule_id FK
        uuid teacher_id FK
        date assigned_date
        numeric remuneration
        numeric tax
        numeric payment
        text status
        bool is_modified
        text modified_by
        timestamptz modified_at
        timestamptz created_at
        timestamptz updated_at
    }

    fee_type {
        uuid id PK
        text name
        text description
        bool is_recurring
        text frequency
        bool is_active
        timestamptz created_at
        timestamptz updated_at
    }

    fee_component {
        uuid id PK
        uuid fee_type_id FK
        text name
        text description
        numeric amount
        bool is_optional
        bool is_active
    }

    student_fee {
        uuid id PK
        uuid student_id FK
        uuid fee_type_id FK
        uuid academic_period_id FK
        uuid batch_id FK
        text description
        numeric total_amount
        date due_date
        text status
    }

    payment {
        uuid id PK
        uuid student_fee_id FK
        numeric amount
        date payment_date
        text payment_method
        text transaction_reference
        text receipt_number
        text notes
        text created_by
    }

    batch           ||--o{ student              : "has"
    batch           ||--o{ academic_period       : "has"
    batch           ||--o{ batch_courses         : "has"
    batch           ||--o{ student_fee           : "has"
    course          ||--o{ batch_courses         : "assigned to"
    academic_period ||--o{ batch_courses         : "groups"
    academic_period ||--o{ student_fee           : "period for"
    batch_courses   ||--o{ batch_course_schedules: "scheduled as"
    batch_course_schedules ||--o{ assigned_teachers : "taught by"
    teacher         ||--o{ assigned_teachers     : "assigned to"
    fee_type        ||--o{ fee_component         : "composed of"
    fee_type        ||--o{ student_fee           : "applied as"
    student         ||--o{ student_fee           : "owes"
    student_fee     ||--o{ payment               : "paid via"
```

---

## Table Overview

| Table | Description |
|-------|-------------|
| `batch` | Program cohorts (e.g. BCS-2023-A) |
| `student` | Students enrolled in batches |
| `teacher` | Instructors/faculty |
| `course` | Course catalogue |
| `academic_period` | Semesters per batch |
| `batch_courses` | Courses assigned to a batch in a semester |
| `batch_course_schedules` | Weekly class schedule for a batch course |
| `assigned_teachers` | Teacher assigned to a schedule slot, with remuneration |
| `fee_type` | Fee categories (e.g. Semester Fee, Registration Fee) |
| `fee_component` | Line items that make up a fee type |
| `student_fee` | Fee assigned to a specific student |
| `payment` | Payment transactions against a student fee |

---

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database & Auth:** Supabase (PostgreSQL)
- **UI:** shadcn/ui + Tailwind CSS
