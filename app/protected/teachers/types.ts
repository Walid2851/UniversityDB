// types.ts - Type definitions for Teacher Details Page

// Teacher basic information
export interface Teacher {
  InstructorID: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone?: string;
  Designation?: string;
  Department?: string;
  Specialization?: string;
  JoinDate?: string;
  IsActive: boolean;
  CreatedAt: string;
}

// Course information
export interface Course {
  CourseID: number;
  CourseCode: string;
  CourseTitle: string;
  Credits: number;
  SemesterNo: number;
  CourseType?: string;
  IsActive: boolean;
  Description?: string;
  Prerequisites?: string;
  CreatedAt: string;
}

// Batch information
export interface Batch {
  id: string;
  batch_id: string;
  intake_session: string;
  number_of_students: number;
  program_code: string;
  created_at: string;
  updated_at: string;
}

// Academic Period information
export interface AcademicPeriod {
  id: string;
  batch_id: string;
  semester_number: number;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Batch Course information (relationship between batch and course)
export interface BatchCourse {
  id: string;
  batch_id: string;
  CourseID: number;
  academic_year: string;
  start_date: string;
  end_date: string;
  created_at: string;
  updated_at: string;
  academic_period_id: string;
}

// Batch Course Schedule information
export interface BatchCourseSchedule {
  id: string;
  batch_course_id: string;
  class_day: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
  batch_courses?: BatchCourse;
}

// Class status type
export type ClassStatus = 'scheduled' | 'completed' | 'cancelled' | 'pending';

// Define the actual shape of the nested batch_courses as returned by the API
export interface BatchCourseFromDB {
  id: string;
  batch_id: string;
  CourseID: number;
  academic_year: string;
  start_date: string;
  end_date: string;
  academic_period_id: string;
}

// Define the actual shape of the nested batch_course_schedules as returned by the API
export interface BatchCourseScheduleFromDB {
  id: string;
  class_day: string;
  start_time: string;
  end_time: string;
  batch_course_id: string;
  batch_courses?: BatchCourseFromDB;
}

// Assigned Teachers/Classes information as returned from Supabase
export interface AssignedTeacherFromDB {
  id: string;
  assigned_date: string;
  batch_course_schedule_id: string;
  remuneration: number;
  tax: number;
  payment: number;
  status: ClassStatus;
  is_modified: boolean;
  modified_by?: string;
  modified_at?: string;
  created_at: string;
  updated_at: string;
  batch_course_schedules?: BatchCourseScheduleFromDB;
}

// Interface for the primary teacher detail operations
export interface AssignedTeacher extends Omit<AssignedTeacherFromDB, 'batch_course_schedules'> {
  teacher_id: string; // Required in our model but might not be returned directly in query
  batch_course_schedules?: BatchCourseSchedule;
}

// Statistics displayed in the overview cards
export interface TeacherStats {
  totalCourses: number;
  totalBatches: number;
  totalStudents: number;
  upcomingClasses: number;
  totalEarnings: number;
}

// Map types for related entity lookups
export interface BatchDetailsMap {
  [key: string]: Batch;
}

export interface CourseDetailsMap {
  [key: number]: Course;
}

export interface AcademicPeriodMap {
  [key: string]: AcademicPeriod;
}

// Component props for any child components
export interface ClassDetailsModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  classInfo: AssignedTeacherFromDB | null;
  courseDetails: CourseDetailsMap;
  batchDetails: BatchDetailsMap;
  academicPeriods: AcademicPeriodMap;
}

// Main component state
export interface TeacherDetailsState {
  teacher: Teacher | null;
  teacherClasses: AssignedTeacherFromDB[];
  loading: boolean;
  batchDetails: BatchDetailsMap;
  courseDetails: CourseDetailsMap;
  academicPeriods: AcademicPeriodMap;
  selectedClassDetails: AssignedTeacherFromDB | null;
  isClassDetailOpen: boolean;
  activeTab: string;
  stats: TeacherStats;
}

// Badge variant type
export type BadgeVariantType = "default" | "secondary" | "destructive" | "outline";