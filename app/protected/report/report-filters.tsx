'use client';
import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Filter, 
  RefreshCw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { 
  ReportFiltersProps,
  Batch,
  AcademicPeriod 
} from './types';

const ReportFilters: React.FC<ReportFiltersProps> = ({ 
  fiscalYear, 
  setFiscalYear, 
  selectedBatch, 
  setSelectedBatch, 
  selectedProgram, 
  setSelectedProgram, 
  selectedPeriod, 
  setSelectedPeriod, 
  batches, 
  programs, 
  academicPeriods,
  onRefresh 
}) => {
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<Batch[]>([]);
  const [filteredPeriods, setFilteredPeriods] = useState<AcademicPeriod[]>([]);
  
  // Generate fiscal years (current year, previous 5 years, next year)
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      years.push(i);
    }
    
    setAvailableYears(years);
  }, []);
  
  // Filter batches based on selected program
  useEffect(() => {
    if (selectedProgram === 'all') {
      setFilteredBatches(batches);
    } else {
      const filtered = batches.filter((batch: Batch) => batch.program_code === selectedProgram);
      setFilteredBatches(filtered);
      
      // If the currently selected batch is not in the filtered list, reset it
      if (selectedBatch !== 'all' && !filtered.some((b: Batch) => b.batch_id === selectedBatch)) {
        setSelectedBatch('all');
      }
    }
  }, [selectedProgram, batches, selectedBatch, setSelectedBatch]);
  
  // Filter academic periods based on selected batch
  useEffect(() => {
    if (selectedBatch === 'all') {
      setFilteredPeriods(academicPeriods);
    } else {
      const selectedBatchObj = batches.find((b: Batch) => b.batch_id === selectedBatch);
      if (selectedBatchObj) {
        const filtered = academicPeriods.filter((period: AcademicPeriod) => period.batch_id === selectedBatchObj.id);
        setFilteredPeriods(filtered);
        
        // If the currently selected period is not in the filtered list, reset it
        if (selectedPeriod !== 'all' && !filtered.some((p: AcademicPeriod) => p.name === selectedPeriod)) {
          setSelectedPeriod('all');
        }
      }
    }
  }, [selectedBatch, batches, academicPeriods, selectedPeriod, setSelectedPeriod]);
  
  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <Accordion type="single" collapsible defaultValue="filters">
          <AccordionItem value="filters">
            <AccordionTrigger className="text-lg font-medium">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filter Reports
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Fiscal Year</label>
                  <Select 
                    value={fiscalYear.toString()} 
                    onValueChange={(value) => setFiscalYear(parseInt(value))}
                  >
                    <SelectTrigger className="w-full">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <SelectValue placeholder="Select Year" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Program</label>
                  <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Programs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Programs</SelectItem>
                      {programs.map((program: string) => (
                        <SelectItem key={program} value={program}>
                          {program}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Batch</label>
                  <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Batches" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Batches</SelectItem>
                      {filteredBatches.map((batch: Batch) => (
                        <SelectItem key={batch.id} value={batch.batch_id}>
                          {batch.batch_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">Academic Period</label>
                  <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="All Periods" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Periods</SelectItem>
                      {filteredPeriods.map((period: AcademicPeriod) => (
                        <SelectItem key={period.id} value={period.name}>
                          {period.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <Button 
                  onClick={onRefresh} 
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Apply Filters
                </Button>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default ReportFilters;