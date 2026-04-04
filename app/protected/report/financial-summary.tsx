'use client';
import { useMemo } from 'react';
import { 
  DollarSign, 
  PieChart, 
  BookOpen, 
  Award 
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import type { 
  FinancialSummaryProps, 
  FinancialReportData, 
  SummaryMetrics 
} from './types';

const FinancialSummary: React.FC<FinancialSummaryProps> = ({ financialData }) => {
  // Calculate summary metrics
  const summaryMetrics: SummaryMetrics = useMemo(() => {
    if (!financialData || financialData.length === 0) {
      return {
        totalIncome: 0,
        totalCollected: 0,
        collectionRate: 0,
        runningExpense: 0,
        departmentDevelopment: 0,
        researchAllocation: 0,
        universityIncome: 0
      };
    }

    const totalIncome = financialData.reduce(
      (sum: number, item: FinancialReportData) => sum + (item.total_income || 0), 0
    );
    
    const totalCollected = financialData.reduce(
      (sum: number, item: FinancialReportData) => sum + (item.actual_collected || 0), 0
    );
    
    const runningExpense = financialData.reduce(
      (sum: number, item: FinancialReportData) => sum + (item.program_running_expense || 0), 0
    );
    
    const departmentDevelopment = financialData.reduce(
      (sum: number, item: FinancialReportData) => sum + (item.department_development || 0), 0
    );
    
    const researchAllocation = financialData.reduce(
      (sum: number, item: FinancialReportData) => sum + (item.research_allocation || 0), 0
    );
    
    const universityIncome = financialData.reduce(
      (sum: number, item: FinancialReportData) => sum + (item.university_income || 0), 0
    );
    
    const collectionRate = totalIncome > 0 
      ? totalCollected / totalIncome
      : 0;

    return {
      totalIncome,
      totalCollected,
      collectionRate,
      runningExpense,
      departmentDevelopment,
      researchAllocation,
      universityIncome
    };
  }, [financialData]);

  // Format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Income
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {formatCurrency(summaryMetrics.totalIncome)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Collected: {formatCurrency(summaryMetrics.totalCollected)} 
                ({Math.round(summaryMetrics.collectionRate * 100)}%)
              </p>
            </div>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Program Expenses
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {formatCurrency(summaryMetrics.runningExpense)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                60% of collected funds
              </p>
            </div>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Development & Research
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {formatCurrency(summaryMetrics.departmentDevelopment + summaryMetrics.researchAllocation)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                25% of collected funds
              </p>
            </div>
            <Award className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            University Income
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">
                {formatCurrency(summaryMetrics.universityIncome)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                15% of collected funds
              </p>
            </div>
            <PieChart className="h-5 w-5 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialSummary;