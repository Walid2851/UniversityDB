'use client';

import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Filter, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { EnhancedBatchCalendar } from './enhanced-batch-calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import {GraduationCap } from 'lucide-react';


type ScheduleItem = {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  courseName: string;
  courseCode: string;
  teacherName?: string;
  status?: 'scheduled' | 'completed' | 'cancelled';
  batch_course_schedule_id?: string;
};

type Course = {
  id: string;
  courseCode: string;
  courseName: string;
};

type Teacher = {
  id: string;
  name: string;
};

interface BatchCalendarViewProps {
  batchId: string;
  academicPeriodId?: string;
  initialSchedule?: ScheduleItem[];
}

export const BatchCalendarView = ({
  batchId,
  academicPeriodId,
  initialSchedule
}: BatchCalendarViewProps) => {
  const [schedule, setSchedule] = useState<ScheduleItem[]>(initialSchedule || []);
  const [filteredSchedule, setFilteredSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState<boolean>(!initialSchedule);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'week' | 'list'>('week');
  
  // Filter states
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>('all-courses');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all-teachers');
  const [selectedDay, setSelectedDay] = useState<string>('all-days');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterExpanded, setFilterExpanded] = useState<boolean>(false);
  
  // Statistics
  const [stats, setStats] = useState({
    totalClasses: 0,
    scheduledClasses: 0,
    completedClasses: 0,
    cancelledClasses: 0,
    unassignedClasses: 0
  });
  
  // Trigger a refresh
  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Fetch schedule data
  useEffect(() => {
    const fetchScheduleData = async () => {
      if (initialSchedule && refreshTrigger === 0) {
        // Use initial data on first render if provided
        setSchedule(initialSchedule);
        applyFilters(initialSchedule);
        return;
      }
      
      setLoading(true);
      try {
        const supabase = createClient();
        
        // This would be your actual data fetching logic
        // Fetch courses with their schedules
        const { data: batchCoursesData, error: batchCoursesError } = await supabase
          .from('batch_courses')
          .select('*, course:course("CourseID", "CourseCode", "CourseTitle")')
          .eq('batch_id', batchId)
          .eq(academicPeriodId ? 'academic_period_id' : 'batch_id', academicPeriodId || batchId);
        
        if (batchCoursesError) {
          console.error('Error fetching batch courses:', batchCoursesError);
          return;
        }
        
        // Extract unique courses for filtering
        const uniqueCourses = (batchCoursesData || []).map(bc => ({
          id: bc.course.CourseID.toString(),
          courseCode: bc.course.CourseCode,
          courseName: bc.course.CourseTitle
        }));
        
        setCourses(uniqueCourses);
        
        // Now fetch all schedules
        let allSchedules: ScheduleItem[] = [];
        
        // Fetch schedules for each batch course
        const schedulesPromises = (batchCoursesData || []).map(async (batchCourse) => {
          const { data: scheduleData, error: scheduleError } = await supabase
            .from('batch_course_schedules')
            .select('*')
            .eq('batch_course_id', batchCourse.id);
          
          if (scheduleError) {
            console.error('Error fetching schedule for course:', scheduleError);
            return [];
          }
          
          // Format the schedule data
          return (scheduleData || []).map(item => ({
            id: item.id,
            day: item.class_day,
            startTime: item.start_time,
            endTime: item.end_time,
            courseName: batchCourse.course.CourseTitle,
            courseCode: batchCourse.course.CourseCode,
            batch_course_schedule_id: item.id
          }));
        });
        
        const schedulesResults = await Promise.all(schedulesPromises);
        allSchedules = schedulesResults.flat();
        
        // Fetch teacher assignments
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('assigned_teachers')
          .select(`
            *,
            teacher:teacher(id, FirstName, LastName),
            batch_course_schedule:batch_course_schedules(
              id,
              class_day,
              start_time,
              end_time
            )
          `)
          .order('assigned_date', { ascending: true });
        
        if (assignmentsError) {
          console.error('Error fetching teacher assignments:', assignmentsError);
        } else {
          // Extract unique teachers for filtering
          const uniqueTeachers = Array.from(
            new Set(
              (assignmentsData || [])
                .map(a => a.teacher_id)
                .filter(Boolean)
            )
          ).map(teacherId => {
            const teacher = (assignmentsData || []).find(a => a.teacher_id === teacherId)?.teacher;
            return {
              id: teacherId,
              name: teacher ? `${teacher.FirstName} ${teacher.LastName}` : 'Unknown'
            };
          });
          
          setTeachers(uniqueTeachers);
          
          // Get today's date in YYYY-MM-DD format
          const today = new Date().toISOString().split('T')[0];
          
          // Update schedules with teacher assignment data
          allSchedules = allSchedules.map(schedule => {
            const todayAssignment = (assignmentsData || []).find(
              a => a.batch_course_schedule_id === schedule.batch_course_schedule_id && 
                   a.assigned_date === today
            );
            
            if (todayAssignment) {
              return {
                ...schedule,
                teacherName: todayAssignment.teacher 
                  ? `${todayAssignment.teacher.FirstName} ${todayAssignment.teacher.LastName}`
                  : undefined,
                status: todayAssignment.status
              };
            }
            
            return schedule;
          });
        }
        
        setSchedule(allSchedules);
        applyFilters(allSchedules);
      } catch (error) {
        console.error('Error fetching schedule data:', error);
        toast.error('Failed to load schedule data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchScheduleData();
  }, [batchId, academicPeriodId, refreshTrigger]);
  
  // Apply filters to schedule
  const applyFilters = (scheduleData: ScheduleItem[]) => {
    let filtered = [...scheduleData];
    
    // Apply course filter
    if (selectedCourse && selectedCourse !== 'all-courses') {
      filtered = filtered.filter(item => item.courseCode === selectedCourse);
    }
    
    // Apply teacher filter
    if (selectedTeacher && selectedTeacher !== 'all-teachers') {
      filtered = filtered.filter(item => {
        if (selectedTeacher === 'unassigned') {
          return !item.teacherName;
        }
        return item.teacherName && item.teacherName.includes(selectedTeacher);
      });
    }
    
    // Apply day filter
    if (selectedDay && selectedDay !== 'all-days') {
      filtered = filtered.filter(item => item.day === selectedDay);
    }
    
    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.courseName.toLowerCase().includes(query) ||
        item.courseCode.toLowerCase().includes(query) ||
        (item.teacherName && item.teacherName.toLowerCase().includes(query))
      );
    }
    
    setFilteredSchedule(filtered);
    
    // Update statistics
    const totalClasses = filtered.length;
    const scheduledClasses = filtered.filter(item => !item.status || item.status === 'scheduled').length;
    const completedClasses = filtered.filter(item => item.status === 'completed').length;
    const cancelledClasses = filtered.filter(item => item.status === 'cancelled').length;
    const unassignedClasses = filtered.filter(item => !item.teacherName).length;
    
    setStats({
      totalClasses,
      scheduledClasses,
      completedClasses,
      cancelledClasses,
      unassignedClasses
    });
  };
  
  // Handle filter changes
  useEffect(() => {
    applyFilters(schedule);
  }, [selectedCourse, selectedTeacher, selectedDay, searchQuery]);
  
  // Handle class update
  const handleClassUpdate = (updatedClass: ScheduleItem) => {
    const updatedSchedule = schedule.map(item => 
      item.id === updatedClass.id ? updatedClass : item
    );
    
    setSchedule(updatedSchedule);
    applyFilters(updatedSchedule);
    toast.success('Class updated successfully');
  };
  
  // Reset filters
  const resetFilters = () => {
    setSelectedCourse('all-courses');
    setSelectedTeacher('all-teachers');
    setSelectedDay('all-days');
    setSearchQuery('');
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Batch Schedule
            </CardTitle>
            <CardDescription>
              Weekly schedule of all courses for this batch
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setFilterExpanded(!filterExpanded)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshData}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'week' | 'list')}>
              <TabsList className="h-9">
                <TabsTrigger value="week" className="text-xs px-3">Week View</TabsTrigger>
                <TabsTrigger value="list" className="text-xs px-3">List View</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </CardHeader>
      
      {filterExpanded && (
        <div className="px-6 pb-2">
          <div className="p-4 bg-gray-50 rounded-lg mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search" className="text-xs">Search</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    id="search"
                    placeholder="Search courses or teachers"
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="course-filter" className="text-xs">Course</Label>
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger id="course-filter">
                    <SelectValue placeholder="All Courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-courses">All Courses</SelectItem>
                    {courses.map(course => (
                      <SelectItem key={course.id} value={course.courseCode}>
                        {course.courseCode} - {course.courseName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="teacher-filter" className="text-xs">Teacher</Label>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger id="teacher-filter">
                    <SelectValue placeholder="All Teachers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-teachers">All Teachers</SelectItem>
                    <SelectItem value="unassigned">Unassigned Classes</SelectItem>
                    {teachers.map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="day-filter" className="text-xs">Day</Label>
                <Select value={selectedDay} onValueChange={setSelectedDay}>
                  <SelectTrigger id="day-filter">
                    <SelectValue placeholder="All Days" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all-days">All Days</SelectItem>
                    <SelectItem value="Monday">Monday</SelectItem>
                    <SelectItem value="Tuesday">Tuesday</SelectItem>
                    <SelectItem value="Wednesday">Wednesday</SelectItem>
                    <SelectItem value="Thursday">Thursday</SelectItem>
                    <SelectItem value="Friday">Friday</SelectItem>
                    <SelectItem value="Saturday">Saturday</SelectItem>
                    <SelectItem value="Sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4">
              <div className="flex gap-2">
                <Badge variant="outline" className="bg-gray-100">
                  Total: {stats.totalClasses}
                </Badge>
                <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                  Scheduled: {stats.scheduledClasses}
                </Badge>
                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                  Completed: {stats.completedClasses}
                </Badge>
                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-300">
                  Cancelled: {stats.cancelledClasses}
                </Badge>
                <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                  Unassigned: {stats.unassignedClasses}
                </Badge>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={resetFilters}
              >
                Reset Filters
              </Button>
            </div>
          </div>
          <Separator />
        </div>
      )}
      
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <Tabs value={viewMode} className="w-full">
            <TabsContent value="week" className="mt-0">
              <EnhancedBatchCalendar 
                schedule={filteredSchedule} 
                onClassUpdate={handleClassUpdate}
              />
            </TabsContent>
            
            <TabsContent value="list" className="mt-0">
              <div className="space-y-4">
                {filteredSchedule.length > 0 ? (
                  <div>
                    {/* Group by day */}
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                      const dayClasses = filteredSchedule.filter(item => item.day === day);
                      
                      if (dayClasses.length === 0) return null;
                      
                      return (
                        <div key={day} className="mb-6">
                          <h3 className="font-semibold text-lg mb-2">{day}</h3>
                          <div className="space-y-2">
                            {/* Sort by start time */}
                            {dayClasses
                              .sort((a, b) => {
                                return a.startTime.localeCompare(b.startTime);
                              })
                              .map((cls, index) => (
                                <div 
                                  key={index} 
                                  className={`flex justify-between items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer transition-all ${
                                    cls.status === 'completed' 
                                      ? "border-green-300" 
                                      : cls.status === 'cancelled' 
                                        ? "border-red-300"
                                        : "border-blue-300"
                                  }`}
                                  onClick={() => handleClassUpdate(cls)}
                                >
                                  <div>
                                    <div className="font-medium">{cls.courseName}</div>
                                    <div className="text-sm text-gray-500">{cls.courseCode}</div>
                                    <div className="text-xs mt-1">{cls.startTime} - {cls.endTime}</div>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    {cls.teacherName ? (
                                      <div className="flex items-center text-sm text-blue-600">
                                        <GraduationCap className="h-4 w-4 mr-1" />
                                        {cls.teacherName}
                                      </div>
                                    ) : (
                                      <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                                        Unassigned
                                      </Badge>
                                    )}
                                    
                                    {cls.status && (
                                      <Badge 
                                        variant="outline" 
                                        className={
                                          cls.status === 'completed' 
                                            ? "bg-green-100 text-green-800 border-green-300 mt-1" 
                                            : cls.status === 'cancelled' 
                                              ? "bg-red-100 text-red-800 border-red-300 mt-1"
                                              : "bg-blue-100 text-blue-800 border-blue-300 mt-1"
                                        }
                                      >
                                        {cls.status}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 text-gray-500">
                    No classes match your current filters
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

