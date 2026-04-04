'use client';
import { useMemo } from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip 
} from 'recharts';
import type {
  AllocationChartProps,
  CustomTooltipProps,
  AllocationChartData,
  FinancialReportData
} from './types';

const AllocationChart: React.FC<AllocationChartProps> = ({ financialData }) => {
  // Calculate allocation data
  const allocationData: AllocationChartData[] = useMemo(() => {
    if (!financialData || financialData.length === 0) {
      return [];
    }

    // Sum all allocations
    const totalRunningExpense = financialData.reduce(
      (sum: number, item: FinancialReportData) => sum + (item.program_running_expense || 0), 0
    );
    
    const totalDepartmentDevelopment = financialData.reduce(
      (sum: number, item: FinancialReportData) => sum + (item.department_development || 0), 0
    );
    
    const totalResearchAllocation = financialData.reduce(
      (sum: number, item: FinancialReportData) => sum + (item.research_allocation || 0), 0
    );
    
    const totalUniversityIncome = financialData.reduce(
      (sum: number, item: FinancialReportData) => sum + (item.university_income || 0), 0
    );

    return [
      { name: 'Program Expenses (60%)', value: totalRunningExpense },
      { name: 'Department Development (15%)', value: totalDepartmentDevelopment },
      { name: 'Research Allocation (10%)', value: totalResearchAllocation },
      { name: 'University Income (15%)', value: totalUniversityIncome }
    ];
  }, [financialData]);

  // Define colors for the pie chart
  const COLORS = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b'];

  // Format currency for tooltip
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Custom tooltip component
  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 border rounded shadow-sm">
          <p className="font-medium">{payload[0].name}</p>
          <p className="text-sm">
            Amount: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Format the legend value
  const renderLegendText = (value: string, entry: any) => {
    return (
      <span className="text-xs">{`${entry.payload.name} (${formatCurrency(entry.payload.value)})`}</span>
    );
  };

  if (allocationData.length === 0 || allocationData.every(item => item.value === 0)) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No allocation data available for the selected filters
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={allocationData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
          >
            {allocationData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            layout="vertical" 
            verticalAlign="middle" 
            align="right"
            formatter={renderLegendText as any}
            wrapperStyle={{
              fontSize: '12px',
              paddingLeft: '10px'
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AllocationChart;