'use client';
import React from 'react';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, useParams } from 'next/navigation';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarIcon, ClockIcon, BookOpenIcon, UsersIcon, BuildingIcon, GraduationCapIcon, DollarSignIcon, ArrowLeftIcon, MailIcon, PhoneIcon, Calendar, Clock, Edit, MoreHorizontal, User2 } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import Link from 'next/link';
import { transformSupabaseData } from '../data-transforms';
import {
  Teacher,
  AssignedTeacherFromDB,
  BatchCourseSchedule,
  Course,
  Batch,
  AcademicPeriod,
  TeacherStats,
  BatchDetailsMap,
  CourseDetailsMap,
  AcademicPeriodMap,
  ClassStatus,
  TeacherDetailsState,
  BadgeVariantType
} from '../types';

const TeacherDetailsPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const instructorId = params.instructorId as string;
  
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [teacherClasses, setTeacherClasses] = useState<AssignedTeacherFromDB[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [batchDetails, setBatchDetails] = useState<BatchDetailsMap>({});
  const [courseDetails, setCourseDetails] = useState<CourseDetailsMap>({});
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriodMap>({});
  const [selectedClassDetails, setSelectedClassDetails] = useState<AssignedTeacherFromDB | null>(null);
  const [isClassDetailOpen, setIsClassDetailOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [stats, setStats] = useState<TeacherStats>({
    totalCourses: 0,
    totalBatches: 0,
    totalStudents: 0,
    upcomingClasses: 0,
    totalEarnings: 0
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeacherData = async (): Promise<void> => {
      if (!instructorId) {
        setError("Invalid instructor ID");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const supabase = createClient();
        
        // Skip authentication check temporarily to see if that's the issue
        // If we need it, we can enable it later
        /*
        try {
          const { data: { user }, error: authError } = await supabase.auth.getUser();
          if (authError || !user) {
            console.error("Authentication error:", authError);
            router.push('/sign-in');
            return;
          }
        } catch (authError) {
          console.error("Authentication error:", authError);
          setError("Authentication failed");
          setLoading(false);
          return;
        }
        */
        
        // Fetch teacher details
        try {
          const { data: teacherData, error: teacherError } = await supabase
            .from('teacher')
            .select('*')
            .eq('InstructorID', instructorId)
            .single();
          
          if (teacherError) {
            console.error('Error fetching teacher:', teacherError);
            setError(`Error fetching teacher: ${teacherError.message}`);
            setLoading(false);
            return;
          }
          
          if (!teacherData) {
            console.error('No teacher data found');
            setError("Teacher not found");
            setLoading(false);
            return;
          }
          
          setTeacher(teacherData as Teacher);
        } catch (error) {
          console.error('Error fetching teacher:', error);
          setError("Failed to fetch teacher data");
          setLoading(false);
          return;
        }
        
        // Fetch assigned classes
        try {
          const { data: classesData, error: classesError } = await supabase
            .from('assigned_teachers')
            .select(`
              id,
              assigned_date,
              batch_course_schedule_id,
              teacher_id,
              remuneration,
              tax,
              payment,
              status,
              is_modified,
              modified_by,
              modified_at,
              created_at,
              updated_at,
              batch_course_schedules(
                id,
                class_day,
                start_time,
                end_time,
                batch_course_id,
                batch_courses(
                  id,
                  batch_id,
                  "CourseID",
                  academic_year,
                  start_date,
                  end_date,
                  academic_period_id
                )
              )
            `)
            .eq('teacher_id', instructorId)
            .order('assigned_date', { ascending: false });
          
          if (classesError) {
            console.error('Error fetching classes:', classesError);
            setTeacherClasses([]);
            setLoading(false);
            return;
          }
          
          if (!classesData || classesData.length === 0) {
            console.log('No classes found for this teacher');
            setTeacherClasses([]);
            setLoading(false);
            return;
          }
          
          // Transform the raw data to match our expected types
          const transformedData = transformSupabaseData(classesData);
          setTeacherClasses(transformedData);
          
          // Process the related data
          await processRelatedData(transformedData, supabase);
          
        } catch (error) {
          console.error('Error fetching classes:', error);
          setTeacherClasses([]);
          setLoading(false);
          return;
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };
    
    // Helper function to process related data
    const processRelatedData = async (transformedData: AssignedTeacherFromDB[], supabase: any) => {
      try {
        // Extract batch IDs, course IDs, and academic period IDs
        const batchIds: string[] = [];
        const courseIds: number[] = [];
        const academicPeriodIds: string[] = [];
        
        transformedData.forEach((c) => {
          if (!c.batch_course_schedules?.batch_courses) return;
          
          const batchId = c.batch_course_schedules.batch_courses.batch_id;
          const courseId = c.batch_course_schedules.batch_courses.CourseID;
          const academicPeriodId = c.batch_course_schedules.batch_courses.academic_period_id;
          
          if (batchId && !batchIds.includes(batchId)) {
            batchIds.push(batchId);
          }
          
          if (courseId && !courseIds.includes(courseId)) {
            courseIds.push(courseId);
          }
          
          if (academicPeriodId && !academicPeriodIds.includes(academicPeriodId)) {
            academicPeriodIds.push(academicPeriodId);
          }
        });
        
        // Fetch batch details
        let batchMap: BatchDetailsMap = {};
        if (batchIds.length > 0) {
          try {
            const { data: batchData, error: batchError } = await supabase
              .from('batch')
              .select('*')
              .in('id', batchIds);
            
            if (batchError) {
              console.error('Error fetching batches:', batchError);
            } else if (batchData) {
              batchData.forEach((batch: Batch) => {
                if (batch && batch.id) {
                  batchMap[batch.id] = batch;
                }
              });
              setBatchDetails(batchMap);
            }
          } catch (error) {
            console.error('Error processing batch data:', error);
          }
        }
        
        // Fetch course details
        let courseMap: CourseDetailsMap = {};
        if (courseIds.length > 0) {
          try {
            const { data: courseData, error: courseError } = await supabase
              .from('course')
              .select('*')
              .in('CourseID', courseIds);
            
            if (courseError) {
              console.error('Error fetching courses:', courseError);
            } else if (courseData) {
              courseData.forEach((course: Course) => {
                if (course && course.CourseID) {
                  courseMap[course.CourseID] = course;
                }
              });
              setCourseDetails(courseMap);
            }
          } catch (error) {
            console.error('Error processing course data:', error);
          }
        }
        
        // Fetch academic period details
        let periodMap: AcademicPeriodMap = {};
        if (academicPeriodIds.length > 0) {
          try {
            const { data: periodData, error: periodError } = await supabase
              .from('academic_period')
              .select('*')
              .in('id', academicPeriodIds);
            
            if (periodError) {
              console.error('Error fetching academic periods:', periodError);
            } else if (periodData) {
              periodData.forEach((period: AcademicPeriod) => {
                if (period && period.id) {
                  periodMap[period.id] = period;
                }
              });
              setAcademicPeriods(periodMap);
            }
          } catch (error) {
            console.error('Error processing academic period data:', error);
          }
        }
        
        // Calculate statistics safely
        calculateStats(transformedData, batchMap);
      } catch (error) {
        console.error('Error processing related data:', error);
      }
    };
    
    // Helper function to calculate stats
    const calculateStats = (transformedData: AssignedTeacherFromDB[], batchMap: BatchDetailsMap) => {
      try {
        const uniqueBatches = new Set<string>();
        let totalStudents = 0;
        let totalEarnings = 0;
        
        transformedData.forEach((classInfo) => {
          const batchId = classInfo.batch_course_schedules?.batch_courses?.batch_id;
          if (batchId) {
            uniqueBatches.add(batchId);
          }
          
          // Sum up earnings
          if (classInfo.payment) {
            totalEarnings += Number(classInfo.payment) || 0;
          }
        });
        
        // Count upcoming classes (assigned dates in the future with status 'scheduled')
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingClasses = transformedData.filter((c) => {
          try {
            if (!c.assigned_date) return false;
            const assignedDate = new Date(c.assigned_date);
            assignedDate.setHours(0, 0, 0, 0);
            return assignedDate >= today && c.status === 'scheduled';
          } catch (e) {
            console.error('Error with date comparison:', e);
            return false;
          }
        }).length;
        
        // Get student count from batches
        Array.from(uniqueBatches).forEach(batchId => {
          if (batchMap[batchId] && batchMap[batchId].number_of_students) {
            totalStudents += batchMap[batchId].number_of_students || 0;
          }
        });
        
        setStats({
          totalCourses: Object.keys(courseDetails).length,
          totalBatches: uniqueBatches.size,
          totalStudents,
          upcomingClasses,
          totalEarnings: Math.round(totalEarnings * 100) / 100
        });
      } catch (error) {
        console.error('Error calculating stats:', error);
      }
    };
    
    if (instructorId) {
      fetchTeacherData();
    }
  }, [instructorId, router]);

  const handleClassClick = (classInfo: AssignedTeacherFromDB): void => {
    setSelectedClassDetails(classInfo);
    setIsClassDetailOpen(true);
  };

  const getStatusBadge = (status: ClassStatus): React.ReactElement => {
    const statusProps: Record<ClassStatus, { className: string, label: string }> = {
      scheduled: { className: "bg-blue-100 text-blue-800", label: "Scheduled" },
      completed: { className: "bg-green-100 text-green-800", label: "Completed" },
      cancelled: { className: "bg-red-100 text-red-800", label: "Cancelled" },
      pending: { className: "bg-yellow-100 text-yellow-800", label: "Pending" }
    };
    
    const { className, label } = statusProps[status] || 
      { className: "bg-gray-100 text-gray-800", label: status as string };
      
    return <Badge className={className}>{label}</Badge>;
  };

  const formatDay = (day: string): string => {
    const days: Record<string, string> = {
      mon: "Monday",
      tue: "Tuesday",
      wed: "Wednesday",
      thu: "Thursday",
      fri: "Friday",
      sat: "Saturday",
      sun: "Sunday"
    };
    
    return days[day.toLowerCase()] || day;
  };

  const formatTime = (timeStr: string | undefined): string => {
    if (!timeStr) return "";
    
    try {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours, 10));
      date.setMinutes(parseInt(minutes, 10));
      
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch (e) {
      return timeStr;
    }
  };

  const getInitials = (firstName?: string, lastName?: string): string => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center space-x-4 mb-8">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        
        <Skeleton className="h-[500px] rounded-lg" />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <p className="text-lg">Teacher not found</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
            className="gap-2"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">{error}</p>
            <Button 
              className="mt-4" 
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }


  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => router.back()}
          className="gap-2"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Teacher List
        </Button>
      </div>
      
      {/* Teacher Header */}
      <div className="bg-card rounded-lg shadow-sm mb-8 overflow-hidden">
        <div className="p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24 text-2xl bg-primary text-primary-foreground">
              <AvatarFallback>{getInitials(teacher.FirstName, teacher.LastName)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                  <h1 className="text-3xl font-bold">
                    {teacher.FirstName} {teacher.LastName}
                  </h1>
                  <p className="text-muted-foreground text-lg">
                    {teacher.Designation || 'Instructor'}
                    {teacher.Department && ` • ${teacher.Department}`}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Edit className="h-4 w-4" />
                    Edit Profile
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => window.location.href = `mailto:${teacher.Email}`}>
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>View Schedule</DropdownMenuItem>
                      <DropdownMenuItem>Print Profile</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-red-600">
                        {teacher.IsActive ? 'Deactivate' : 'Activate'} Account
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MailIcon className="h-4 w-4" />
                  <span>{teacher.Email}</span>
                </div>
                
                {teacher.Phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <PhoneIcon className="h-4 w-4" />
                    <span>{teacher.Phone}</span>
                  </div>
                )}
                
                {teacher.JoinDate && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Joined on {new Date(teacher.JoinDate).toLocaleDateString()}</span>
                  </div>
                )}
                
                <div className="flex items-center">
                  <Badge variant={teacher.IsActive ? "default" : "destructive"}>
                    {teacher.IsActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-full">
                <BookOpenIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Courses</p>
                <h3 className="text-2xl font-bold">{stats.totalCourses}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-full">
                <UsersIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Batches</p>
                <h3 className="text-2xl font-bold">{stats.totalBatches}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-3 rounded-full">
                <User2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Students</p>
                <h3 className="text-2xl font-bold">{stats.totalStudents}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-3 rounded-full">
                <ClockIcon className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Upcoming Classes</p>
                <h3 className="text-2xl font-bold">{stats.upcomingClasses}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-3 rounded-full">
                <DollarSignIcon className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <h3 className="text-2xl font-bold">${stats.totalEarnings}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content Tabs */}
      <Tabs 
        defaultValue="overview" 
        onValueChange={setActiveTab}
        className="mb-8"
      >
        <TabsList className="mb-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="batches">Batches</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Teacher Information</CardTitle>
              <CardDescription>Basic information about the teacher</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-muted-foreground mb-2">Personal Information</h3>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Instructor ID</TableCell>
                        <TableCell>{teacher.InstructorID}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Full Name</TableCell>
                        <TableCell>{teacher.FirstName} {teacher.LastName}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Email</TableCell>
                        <TableCell>{teacher.Email}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Phone</TableCell>
                        <TableCell>{teacher.Phone || 'Not provided'}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                
                <div>
                  <h3 className="font-medium text-muted-foreground mb-2">Professional Details</h3>
                  <Table>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">Designation</TableCell>
                        <TableCell>{teacher.Designation || 'Not specified'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Department</TableCell>
                        <TableCell>{teacher.Department || 'Not specified'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Specialization</TableCell>
                        <TableCell>{teacher.Specialization || 'Not specified'}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">Join Date</TableCell>
                        <TableCell>
                          {teacher.JoinDate ? new Date(teacher.JoinDate).toLocaleDateString() : 'Not provided'}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Classes</CardTitle>
              <CardDescription>Recently assigned or completed classes</CardDescription>
            </CardHeader>
            <CardContent>
              {teacherClasses.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {teacherClasses.slice(0, 5).map(classInfo => {
                      const courseId = classInfo.batch_course_schedules?.batch_courses?.CourseID;
                      const batchId = classInfo.batch_course_schedules?.batch_courses?.batch_id;
                      const course = courseId ? courseDetails[courseId] : undefined;
                      const batch = batchId ? batchDetails[batchId] : undefined;
                      
                      return (
                        <TableRow key={classInfo.id}>
                          <TableCell>
                            {new Date(classInfo.assigned_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{course?.CourseTitle || 'Unknown Course'}</TableCell>
                          <TableCell>
                            {formatTime(classInfo.batch_course_schedules?.start_time)} - 
                            {formatTime(classInfo.batch_course_schedules?.end_time)}
                          </TableCell>
                          <TableCell>{batch?.batch_id || 'Unknown Batch'}</TableCell>
                          <TableCell>{getStatusBadge(classInfo.status as ClassStatus)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleClassClick(classInfo)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No recent classes found</p>
                </div>
              )}
              
              {teacherClasses.length > 5 && (
                <div className="flex justify-center mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setActiveTab("schedule")}
                  >
                    View All Classes
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Schedule Tab */}
        <TabsContent value="schedule">
          <Card>
            <CardHeader>
              <CardTitle>Teaching Schedule</CardTitle>
              <CardDescription>Complete schedule of all assigned classes</CardDescription>
            </CardHeader>
            <CardContent>
              {teacherClasses.length > 0 ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex gap-2">
                      <Badge variant="outline" className="flex gap-1 items-center">
                        <ClockIcon className="h-3 w-3" />
                        All Schedules
                      </Badge>
                    </div>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Day</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Batch</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teacherClasses.map(classInfo => {
                        const courseId = classInfo.batch_course_schedules?.batch_courses?.CourseID;
                        const batchId = classInfo.batch_course_schedules?.batch_courses?.batch_id;
                        const academicPeriodId = classInfo.batch_course_schedules?.batch_courses?.academic_period_id;
                        
                        const course = courseId ? courseDetails[courseId] : undefined;
                        const batch = batchId ? batchDetails[batchId] : undefined;
                        const academicPeriod = academicPeriodId ? academicPeriods[academicPeriodId] : undefined;
                        
                        return (
                          <TableRow key={classInfo.id}>
                            <TableCell>
                              {new Date(classInfo.assigned_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {formatDay(classInfo.batch_course_schedules?.class_day || '')}
                            </TableCell>
                            <TableCell>
                              {formatTime(classInfo.batch_course_schedules?.start_time)} - 
                              {formatTime(classInfo.batch_course_schedules?.end_time)}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{course?.CourseTitle || 'Unknown Course'}</div>
                              <div className="text-xs text-muted-foreground">{course?.CourseCode}</div>
                            </TableCell>
                            <TableCell>{batch?.batch_id || 'Unknown Batch'}</TableCell>
                            <TableCell>
                              {academicPeriod?.name || course?.SemesterNo || 'N/A'}
                            </TableCell>
                            <TableCell>{getStatusBadge(classInfo.status as ClassStatus)}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleClassClick(classInfo)}
                              >
                                Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No scheduled classes found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Courses Tab */}
        <TabsContent value="courses">
          <Card>
            <CardHeader>
              <CardTitle>Courses</CardTitle>
              <CardDescription>All courses taught by this teacher</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(courseDetails).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.values(courseDetails).map(course => (
                    <Card key={course.CourseID} className="overflow-hidden">
                      <CardHeader className="bg-primary/5 pb-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{course.CourseTitle}</CardTitle>
                            <CardDescription>{course.CourseCode}</CardDescription>
                          </div>
                          <Badge>{course.Credits} Credits</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <GraduationCapIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Semester {course.SemesterNo}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{course.CourseType || 'Regular Course'}</span>
                          </div>
                          
                          {course.Description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {course.Description}
                            </p>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">View Details</Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>{course.CourseTitle}</DialogTitle>
                              <DialogDescription>{course.CourseCode}</DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div>
                                <h3 className="font-medium mb-2">Course Details</h3>
                                <Table>
                                  <TableBody>
                                    <TableRow>
                                      <TableCell className="font-medium">Course Code</TableCell>
                                      <TableCell>{course.CourseCode}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">Credits</TableCell>
                                      <TableCell>{course.Credits}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">Semester</TableCell>
                                      <TableCell>{course.SemesterNo}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">Type</TableCell>
                                      <TableCell>{course.CourseType || 'Not specified'}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">Status</TableCell>
                                      <TableCell>
                                        <Badge variant={course.IsActive ? "default" : "destructive"}>
                                          {course.IsActive ? 'Active' : 'Inactive'}
                                        </Badge>
                                      </TableCell>
                                    </TableRow>
                                  </TableBody>
                                </Table>
                              </div>
                              
                              {course.Description && (
                                <div>
                                  <h3 className="font-medium mb-2">Description</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {course.Description}
                                  </p>
                                </div>
                              )}
                              
                              {course.Prerequisites && (
                                <div>
                                  <h3 className="font-medium mb-2">Prerequisites</h3>
                                  <p className="text-sm text-muted-foreground">
                                    {course.Prerequisites}
                                  </p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No courses found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Batches Tab */}
        <TabsContent value="batches">
          <Card>
            <CardHeader>
              <CardTitle>Batches</CardTitle>
              <CardDescription>All batches this teacher is assigned to</CardDescription>
            </CardHeader>
            <CardContent>
              {Object.keys(batchDetails).length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.values(batchDetails).map(batch => (
                    <Card key={batch.id}>
                      <CardHeader>
                        <CardTitle>{batch.batch_id}</CardTitle>
                        <CardDescription>{batch.intake_session}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <UsersIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{batch.number_of_students} Students</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <BuildingIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Program: {batch.program_code}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              Created: {new Date(batch.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/protected/batches/${batch.id}`}>
                            View Batch Details
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No batches found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment History</CardTitle>
              <CardDescription>Detailed record of all payments and remunerations</CardDescription>
            </CardHeader>
            <CardContent>
              {teacherClasses.length > 0 ? (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-xl font-bold">
                      Total Earnings: ${stats.totalEarnings}
                    </div>
                    <Button variant="outline" size="sm">
                      Export Payment Data
                    </Button>
                  </div>
                  
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Remuneration</TableHead>
                        <TableHead>Tax (20%)</TableHead>
                        <TableHead>Net Payment</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {teacherClasses.map(classInfo => {
                        const courseId = classInfo.batch_course_schedules?.batch_courses?.CourseID;
                        const course = courseId ? courseDetails[courseId] : undefined;
                        
                        return (
                          <TableRow key={classInfo.id}>
                            <TableCell>
                              {new Date(classInfo.assigned_date).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">
                                {course?.CourseTitle || 'Unknown Course'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {course?.CourseCode}
                              </div>
                            </TableCell>
                            <TableCell>${parseFloat(classInfo.remuneration.toString()).toFixed(2)}</TableCell>
                            <TableCell>${parseFloat(classInfo.tax.toString()).toFixed(2)}</TableCell>
                            <TableCell className="font-medium">
                              ${parseFloat(classInfo.payment.toString()).toFixed(2)}
                            </TableCell>
                            <TableCell>{getStatusBadge(classInfo.status as ClassStatus)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No payment records found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Class Details Dialog */}
      <Dialog open={isClassDetailOpen} onOpenChange={setIsClassDetailOpen}>
        <DialogContent className="max-w-3xl">
          {selectedClassDetails && (
            <>
              <DialogHeader>
                <DialogTitle>Class Details</DialogTitle>
                <DialogDescription>
                  Detailed information about the selected class
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-6 py-4">
                {(() => {
                  const courseId = selectedClassDetails.batch_course_schedules?.batch_courses?.CourseID;
                  const batchId = selectedClassDetails.batch_course_schedules?.batch_courses?.batch_id;
                  const academicPeriodId = selectedClassDetails.batch_course_schedules?.batch_courses?.academic_period_id;
                  
                  const course = courseId ? courseDetails[courseId] : undefined;
                  const batch = batchId ? batchDetails[batchId] : undefined;
                  const academicPeriod = academicPeriodId ? academicPeriods[academicPeriodId] : undefined;
                  
                  return (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-medium mb-2">Class Information</h3>
                          <Table>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">Assigned Date</TableCell>
                                <TableCell>
                                  {new Date(selectedClassDetails.assigned_date).toLocaleDateString()}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Day</TableCell>
                                <TableCell>
                                  {formatDay(selectedClassDetails.batch_course_schedules?.class_day || '')}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Time</TableCell>
                                <TableCell>
                                  {formatTime(selectedClassDetails.batch_course_schedules?.start_time)} - 
                                  {formatTime(selectedClassDetails.batch_course_schedules?.end_time)}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Status</TableCell>
                                <TableCell>{getStatusBadge(selectedClassDetails.status as ClassStatus)}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                        
                        <div>
                          <h3 className="font-medium mb-2">Course Details</h3>
                          <Table>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">Course</TableCell>
                                <TableCell>{course?.CourseTitle || 'Unknown'}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Course Code</TableCell>
                                <TableCell>{course?.CourseCode || 'N/A'}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Credits</TableCell>
                                <TableCell>{course?.Credits || 'N/A'}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Course Type</TableCell>
                                <TableCell>{course?.CourseType || 'N/A'}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="font-medium mb-2">Batch Information</h3>
                          <Table>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">Batch ID</TableCell>
                                <TableCell>{batch?.batch_id || 'Unknown'}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Intake Session</TableCell>
                                <TableCell>{batch?.intake_session || 'N/A'}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Program</TableCell>
                                <TableCell>{batch?.program_code || 'N/A'}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">No. of Students</TableCell>
                                <TableCell>{batch?.number_of_students || 'N/A'}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                        
                        <div>
                          <h3 className="font-medium mb-2">Academic Period</h3>
                          <Table>
                            <TableBody>
                              <TableRow>
                                <TableCell className="font-medium">Semester</TableCell>
                                <TableCell>{academicPeriod?.name || course?.SemesterNo || 'N/A'}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Academic Year</TableCell>
                                <TableCell>
                                  {selectedClassDetails.batch_course_schedules?.batch_courses?.academic_year || 'N/A'}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">Start Date</TableCell>
                                <TableCell>
                                  {selectedClassDetails.batch_course_schedules?.batch_courses?.start_date ? 
                                    new Date(selectedClassDetails.batch_course_schedules.batch_courses.start_date).toLocaleDateString() : 
                                    'N/A'}
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell className="font-medium">End Date</TableCell>
                                <TableCell>
                                  {selectedClassDetails.batch_course_schedules?.batch_courses?.end_date ? 
                                    new Date(selectedClassDetails.batch_course_schedules.batch_courses.end_date).toLocaleDateString() : 
                                    'N/A'}
                                </TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                      
                      <Accordion type="single" collapsible>
                        <AccordionItem value="payment">
                          <AccordionTrigger>Payment Information</AccordionTrigger>
                          <AccordionContent>
                            <Table>
                              <TableBody>
                                <TableRow>
                                  <TableCell className="font-medium">Remuneration</TableCell>
                                  <TableCell>${parseFloat(selectedClassDetails.remuneration.toString()).toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">Tax (20%)</TableCell>
                                  <TableCell>${parseFloat(selectedClassDetails.tax.toString()).toFixed(2)}</TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell className="font-medium">Net Payment</TableCell>
                                  <TableCell className="font-medium">
                                    ${parseFloat(selectedClassDetails.payment.toString()).toFixed(2)}
                                  </TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </>
                  );
                })()}
              </div>
              
              <div className="flex justify-between">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="text-red-500">
                      Cancel Class
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will cancel the assigned class. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction className="bg-red-500 hover:bg-red-600">
                        Confirm
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                
                <Button onClick={() => setIsClassDetailOpen(false)}>Close</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherDetailsPage;