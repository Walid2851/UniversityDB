'use client';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { DataTable } from './data-table';
import { columns } from './column';
import CreateTeacherForm from './create_teacher';
import ScrollButton from '@/components/ScrollButton';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, UserPlus, Download, RefreshCcw, Users, Building, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  CreatedAt?: string;
}

// This ensures case consistency in property names
export interface TeacherListItem {
  InstructorID: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone?: string;
  Department?: string;
  Designation?: string;
  IsActive: boolean;
}

const TeacherManagementPage = () => {
  const [teacherList, setTeacherList] = useState<TeacherListItem[] | null>(null);
  const [filteredTeachers, setFilteredTeachers] = useState<TeacherListItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false);
  const [teacherStats, setTeacherStats] = useState({
    total: 0,
    active: 0,
    departments: 0
  });
  const contentRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  
  // Function to fetch teacher data
  const fetchTeachers = async () => {
    const supabase = createClient();
    
    try {
      const { data, error } = await supabase
        .from('teacher')
        .select('*')
        .order('JoinDate', { ascending: false });
        
      if (error) {
        console.error('Error fetching teachers:', error);
        setTeacherList(null);
        setFilteredTeachers(null);
      } else {
        // Transform data to match our expected type
        const transformedData = data.map(teacher => ({
          InstructorID: teacher.InstructorID,
          FirstName: teacher.FirstName,
          LastName: teacher.LastName,
          Email: teacher.Email,
          Phone: teacher.Phone,
          Department: teacher.Department,
          Designation: teacher.Designation,
          IsActive: teacher.IsActive
        }));
        
        setTeacherList(transformedData);
        setFilteredTeachers(transformedData);
        
        // Calculate stats
        const activeTeachers = data.filter(t => t.IsActive).length;
        const uniqueDepartments = new Set(data.map(t => t.Department).filter(Boolean)).size;
        
        setTeacherStats({
          total: data.length,
          active: activeTeachers,
          departments: uniqueDepartments
        });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setTeacherList(null);
      setFilteredTeachers(null);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    const supabase = createClient();
    
    // Initial fetch
    fetchTeachers();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('teacher-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teacher'
        },
        () => {
          fetchTeachers();
        }
      )
      .subscribe();
      
    // Cleanup subscription on unmount
    return () => {
      channel.unsubscribe();
    };
  }, [router]);
  
  // Handle search
  useEffect(() => {
    if (!teacherList) return;
    
    if (searchQuery.trim() === '') {
      setFilteredTeachers(teacherList);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = teacherList.filter(teacher => 
        teacher.FirstName.toLowerCase().includes(query) ||
        teacher.LastName.toLowerCase().includes(query) ||
        teacher.Email.toLowerCase().includes(query) ||
        teacher.InstructorID.toLowerCase().includes(query) ||
        (teacher.Department && teacher.Department.toLowerCase().includes(query))
      );
      setFilteredTeachers(filtered);
    }
  }, [searchQuery, teacherList]);

  const handleRefresh = () => {
    setLoading(true);
    fetchTeachers();
  };
  
  const handleAddTeacherClose = () => {
    setIsAddTeacherOpen(false);
  };
  
  if (loading) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        
        <div className="bg-card rounded-lg shadow-sm overflow-hidden mb-8">
          <div className="p-4 border-b">
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="p-6">
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }
  
  if (!filteredTeachers) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="rounded-full bg-blue-100 p-3">
          <UserPlus className="h-6 w-6 text-blue-600" />
        </div>
        <p className="text-lg font-medium">No Teachers Found</p>
        <p className="text-muted-foreground text-center max-w-md">
          There are no teachers in the system. Add your first teacher to get started.
        </p>
        <Button onClick={() => setIsAddTeacherOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add New Teacher
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" ref={contentRef} id="teacher-management">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teacher Management</h1>
          <p className="text-muted-foreground">Manage your instructors and teaching staff</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            className="flex-shrink-0"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="flex-shrink-0"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          
          <Button 
            onClick={() => setIsAddTeacherOpen(true)}
            size="sm"
            className="flex-shrink-0"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add Teacher
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-card to-card/80 border shadow-sm hover:shadow transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Teachers</p>
                <h3 className="text-3xl font-bold">{teacherStats.total}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-card to-card/80 border shadow-sm hover:shadow transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-100 p-3 rounded-full">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Active Teachers</p>
                <h3 className="text-3xl font-bold">{teacherStats.active}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-card to-card/80 border shadow-sm hover:shadow transition-all duration-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Departments</p>
                <h3 className="text-3xl font-bold">{teacherStats.departments}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main content */}
      <Tabs defaultValue="all-teachers" className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <TabsList>
            <TabsTrigger value="all-teachers">All Teachers</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
          
          <div className="relative w-full sm:w-auto sm:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search teachers..."
              className="pl-8 pr-4 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <TabsContent value="all-teachers" className="space-y-4">
          <Card className="overflow-hidden border shadow-sm">
            <CardContent className="p-0">
              <DataTable 
                columns={columns} 
                data={filteredTeachers} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="active" className="space-y-4">
          <Card className="overflow-hidden border shadow-sm">
            <CardContent className="p-0">
              <DataTable 
                columns={columns} 
                data={filteredTeachers.filter(teacher => teacher.IsActive)} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="inactive" className="space-y-4">
          <Card className="overflow-hidden border shadow-sm">
            <CardContent className="p-0">
              <DataTable 
                columns={columns} 
                data={filteredTeachers.filter(teacher => !teacher.IsActive)} 
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add Teacher Dialog - improved styling */}
      <Dialog 
        open={isAddTeacherOpen} 
        onOpenChange={(open) => {
          setIsAddTeacherOpen(open);
          if (!open) {
            // Refresh data when dialog closes
            fetchTeachers();
          }
        }}
      >
        <DialogContent 
          className="sm:max-w-3xl p-0 overflow-hidden"
          onInteractOutside={(e) => {
            // Prevent closing when clicking inside child components
            e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            // Allow escape key to close the dialog
            handleAddTeacherClose();
          }}
        >
          <DialogHeader className="p-6 border-b bg-card sticky top-0 z-10">
            <div className="flex justify-between items-start">
              <div>
                <DialogTitle className="text-xl font-semibold">Add New Teacher</DialogTitle>
                <DialogDescription className="mt-1.5">
                  Enter the details to add a new teacher to the system
                </DialogDescription>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full" 
                onClick={handleAddTeacherClose}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </div>
          </DialogHeader>
          
          <ScrollArea className="max-h-[60vh] overflow-auto">
            <div className="p-6">
              <CreateTeacherForm />
            </div>
          </ScrollArea>
          
          <DialogFooter className="p-6 border-t bg-card sticky bottom-0 z-10">
            <Button variant="outline" onClick={handleAddTeacherClose}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Scroll to top button */}
      <ScrollButton value="Top" scrollElementId="teacher-management" />
    </div>
  );
};

export default TeacherManagementPage;