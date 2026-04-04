'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { 
  Briefcase, 
  RefreshCw,
  Calendar,
  PieChart,
  DollarSign,
  BarChart4,
  Download
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Toaster } from "sonner";
import { toast } from "sonner";
import ReportFilters from './report-filters';
import FinancialSummary from './financial-summary';
import IncomeChart from './income-chart';
import AllocationChart from './allocation-chart';
import BatchWiseTable from './batch-wise-table';
import ReportDownload from './report-download';
import type {
  FinancialReportData,
  Batch,
  AcademicPeriod,
  FinancialReportsPageProps
} from './types';

const FinancialReportsPage: React.FC<FinancialReportsPageProps> = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [financialData, setFinancialData] = useState<FinancialReportData[]>([]);
  const [fiscalYear, setFiscalYear] = useState<number>(new Date().getFullYear());
  const [selectedBatch, setSelectedBatch] = useState<string>('all');
  const [selectedProgram, setSelectedProgram] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  const [batches, setBatches] = useState<Batch[]>([]);
  const [programs, setPrograms] = useState<string[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  const router = useRouter();

  // Helper function to safely log errors and show toast notifications
  const logError = (context: string, error: any) => {
    try {
      if (error instanceof Error) {
        console.error(`${context}:`, error.message);
        toast.error(`${context}`, {
          description: error.message,
          position: "top-right",
          duration: 5000
        });
      } else if (typeof error === 'object' && error !== null) {
        // For Supabase errors which might have a message or code property
        const errorMsg = error.message || error.code || JSON.stringify(error);
        console.error(`${context}:`, errorMsg);
        toast.error(`${context}`, {
          description: errorMsg,
          position: "top-right",
          duration: 5000
        });
      } else {
        console.error(`${context}:`, String(error));
        toast.error(`${context}`, {
          description: String(error),
          position: "top-right",
          duration: 5000
        });
      }
    } catch (e) {
      console.error(`Failed to log error for ${context}`, String(e));
      toast.error("An error occurred", {
        description: "Please try again later",
        position: "top-right"
      });
    }
  };

  useEffect(() => {

    // Fetch reference data (batches, programs, academic periods)
    const fetchReferenceData = async () => {
      try {
        const supabase = createClient();
        
        // Toast for starting the fetch
        const toastId = toast.loading("Loading reference data", {
          description: "Fetching batches and programs information",
          position: "top-right"
        });
        
        // Fetch batches
        const { data: batchData, error: batchError } = await supabase
          .from('batch')
          .select('id, batch_id, program_code');
        
        if (batchError) {
          throw batchError;
        }
        
        if (batchData) {
          setBatches(batchData as Batch[]);
          
          // Extract unique program codes
          const uniquePrograms = new Set<string>();
          batchData.forEach((batch: any) => {
            if (batch.program_code) {
              uniquePrograms.add(batch.program_code);
            }
          });
          const programsList = Array.from(uniquePrograms);
          setPrograms(programsList);
          
          // Fetch academic periods
          const { data: periodData, error: periodError } = await supabase
            .from('academic_period')
            .select('id, name, batch_id');
          
          if (periodError) {
            throw periodError;
          }
          
          if (periodData) {
            setAcademicPeriods(periodData as AcademicPeriod[]);
          }
          
          // Update toast to success - using uniquePrograms.size instead of programsSet
          toast.success("Reference data loaded", {
            id: toastId,
            description: `${batchData?.length || 0} batches and ${uniquePrograms.size} programs found`,
            position: "top-right",
            duration: 3000
          });
        }
      } catch (error) {
        logError("Failed to load reference data", error);
      }
    };
    // The main financial data fetch function
    const fetchFinancialData = async () => {
      setLoading(true);
      
      try {
        const toastId = toast.loading("Loading financial data", {
          description: "Fetching reports for the selected filters",
          position: "top-right"
        });
        
        const supabase = createClient();
        
        // Build the query based on filters
        let query = supabase.rpc('get_financial_report', {
          fiscal_year: fiscalYear
        });
        
        // Apply filters if not "all"
        if (selectedBatch !== 'all') {
          query = query.eq('batch_id', selectedBatch);
        }
        
        if (selectedProgram !== 'all') {
          query = query.eq('program_code', selectedProgram);
        }
        
        if (selectedPeriod !== 'all') {
          query = query.eq('academic_period', selectedPeriod);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        } else {
          setFinancialData(data as FinancialReportData[] || []);
          
          // Show success toast with data count
          toast.success("Financial data loaded", {
            id: toastId,
            description: `${data.length} records found${selectedBatch !== 'all' || selectedProgram !== 'all' || selectedPeriod !== 'all' ? ' for the selected filters' : ''}`,
            position: "top-right",
            duration: 3000
          });
        }
      } catch (error) {
        logError("Error fetching financial data", error);
        setFinancialData([]);
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    };

    const initialize = async () => {
      await fetchReferenceData();
      await fetchFinancialData();
    };

    initialize();
  }, [router, fiscalYear, selectedBatch, selectedProgram, selectedPeriod]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    
    // Show a toast notification for refresh action
    toast.loading("Refreshing data", {
      description: "Fetching the latest financial data",
      position: "top-right"
    });
    
    const fetchFinancialData = async () => {
      try {
        const supabase = createClient();
        
        // Build the query based on filters
        let query = supabase.rpc('get_financial_report', {
          fiscal_year: fiscalYear
        });
        
        if (selectedBatch !== 'all') {
          query = query.eq('batch_id', selectedBatch);
        }
        
        if (selectedProgram !== 'all') {
          query = query.eq('program_code', selectedProgram);
        }
        
        if (selectedPeriod !== 'all') {
          query = query.eq('academic_period', selectedPeriod);
        }
        
        const { data, error } = await query;
        
        if (error) {
          throw error;
        } else {
          setFinancialData(data as FinancialReportData[] || []);
          
          // Show success toast with refresh confirmation
          toast.success("Data refreshed", {
            description: `${data.length} records updated`,
            position: "top-right",
            duration: 3000
          });
        }
      } catch (error) {
        logError("Error refreshing financial data", error);
      } finally {
        setIsRefreshing(false);
      }
    };

    fetchFinancialData();
  };

  // Format the filter description for UI
  const getFilterDescription = (): string => {
    const filters = [];
    
    if (selectedProgram !== 'all') filters.push(`Program: ${selectedProgram}`);
    if (selectedBatch !== 'all') filters.push(`Batch: ${selectedBatch}`);
    if (selectedPeriod !== 'all') filters.push(`Period: ${selectedPeriod}`);
    
    if (filters.length === 0) return `All batches and programs for ${fiscalYear}`;
    return `${filters.join(' | ')} | ${fiscalYear}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg">Loading financial data...</p>
          <p className="text-sm text-muted-foreground">Preparing your reports</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Toast Container */}
      <Toaster richColors closeButton position="top-right" />

      {/* Header Section */}
      <div className="bg-accent rounded-lg shadow-sm mb-8">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <h1 className="text-2xl font-semibold">
              Financial Reports
            </h1>
            <Button 
              variant="outline" 
              onClick={() => router.push('/protected/batch')}
              className="flex items-center gap-2"
            >
              <Briefcase className="h-4 w-4" />
              Batch Management
            </Button>
          </div>
          {financialData.length > 0 && (
            <p className="text-sm mt-3 text-muted-foreground">
              {getFilterDescription()}
            </p>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <ReportFilters 
        fiscalYear={fiscalYear}
        setFiscalYear={setFiscalYear}
        selectedBatch={selectedBatch}
        setSelectedBatch={setSelectedBatch}
        selectedProgram={selectedProgram}
        setSelectedProgram={setSelectedProgram}
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
        batches={batches}
        programs={programs}
        academicPeriods={academicPeriods}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Warning for no data */}
      {financialData.length === 0 ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8 text-center">
          <div className="flex flex-col items-center gap-2">
            <Calendar className="h-12 w-12 text-amber-500" />
            <h3 className="text-lg font-medium text-amber-800">No Financial Data Found</h3>
            <p className="text-amber-700 max-w-md mx-auto">
              There are no financial records available for the selected filters. 
              Try changing your filter criteria or selecting a different fiscal year.
            </p>
            <Button 
              variant="outline" 
              className="mt-2" 
              onClick={() => {
                setSelectedBatch('all');
                setSelectedProgram('all');
                setSelectedPeriod('all');
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Financial Summary Cards */}
          <FinancialSummary financialData={financialData} />

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Income Overview</CardTitle>
                <CardDescription>Expected vs Actual Collected Income</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <IncomeChart financialData={financialData} />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Fund Allocation</CardTitle>
                <CardDescription>Distribution of Collected Funds</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <AllocationChart financialData={financialData} />
              </CardContent>
            </Card>
          </div>

          {/* Detailed Report Table */}
          <Card className="mb-8">
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-lg font-medium">Batch-Wise Financial Report</CardTitle>
                  <CardDescription>{financialData.length} records found</CardDescription>
                </div>
                <ReportDownload 
                  data={financialData}
                  fiscalYear={fiscalYear}
                  selectedBatch={selectedBatch}
                  selectedProgram={selectedProgram}
                  selectedPeriod={selectedPeriod}
                />
              </div>
            </CardHeader>
            <CardContent>
              <BatchWiseTable data={financialData} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default FinancialReportsPage;