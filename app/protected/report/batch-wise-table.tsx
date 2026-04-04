'use client';
import { useMemo, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronUp, Search, ArrowUpDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { 
  BatchWiseTableProps, 
  FinancialReportData,
  ExtendedStatusType,
  CollectionRateStatus,
  SortDirection
} from './types';
import { mapStatusToBadgeVariant } from './types';

const BatchWiseTable: React.FC<BatchWiseTableProps> = ({ data }) => {
  const [sortField, setSortField] = useState<keyof FinancialReportData>('batch_id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const itemsPerPage = 10;

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  // Calculate collection rate
  const getCollectionRate = (total: number, collected: number): number => {
    if (!total || total === 0) return 0;
    return collected / total;
  };

  // Handle sorting
  const handleSort = (field: keyof FinancialReportData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort data
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    // Filter by search term
    let filteredData = data;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredData = data.filter((item: FinancialReportData) => 
        (item.batch_id?.toLowerCase().includes(term) || false) ||
        (item.program_code?.toLowerCase().includes(term) || false) ||
        (item.academic_period?.toLowerCase().includes(term) || false)
      );
    }

    // Sort data
    const sortedData = [...filteredData].sort((a: FinancialReportData, b: FinancialReportData) => {
      const valA = a[sortField];
      const valB = b[sortField];
      
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDirection === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        return sortDirection === 'asc' 
          ? (valA as number || 0) - (valB as number || 0) 
          : (valB as number || 0) - (valA as number || 0);
      }
    });

    return sortedData;
  }, [data, searchTerm, sortField, sortDirection]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    return processedData.slice(startIndex, startIndex + itemsPerPage);
  }, [processedData, page, itemsPerPage]);

  const totalPages = Math.ceil(processedData.length / itemsPerPage);

  // Get collection rate status
  const getCollectionStatus = (rate: number): ExtendedStatusType => {
    if (rate >= 0.9) return 'success';
    if (rate >= 0.7) return 'warning';
    return 'destructive';
  };

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No financial data available for the selected filters.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="pl-8 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {processedData.length} records
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('batch_id')}
                  className="flex items-center gap-1 font-medium p-0 h-8"
                >
                  Batch ID
                  {sortField === 'batch_id' ? (
                    sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="h-4 w-4" />
                  )}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('program_code')}
                  className="flex items-center gap-1 font-medium p-0 h-8"
                >
                  Program
                  {sortField === 'program_code' ? (
                    sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="h-4 w-4" />
                  )}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('academic_period')}
                  className="flex items-center gap-1 font-medium p-0 h-8"
                >
                  Period
                  {sortField === 'academic_period' ? (
                    sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="h-4 w-4" />
                  )}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('total_income')}
                  className="flex items-center gap-1 font-medium p-0 h-8 ml-auto"
                >
                  Expected Income
                  {sortField === 'total_income' ? (
                    sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="h-4 w-4" />
                  )}
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button
                  variant="ghost"
                  onClick={() => handleSort('actual_collected')}
                  className="flex items-center gap-1 font-medium p-0 h-8 ml-auto"
                >
                  Collected
                  {sortField === 'actual_collected' ? (
                    sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ArrowUpDown className="h-4 w-4" />
                  )}
                </Button>
              </TableHead>
              <TableHead className="text-right">Collection Rate</TableHead>
              <TableHead className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-1 font-medium p-0 h-8 ml-auto">
                      Allocations <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleSort('program_running_expense')}>
                      Program Expenses
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('department_development')}>
                      Department Development
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('research_allocation')}>
                      Research Allocation
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('university_income')}>
                      University Income
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item: FinancialReportData, index: number) => {
              const collectionRate = getCollectionRate(item.total_income, item.actual_collected);
              const statusType = getCollectionStatus(collectionRate);
              const badgeVariant = mapStatusToBadgeVariant(statusType);
              
              return (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.batch_id}</TableCell>
                  <TableCell>{item.program_code}</TableCell>
                  <TableCell>{item.academic_period}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.total_income || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.actual_collected || 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge variant={badgeVariant}>
                      {formatPercentage(collectionRate)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <div className="p-2">
                          <h4 className="font-medium mb-2">Fund Allocation</h4>
                          <div className="space-y-1.5 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Program Expenses (55%):</span>
                              <span>{formatCurrency(item.program_running_expense || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Department Dev (5%):</span>
                              <span>{formatCurrency(item.department_development || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Research (5%):</span>
                              <span>{formatCurrency(item.research_allocation || 0)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">University (35%):</span>
                              <span>{formatCurrency(item.university_income || 0)}</span>
                            </div>
                          </div>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <Button 
            variant="outline" 
            size="sm"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button 
            variant="outline" 
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default BatchWiseTable;