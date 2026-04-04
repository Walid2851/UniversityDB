'use client';

import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, GraduationCap, Edit, X, AlertCircle, Clock, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

// Type definitions
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

type Teacher = {
  id: string;
  FirstName: string;
  LastName: string;
};

interface BatchCalendarProps {
  schedule: ScheduleItem[];
  onClassUpdate?: (updatedClass: ScheduleItem) => void;
}

export const EnhancedBatchCalendar = ({ schedule, onClassUpdate }: BatchCalendarProps) => {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const hours = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 7 PM
  
  const [selectedClass, setSelectedClass] = useState<ScheduleItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [classStatus, setClassStatus] = useState<'scheduled' | 'completed' | 'cancelled'>('scheduled');
  const [loadingTeachers, setLoadingTeachers] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Helper function to convert time to 12-hour format
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Function to get class background color based on status
  const getClassBackground = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300';
      case 'cancelled':
        return 'bg-red-100 border-red-300';
      default:
        return 'bg-blue-100 border-blue-300';
    }
  };

  // Handle opening class details modal
  const handleClassClick = async (classItem: ScheduleItem) => {
    setSelectedClass(classItem);
    setClassStatus(classItem.status || 'scheduled');
    
    // If the class has a teacher, set it
    if (classItem.teacherName) {
      setSelectedTeacher(classItem.teacherName);
    } else {
      setSelectedTeacher('');
    }
    
    setIsModalOpen(true);
    
    // Fetch available teachers
    setLoadingTeachers(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('teacher')
        .select('id, FirstName, LastName')
        .order('LastName', { ascending: true });
      
      if (error) {
        console.error('Error fetching teachers:', error);
        toast.error('Failed to load teachers');
      } else {
        setTeachers(data || []);
      }
    } catch (error) {
      console.error('Error in fetchTeachers:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoadingTeachers(false);
    }
  };

  // Open edit modal
  const handleEditClick = () => {
    setIsModalOpen(false);
    setIsEditModalOpen(true);
  };
  
  // Handle saving class updates
  const handleSaveChanges = async () => {
    if (!selectedClass) return;
    
    setIsSaving(true);
    try {
      // Example using Supabase (you would need to adjust this based on your actual data structure)
      const supabase = createClient();
      
      // If there's a batch_course_schedule_id, we can update the assigned teacher
      if (selectedClass.batch_course_schedule_id) {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        
        // Handle teacher assignment based on the selected value
        let teacherId = null;
        if (selectedTeacher && selectedTeacher !== 'unassigned') {
          teacherId = selectedTeacher;
        }
        
        // Check if there's already an assignment for this schedule and date
        const { data: existingAssignment, error: checkError } = await supabase
          .from('assigned_teachers')
          .select('id, remuneration')
          .eq('batch_course_schedule_id', selectedClass.batch_course_schedule_id)
          .eq('assigned_date', today)
          .maybeSingle();
          
        if (checkError) {
          console.error('Error checking existing assignment:', checkError);
          toast.error('Failed to update class');
          return;
        }
        
        if (existingAssignment) {
          // If selecting "unassigned" and there's an existing assignment, delete it
          if (!teacherId) {
            const { error: deleteError } = await supabase
              .from('assigned_teachers')
              .delete()
              .eq('id', existingAssignment.id);
              
            if (deleteError) {
              console.error('Error removing assignment:', deleteError);
              toast.error('Failed to remove teacher assignment');
              return;
            }
          } else {
            // Update existing assignment
            const { error: updateError } = await supabase
              .from('assigned_teachers')
              .update({
                teacher_id: teacherId,
                status: classStatus,
              })
              .eq('id', existingAssignment.id);
              
            if (updateError) {
              console.error('Error updating assignment:', updateError);
              toast.error('Failed to update class');
              return;
            }
          }
        } else if (teacherId) {
          // Only create a new assignment if a teacher is selected
          const { error: insertError } = await supabase
            .from('assigned_teachers')
            .insert({
              batch_course_schedule_id: selectedClass.batch_course_schedule_id,
              teacher_id: teacherId,
              assigned_date: today,
              status: classStatus,
              remuneration: 1000, // Default value, would be calculated based on your business logic
            });
            
          if (insertError) {
            console.error('Error creating assignment:', insertError);
            toast.error('Failed to create assignment');
            return;
          }
        }
        
        toast.success('Class updated successfully');
        
        // Update the local state with the new information
        const updatedClass = {
          ...selectedClass,
          status: classStatus,
          teacherName: teachers.find(t => t.id === selectedTeacher) 
            ? `${teachers.find(t => t.id === selectedTeacher)?.FirstName} ${teachers.find(t => t.id === selectedTeacher)?.LastName}`
            : undefined
        };
        
        // Call the onClassUpdate callback if provided
        if (onClassUpdate) {
          onClassUpdate(updatedClass);
        }
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
      setIsEditModalOpen(false);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-8 gap-1">
            {/* Header row with time column and day names */}
            <div className="h-12 flex items-center justify-center font-medium bg-gray-100 rounded-tl">
              <Clock className="h-4 w-4 mr-1 text-gray-500" />
              Time
            </div>
            {days.map(day => (
              <div 
                key={day} 
                className="h-12 flex items-center justify-center font-semibold bg-gray-100 rounded-tr last:rounded-tr"
              >
                {day}
              </div>
            ))}

            {/* Time slots */}
            {hours.map(hour => (
              <React.Fragment key={`hour-${hour}`}>
                {/* Time column */}
                <div 
                  className={`h-20 flex items-center justify-end pr-3 text-sm text-gray-500 font-medium ${
                    hour === hours[hours.length - 1] ? 'rounded-bl' : ''
                  }`}
                >
                  {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                </div>

                {/* Day cells for this hour */}
                {days.map(day => {
                  const classes = schedule.filter(s =>
                    s.day === day &&
                    parseInt(s.startTime.split(':')[0]) <= hour &&
                    parseInt(s.endTime.split(':')[0]) > hour
                  );

                  return (
                    <div 
                      key={`${day}-${hour}`} 
                      className={`h-20 border border-gray-200 hover:bg-gray-50 relative ${
                        hour === hours[hours.length - 1] && day === days[days.length - 1] ? 'rounded-br' : ''
                      }`}
                    >
                      {classes.map((cls, i) => (
                        <TooltipProvider key={i}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                onClick={() => handleClassClick(cls)}
                                className={`absolute inset-0 m-1 p-2 rounded text-xs overflow-hidden border cursor-pointer transition-all duration-150 hover:shadow-md ${getClassBackground(cls.status)}`}
                                style={{ zIndex: i + 1 }}
                              >
                                <div className="font-bold text-blue-800 mb-1">{cls.courseCode}</div>
                                <div className="text-xs">
                                  {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
                                </div>
                                {cls.teacherName && (
                                  <div className="flex items-center text-xs text-blue-700 font-medium mt-1">
                                    <GraduationCap className="h-3 w-3 mr-1" />
                                    {cls.teacherName}
                                  </div>
                                )}
                                {cls.status === 'cancelled' && (
                                  <div className="absolute top-1 right-1">
                                    <X className="h-3 w-3 text-red-600" />
                                  </div>
                                )}
                                {cls.status === 'completed' && (
                                  <div className="absolute top-1 right-1">
                                    <CheckCircle className="h-3 w-3 text-green-600" />
                                  </div>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="text-sm font-medium">{cls.courseName}</div>
                              <div className="text-xs">{cls.courseCode}</div>
                              <div className="text-xs">{formatTime(cls.startTime)} - {formatTime(cls.endTime)}</div>
                              {cls.teacherName && (
                                <div className="text-xs mt-1">Teacher: {cls.teacherName}</div>
                              )}
                              {cls.status && (
                                <div className="text-xs mt-1 capitalize">Status: {cls.status}</div>
                              )}
                              <div className="text-xs text-blue-600 mt-1">Click to manage</div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Class Details Modal */}
      {selectedClass && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Class Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{selectedClass.courseName}</h3>
                  <p className="text-sm text-gray-500">{selectedClass.courseCode}</p>
                </div>
                <Badge 
                  variant="outline" 
                  className={
                    selectedClass.status === 'completed' 
                      ? "bg-green-100 text-green-800 border-green-300" 
                      : selectedClass.status === 'cancelled' 
                        ? "bg-red-100 text-red-800 border-red-300"
                        : "bg-blue-100 text-blue-800 border-blue-300"
                  }
                >
                  {selectedClass.status || 'Scheduled'}
                </Badge>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Day</h4>
                  <p>{selectedClass.day}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Time</h4>
                  <p>{formatTime(selectedClass.startTime)} - {formatTime(selectedClass.endTime)}</p>
                </div>
              </div>
              
              {selectedClass.teacherName && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Teacher</h4>
                  <div className="flex items-center">
                    <GraduationCap className="h-4 w-4 mr-2 text-blue-600" />
                    <p>{selectedClass.teacherName}</p>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsModalOpen(false)}
              >
                Close
              </Button>
              <Button 
                onClick={handleEditClick}
                className="ml-2"
              >
                <Edit className="h-4 w-4 mr-2" />
                Update Class
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Class Modal */}
      {selectedClass && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Update Class</DialogTitle>
              <DialogDescription>
                Make changes to this class session. Click save when you're done.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="course-info">Course</Label>
                <Input 
                  id="course-info" 
                  value={`${selectedClass.courseCode} - ${selectedClass.courseName}`} 
                  disabled 
                />
              </div>
              
              <div>
                <Label htmlFor="class-time">Time</Label>
                <Input 
                  id="class-time" 
                  value={`${selectedClass.day}, ${formatTime(selectedClass.startTime)} - ${formatTime(selectedClass.endTime)}`} 
                  disabled 
                />
              </div>
              
              <div>
                <Label htmlFor="teacher">Assign Teacher</Label>
                <Select 
                  value={selectedTeacher} 
                  onValueChange={setSelectedTeacher}
                >
                  <SelectTrigger id="teacher">
                    <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">No teacher assigned</SelectItem>
                    {loadingTeachers ? (
                      <SelectItem value="loading-teachers" disabled>Loading teachers...</SelectItem>
                    ) : (
                      teachers.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.FirstName} {teacher.LastName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="status">Class Status</Label>
                <Select 
                  value={classStatus} 
                  onValueChange={(value) => setClassStatus(value as 'scheduled' | 'completed' | 'cancelled')}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Set class status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                {classStatus === 'cancelled' && (
                  <p className="text-xs text-red-500 mt-1 flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Students will be notified of cancellation
                  </p>
                )}
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsEditModalOpen(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSaveChanges}
                disabled={isSaving}
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

