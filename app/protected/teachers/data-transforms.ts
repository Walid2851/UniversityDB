import { AssignedTeacherFromDB, BatchCourseScheduleFromDB, BatchCourseFromDB } from './types';

export const transformSupabaseData = (data: any[]): AssignedTeacherFromDB[] => {
  // Handle empty or invalid data
  if (!data || !Array.isArray(data)) {
    console.error("Invalid data provided to transformSupabaseData");
    return [];
  }

  return data.map(item => {
    try {
      // Extract and transform the nested structure if it exists
      let transformedSchedule: BatchCourseScheduleFromDB | undefined = undefined;

      if (item.batch_course_schedules) {
        transformedSchedule = {
          id: item.batch_course_schedules.id,
          class_day: item.batch_course_schedules.class_day || '',
          start_time: item.batch_course_schedules.start_time || '',
          end_time: item.batch_course_schedules.end_time || '',
          batch_course_id: item.batch_course_schedules.batch_course_id
        };

        // Add batch_courses if it exists
        if (item.batch_course_schedules.batch_courses) {
          const batchCourses = item.batch_course_schedules.batch_courses;
          transformedSchedule.batch_courses = {
            id: batchCourses.id,
            batch_id: batchCourses.batch_id,
            CourseID: batchCourses.CourseID,
            academic_year: batchCourses.academic_year || '',
            start_date: batchCourses.start_date || '',
            end_date: batchCourses.end_date || '',
            academic_period_id: batchCourses.academic_period_id
          };
        }
      }

      // Return the properly structured data with safeguards
      return {
        id: item.id,
        assigned_date: item.assigned_date,
        batch_course_schedule_id: item.batch_course_schedule_id,
        remuneration: Number(item.remuneration || 0),
        tax: Number(item.tax || 0),
        payment: Number(item.payment || 0),
        status: item.status || 'pending',
        is_modified: Boolean(item.is_modified),
        modified_by: item.modified_by,
        modified_at: item.modified_at,
        created_at: item.created_at,
        updated_at: item.updated_at,
        batch_course_schedules: transformedSchedule
      };
    } catch (error) {
      console.error("Error transforming data item:", error);
      // Return a minimal valid object to prevent rendering failures
      return {
        id: item.id || 'unknown',
        assigned_date: item.assigned_date || new Date().toISOString(),
        batch_course_schedule_id: item.batch_course_schedule_id || 'unknown',
        remuneration: 0,
        tax: 0,
        payment: 0,
        status: 'pending',
        is_modified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
  });
};