// types.ts - Type definitions for Financial Reports system with specific fixes for the errors

// --------------------------------------
// Data Models
// --------------------------------------

/**
 * Financial data structure returned from the database
 */
declare global {
    interface Window {
      html2pdf?: any;
      XLSX?: any;
      jspdf?: {
        jsPDF: new (options?: any) => any;
      };
      html2canvas?: (element: HTMLElement, options?: any) => Promise<HTMLCanvasElement>;
    }
  }
  
  
export interface ReportFiltersProps {
    fiscalYear: number;
    setFiscalYear: (year: number) => void;
    selectedBatch: string;
    setSelectedBatch: (batchId: string) => void;
    selectedProgram: string;
    setSelectedProgram: (program: string) => void;
    selectedPeriod: string;
    setSelectedPeriod: (period: string) => void;
    batches: Batch[];
    programs: string[];
    academicPeriods: AcademicPeriod[];
    onRefresh: () => void;
    isRefreshing: boolean; // Added this property
  }

export interface FinancialReportData {
    batch_id: string;
    program_code: string;
    academic_period: string;
    total_income: number;
    actual_collected: number;
    program_running_expense: number;
    department_development: number;
    research_allocation: number;
    university_income: number;
  }
  
  /**
   * Batch information
   */
  export interface Batch {
    id: string;
    batch_id: string;
    program_code: string;
    intake_session?: string;
    number_of_students?: number;
    created_at?: string;
    updated_at?: string;
  }
  
  /**
   * Academic period information
   */
  export interface AcademicPeriod {
    id: string;
    name: string;
    batch_id: string;
    semester_number?: number;
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
    created_at?: string;
    updated_at?: string;
  }
  
  /**
   * Chart data structure for income visualization
   */
  export interface IncomeChartData {
    name: string;
    totalIncome: number;
    actualCollected: number;
  }
  
  /**
   * Chart data structure for allocation visualization
   */
  export interface AllocationChartData {
    name: string;
    value: number;
  }
  
  /**
   * Summary metrics calculated from financial data
   */
  export interface SummaryMetrics {
    totalIncome: number;
    totalCollected: number;
    collectionRate: number;
    runningExpense: number;
    departmentDevelopment: number;
    researchAllocation: number;
    universityIncome: number;
  }
  
  // --------------------------------------
  // Component Props Types
  // --------------------------------------
  
  /**
   * Props for the main Financial Reports Page
   */
  export interface FinancialReportsPageProps {}
  
  /**
   * Props for Report Filters component
   */
  export interface ReportFiltersProps {
    fiscalYear: number;
    setFiscalYear: (year: number) => void;
    selectedBatch: string;
    setSelectedBatch: (batchId: string) => void;
    selectedProgram: string;
    setSelectedProgram: (program: string) => void;
    selectedPeriod: string;
    setSelectedPeriod: (period: string) => void;
    batches: Batch[];
    programs: string[];
    academicPeriods: AcademicPeriod[];
    onRefresh: () => void;
  }
  
  /**
   * Props for Financial Summary component
   */
  export interface FinancialSummaryProps {
    financialData: FinancialReportData[];
  }
  
  /**
   * Props for Income Chart component
   */
  export interface IncomeChartProps {
    financialData: FinancialReportData[];
  }
  
  /**
   * Props for Allocation Chart component
   */
  export interface AllocationChartProps {
    financialData: FinancialReportData[];
  }
  
  /**
   * Props for Batch-wise Table component
   */
  export interface BatchWiseTableProps {
    data: FinancialReportData[];
  }
  
  /**
   * Props for Report Download component
   */
  export interface ReportDownloadProps {
    data: FinancialReportData[];
    fiscalYear: number;
    selectedBatch: string;
    selectedProgram: string;
    selectedPeriod: string;
  }
  
  /**
   * Custom tooltip props for charts
   */
  export interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
  }
  
  /**
   * Entry type for legend formatter
   */
  export interface LegendEntry {
    value: string;
    payload: {
      name: string;
      value: number;
      [key: string]: any;
    };
  }
  
  // --------------------------------------
  // State Types
  // --------------------------------------
  
  /**
   * Type for selected columns in report download
   */
  export interface SelectedColumns {
    batch_id: boolean;
    program_code: boolean;
    academic_period: boolean;
    total_income: boolean;
    actual_collected: boolean;
    program_running_expense: boolean;
    department_development: boolean;
    research_allocation: boolean;
    university_income: boolean;
    [key: string]: boolean; // Index signature for string keys
  }
  
  /**
   * Download format options
   */
  export type DownloadFormat = 'csv' | 'excel' | 'pdf';
  
  /**
   * Sort direction options
   */
  export type SortDirection = 'asc' | 'desc';
  
  /**
   * Collection rate status options for styling
   * Note: Must match available Badge variants in your UI components
   */
  export type CollectionRateStatus = 'default' | 'secondary' | 'destructive' | 'outline';
  
  /**
   * Extended collection rate status with custom variants
   * For use in logic, will be mapped to CollectionRateStatus for display
   */
  export type ExtendedStatusType = 'success' | 'warning' | 'destructive' | 'default';
  
  /**
   * Column display names mapping
   */
  export interface ColumnDisplayNames {
    [key: string]: string;
  }
  
  // --------------------------------------
  // Utility Types
  // --------------------------------------
  
  /**
   * Mapping function for collection status to Badge variant
   */
  export function mapStatusToBadgeVariant(status: ExtendedStatusType): CollectionRateStatus {
    switch (status) {
      case 'success':
        return 'default'; // Using default instead of success since Badge doesn't have success variant
      case 'warning':
        return 'secondary'; // Using secondary instead of warning
      case 'destructive':
        return 'destructive';
      default:
        return 'outline';
    }
  }
  
