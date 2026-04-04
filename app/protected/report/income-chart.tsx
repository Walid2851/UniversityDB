'use client';
import { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import type { 
  IncomeChartProps, 
  CustomTooltipProps, 
  IncomeChartData,
  FinancialReportData
} from './types';

const IncomeChart: React.FC<IncomeChartProps> = ({ financialData }) => {
  // Process data for chart
  const chartData: IncomeChartData[] = useMemo(() => {
    if (!financialData || financialData.length === 0) {
      return [];
    }

    // If we have too many batches, we'll aggregate by program
    if (financialData.length > 10) {
      const programData: Record<string, IncomeChartData> = {};
      
      financialData.forEach((item: FinancialReportData) => {
        const program = item.program_code;
        if (!programData[program]) {
          programData[program] = {
            name: program,
            totalIncome: 0,
            actualCollected: 0
          };
        }
        
        programData[program].totalIncome += item.total_income || 0;
        programData[program].actualCollected += item.actual_collected || 0;
      });
      
      return Object.values(programData);
    } else {
      // Use batch-level data if we have a reasonable number of batches
      return financialData.map((item: FinancialReportData) => ({
        name: item.batch_id,
        totalIncome: item.total_income || 0,
        actualCollected: item.actual_collected || 0
      }));
    }
  }, [financialData]);

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
  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background p-3 border rounded shadow-sm">
          <p className="font-medium">{label}</p>
          <p className="text-sm">
            <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
            Expected: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm">
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span>
            Collected: {formatCurrency(payload[1].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        No data available for the selected filters
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 20, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            tick={{ fontSize: 12 }}
            height={70}
          />
          <YAxis 
            tickFormatter={formatCurrency}
            tick={{ fontSize: 12 }}
          />
          <Tooltip content={<CustomTooltip active={false} payload={[]} label="" />} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar 
            name="Expected Income" 
            dataKey="totalIncome" 
            fill="#3b82f6" 
            radius={[4, 4, 0, 0]} 
          />
          <Bar 
            name="Collected Income" 
            dataKey="actualCollected" 
            fill="#22c55e" 
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncomeChart;