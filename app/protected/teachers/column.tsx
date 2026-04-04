'use client';
import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';

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


export const columns: ColumnDef<TeacherListItem>[] = [
  {
    accessorKey: 'InstructorID',
    header: 'Instructor ID',
  },
  {
    accessorKey: 'FirstName',
    header: 'First Name',
  },
  {
    accessorKey: 'LastName',
    header: 'Last Name',
  },
  {
    accessorKey: 'Email',
    header: 'Email',
  },
  {
    accessorKey: 'Department',
    header: 'Department',
  },
  {
    id: 'view_details',
    header: 'Details',
    cell: ({ row }) => {
      const teacher = row.original;
      return (
        <Link
          href={`/protected/teachers/${teacher.InstructorID}`}
          className="flex items-center text-blue-500 hover:text-blue-700"
        >
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            View Details
            <ExternalLink className="h-4 w-4" />
          </Button>
        </Link>
      );
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const teacher = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(teacher.InstructorID)}
            >
              Copy ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/protected/teachers/${teacher.InstructorID}/edit`}>
                Edit Teacher
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              Deactivate
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];