'use client';
import { useState } from 'react';
import { 
  FileDown, 
  FileText, 
  Table as TableIcon, 
  ChevronDown,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type {
  ReportDownloadProps,
  FinancialReportData,
  SelectedColumns,
  DownloadFormat,
  ColumnDisplayNames
} from './types';
import html2pdf from 'html2pdf.js';


const ReportDownload: React.FC<ReportDownloadProps> = ({ 
  data, 
  fiscalYear, 
  selectedBatch, 
  selectedProgram, 
  selectedPeriod 
}) => {
  const [downloadFormat, setDownloadFormat] = useState<DownloadFormat>('csv');
  const [showAdvancedDialog, setShowAdvancedDialog] = useState<boolean>(false);
  const [includeAllColumns, setIncludeAllColumns] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedColumns, setSelectedColumns] = useState<SelectedColumns>({
    batch_id: true,
    program_code: true,
    academic_period: true,
    total_income: true,
    actual_collected: true,
    program_running_expense: true,
    department_development: true,
    research_allocation: true,
    university_income: true
  });

  // Column display names for UI
  const columnDisplayNames: ColumnDisplayNames = {
    batch_id: 'Batch ID',
    program_code: 'Program Code',
    academic_period: 'Academic Period',
    total_income: 'Total Income',
    actual_collected: 'Actual Collected',
    program_running_expense: 'Program Expenses',
    department_development: 'Department Development',
    research_allocation: 'Research Allocation',
    university_income: 'University Income'
  };

  const handleDownload = async (format: DownloadFormat = downloadFormat) => {
    if (!data || data.length === 0) {
      toast.error("No data available to download", {
        description: "Please adjust your filters or try again later.",
        position: "top-right"
      });
      return;
    }

    // Create a toast ID for updating progress
    const toastId = toast.loading("Preparing your report...", {
      description: `Generating ${format.toUpperCase()} file`,
      position: "top-right"
    });

    try {
      setIsGenerating(true);
      
      // Generate filename based on selected filters
      let filename = `PMICS_Financial_Report_${fiscalYear}`;
      if (selectedProgram !== 'all') filename += `_${selectedProgram}`;
      if (selectedBatch !== 'all') filename += `_${selectedBatch}`;
      if (selectedPeriod !== 'all') filename += `_${selectedPeriod}`;
      
      // Filter data to include only selected columns
      const filteredData = data.map((item: FinancialReportData) => {
        const newItem: Record<string, any> = {}; 
        
        Object.keys(selectedColumns).forEach((key) => {
          if (includeAllColumns || selectedColumns[key as keyof SelectedColumns]) {
            if (key in item) {
              newItem[key] = item[key as keyof FinancialReportData];
            }
          }
        });
        
        return newItem;
      });

      // Update toast to show we're processing the data format
      toast.loading(`Processing ${format.toUpperCase()} data...`, {
        id: toastId,
        description: "This may take a moment for large datasets"
      });

      if (format === 'csv') {
        await downloadCSV(filteredData, filename);
      } else if (format === 'excel') {
        await downloadExcel(filteredData, filename);
      } else if (format === 'pdf') {
        await downloadPDF(filteredData, filename);
      }
      
      // Success toast notification
      toast.success("Report downloaded successfully", {
        id: toastId,
        description: `Your ${format.toUpperCase()} report has been generated with ${filteredData.length} record${filteredData.length !== 1 ? 's' : ''}.`,
        duration: 5000
      });
    } catch (error) {
      console.error(`Error generating ${format} report:`, error);
      toast.error("Failed to generate report", {
        id: toastId,
        description: `Error: ${(error as Error)?.message || 'Unknown error occurred'}`,
        duration: 5000
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Download as CSV
  const downloadCSV = async (data: Record<string, any>[], filename: string) => {
    // Get headers from the first data item
    const headers = Object.keys(data[0]);
    
    // Use display names for headers
    const displayHeaders = headers.map(header => columnDisplayNames[header] || header);
    
    // Create CSV content
    let csvContent = displayHeaders.join(',') + '\n';
    
    data.forEach((item) => {
      const row = headers.map(header => {
        // Handle commas and quotes in the value
        const value = item[header];
        if (value === null || value === undefined) return '';
        
        const stringValue = String(value);
        // If the value contains commas or quotes, wrap it in quotes
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      });
      
      csvContent += row.join(',') + '\n';
    });
    
    // Create a Blob with the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create a download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Format currency for display
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  // Download as Excel
  const downloadExcel = async (data: Record<string, any>[], filename: string) => {
    // Load XLSX library dynamically
    if (typeof window.XLSX === 'undefined') {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
    }
    
    // Format data for better presentation
    const formattedData = data.map(item => {
      const formattedItem: Record<string, any> = {};
      
      Object.keys(item).forEach(key => {
        const header = columnDisplayNames[key] || key;
        
        if (typeof item[key] === 'number' && 
            (key.includes('income') || key.includes('collected') || key.includes('expense') || 
             key.includes('development') || key.includes('allocation'))) {
          // Format currency values
          formattedItem[header] = formatCurrency(item[key]);
        } else {
          formattedItem[header] = item[key];
        }
      });
      
      return formattedItem;
    });
    
    // Create a worksheet
    const ws = window.XLSX.utils.json_to_sheet(formattedData);
    
    // Set column widths
    const colWidths = Object.keys(formattedData[0]).map(key => ({ wch: Math.max(key.length * 1.5, 12) }));
    ws['!cols'] = colWidths;
    
    // Create a workbook
    const wb = window.XLSX.utils.book_new();
    
    // Add metadata
    wb.Props = {
      Title: "University of Dhaka - PMICS Financial Report",
      Subject: "Financial Report",
      Author: "PMICS Administration",
      CreatedDate: new Date()
    };
    
    // Add the worksheet to the workbook
    window.XLSX.utils.book_append_sheet(wb, ws, "Financial Report");
    
    // Generate the Excel file and trigger download
    window.XLSX.writeFile(wb, `${filename}.xlsx`);
  };

// Download as PDF - With text wrapping in columns
const downloadPDF = async (data: Record<string, any>[], filename: string) => {
    try {
      // Load jsPDF library dynamically
      if (!window.jspdf) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load jsPDF'));
          document.head.appendChild(script);
        });
      }
      
      // Update toast to show we're generating the PDF
      toast.loading("Creating PDF document...", {
        description: "This may take a few moments",
      });
      
      // Using jsPDF directly (more reliable than html2pdf)
      // @ts-ignore - Ignore TypeScript errors for the jsPDF initialization
      const { jsPDF } = window.jspdf;
      // @ts-ignore - Ignore TypeScript errors for the jsPDF constructor
      const doc = new jsPDF('l', 'mm', 'a4'); // Switch to landscape ('l') for wider tables
      
      // Setup document properties
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      let yPos = margin;
      
      // Add DU logo (as a circle with text)
      doc.setFillColor(0, 106, 78); // #006A4E
      doc.circle(margin + 5, yPos + 5, 5, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('DU', margin + 5, yPos + 7, { align: 'center' });
      
      // Title and header
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setTextColor(0, 106, 78); // #006A4E
      doc.text('University of Dhaka', margin + 13, yPos + 4);
      doc.setTextColor(0, 0, 0);
      
      doc.setFontSize(12);
      doc.text('PMICS Program - Financial Report', margin + 13, yPos + 9);
      
      doc.setFontSize(10);
      doc.text(`Fiscal Year: ${fiscalYear}`, margin + 13, yPos + 14);
      
      yPos += 20;
      
      // Create filter info
      doc.setDrawColor(220, 220, 220);
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin, yPos, contentWidth, 10, 1, 1, 'FD');
      
      const filterText = [
        selectedProgram !== 'all' ? `Program: ${selectedProgram}` : null,
        selectedBatch !== 'all' ? `Batch: ${selectedBatch}` : null,
        selectedPeriod !== 'all' ? `Period: ${selectedPeriod}` : null
      ].filter(Boolean).join(', ') || 'All batches and programs';
      
      doc.setFontSize(9);
      doc.text(`Filters: ${filterText}`, margin + 3, yPos + 5);
      
      yPos += 15;
      
      // Calculate summary values
      const totalIncome = data.reduce((sum, item) => sum + (item.total_income || 0), 0);
      const totalCollected = data.reduce((sum, item) => sum + (item.actual_collected || 0), 0);
      const totalExpense = data.reduce((sum, item) => sum + (item.program_running_expense || 0), 0);
      const departmentDev = data.reduce((sum, item) => sum + (item.department_development || 0), 0);
      const researchAlloc = data.reduce((sum, item) => sum + (item.research_allocation || 0), 0);
      const universityIncome = data.reduce((sum, item) => sum + (item.university_income || 0), 0);
      
      // Format currency
      const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'BDT',
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(value || 0).replace('BDT', 'BDT ');
      };
      
      // Add summary section
      doc.setFontSize(12);
      doc.setTextColor(0, 106, 78); // #006A4E
      doc.text('Financial Summary', margin, yPos);
      doc.setTextColor(0, 0, 0);
      
      yPos += 5;
      
      doc.setDrawColor(220, 220, 220);
      doc.setFillColor(249, 249, 249);
      
      // Create summary grid (2x2)
      const cellWidth = contentWidth / 2;
      const cellHeight = 15;
      
      // Row 1
      doc.rect(margin, yPos, cellWidth, cellHeight, 'FD');
      doc.rect(margin + cellWidth, yPos, cellWidth, cellHeight, 'FD');
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Total Expected Income:', margin + 3, yPos + 5);
      doc.text('Total Collected:', margin + cellWidth + 3, yPos + 5);
      
      doc.setFont(undefined, 'normal');
      doc.text(formatCurrency(totalIncome), margin + 3, yPos + 10);
      doc.text(formatCurrency(totalCollected), margin + cellWidth + 3, yPos + 10);
      
      // Row 2
      yPos += cellHeight;
      doc.rect(margin, yPos, cellWidth, cellHeight, 'FD');
      doc.rect(margin + cellWidth, yPos, cellWidth, cellHeight, 'FD');
      
      doc.setFont(undefined, 'bold');
      doc.text('Collection Rate:', margin + 3, yPos + 5);
      doc.text('Program Expenses:', margin + cellWidth + 3, yPos + 5);
      
      const collectionRate = totalIncome > 0 ? ((totalCollected / totalIncome) * 100).toFixed(2) : '0.00';
      
      doc.setFont(undefined, 'normal');
      doc.text(`${collectionRate}%`, margin + 3, yPos + 10);
      doc.text(formatCurrency(totalExpense), margin + cellWidth + 3, yPos + 10);
      
      // Add allocation breakdown
      yPos += cellHeight + 10;
      doc.setFontSize(12);
      doc.setTextColor(0, 106, 78); // #006A4E
      doc.text('Fund Allocation', margin, yPos);
      doc.setTextColor(0, 0, 0);
      
      yPos += 5;
      
      // Create allocation grid (3x1)
      const allocCellWidth = contentWidth / 3;
      
      doc.rect(margin, yPos, allocCellWidth, cellHeight, 'FD');
      doc.rect(margin + allocCellWidth, yPos, allocCellWidth, cellHeight, 'FD');
      doc.rect(margin + (allocCellWidth * 2), yPos, allocCellWidth, cellHeight, 'FD');
      
      doc.setFontSize(9);
      doc.setFont(undefined, 'bold');
      doc.text('Department Development:', margin + 3, yPos + 5);
      doc.text('Research Allocation:', margin + allocCellWidth + 3, yPos + 5);
      doc.text('University Income:', margin + (allocCellWidth * 2) + 3, yPos + 5);
      
      doc.setFont(undefined, 'normal');
      doc.text(formatCurrency(departmentDev), margin + 3, yPos + 10);
      doc.text(formatCurrency(researchAlloc), margin + allocCellWidth + 3, yPos + 10);
      doc.text(formatCurrency(universityIncome), margin + (allocCellWidth * 2) + 3, yPos + 10);
      
      yPos += cellHeight + 10;
      
      // Define column width proportions based on content type - Landscape mode allows wider columns
      const columnProportions = {
        'batch_id': 0.15,                 // 15% for batch ID
        'program_code': 0.12,             // 12% for program code
        'academic_period': 0.18,          // 18% for academic period
        'total_income': 0.09,             // 9% for money columns (slightly smaller in landscape)
        'actual_collected': 0.09,
        'program_running_expense': 0.12,  // Wider for long column name
        'department_development': 0.10,
        'research_allocation': 0.09, 
        'university_income': 0.09
      };
      
      // Calculate actual column widths
      const columnWidths: Record<string, number> = {};
      Object.keys(data[0]).forEach(key => {
        columnWidths[key] = contentWidth * (columnProportions[key as keyof typeof columnProportions] || 0.11);
      });
      
      // Helper function to calculate the height needed for wrapped text
      const getTextHeight = (text: string, maxWidth: number, fontSize: number): number => {
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, maxWidth);
        return (lines.length * fontSize * 0.3527); // Convert font size to mm
      };
      
      // Create the table header
      doc.setFillColor(0, 106, 78); // #006A4E - header background
      
      // Calculate header height based on wrapped text in header cells
      let maxHeaderHeight = 10; // Minimum header height
      Object.keys(data[0]).forEach(key => {
        const header = columnDisplayNames[key] || key;
        const textHeight = getTextHeight(header, columnWidths[key] - 4, 8);
        maxHeaderHeight = Math.max(maxHeaderHeight, textHeight + 6); // Add padding
      });
      
      doc.rect(margin, yPos, contentWidth, maxHeaderHeight, 'F');
      
      // Add header text with proper spacing and wrapping
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont(undefined, 'bold');
      
      let xOffset = margin;
      Object.keys(data[0]).forEach(key => {
        const header = columnDisplayNames[key] || key;
        const colWidth = columnWidths[key];
        
        // Alignment based on column type (text left, numbers right)
        const isNumeric = key.includes('income') || key.includes('collected') || 
                          key.includes('expense') || key.includes('development') || 
                          key.includes('allocation');
        
        const textX = isNumeric ? 
                     (xOffset + colWidth - 2) : // Right align for numbers
                     (xOffset + 2);            // Left align for text
        
        // Split text and draw wrapped lines
        const maxWidth = colWidth - 4;
        const lines = doc.splitTextToSize(header, maxWidth);
        const textOptions = { 
          align: isNumeric ? 'right' as const : 'left' as const,
          maxWidth
        };
        
        // Center vertically in header cell
        const textY = yPos + (maxHeaderHeight / 2) - ((lines.length * 8 * 0.3527) / 2) + 2;
        doc.text(lines, textX, textY, textOptions);
        
        xOffset += colWidth;
      });
      
      yPos += maxHeaderHeight;
      
      // Add each row with proper alignment, spacing and text wrapping
      doc.setTextColor(0, 0, 0);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8); // Slightly larger font for better readability
      
      // Calculate the max row height based on the content for all rows first
      const baseRowHeight = 8; // Minimum row height
      
      // Calculate and store the height of each row based on its content
      const rowHeights = data.map(row => {
        let maxRowHeight = baseRowHeight;
        
        Object.keys(row).forEach(key => {
          let value = row[key];
          if (value === null || value === undefined) value = '';
          
          // Format currency values for calculation
          if (typeof value === 'number' && 
              (key.includes('income') || key.includes('collected') || 
              key.includes('expense') || key.includes('development') || 
              key.includes('allocation'))) {
            value = formatCurrency(value);
          }
          
          const colWidth = columnWidths[key];
          const textHeight = getTextHeight(String(value), colWidth - 4, 8);
          maxRowHeight = Math.max(maxRowHeight, textHeight + 4); // Add padding
        });
        
        return maxRowHeight;
      });
      
      // Calculate pagination with variable height rows
      const maxY = pageHeight - 15; // Margin from bottom
      
      // Add table rows
      for (let i = 0; i < data.length; i++) {
        const rowHeight = rowHeights[i];
        
        // Check if we need a new page
        if (yPos + rowHeight > maxY) {
          doc.addPage();
          doc.setPage(doc.getNumberOfPages());
          yPos = margin + 10; // Reset position on new page with some margin
          
          // Repeat header on new page
          doc.setFillColor(0, 106, 78);
          doc.rect(margin, yPos - 10, contentWidth, maxHeaderHeight, 'F');
          
          doc.setTextColor(255, 255, 255);
          doc.setFontSize(8);
          doc.setFont(undefined, 'bold');
          
          xOffset = margin;
          Object.keys(data[0]).forEach(key => {
            const header = columnDisplayNames[key] || key;
            const colWidth = columnWidths[key];
            
            const isNumeric = key.includes('income') || key.includes('collected') || 
                            key.includes('expense') || key.includes('development') || 
                            key.includes('allocation');
            
            const textX = isNumeric ? 
                        (xOffset + colWidth - 2) : 
                        (xOffset + 2);
            
            // Split text and draw wrapped lines
            const maxWidth = colWidth - 4;
            const lines = doc.splitTextToSize(header, maxWidth);
            const textOptions = { 
              align: isNumeric ? 'right' as const : 'left' as const,
              maxWidth
            };
            
            // Center vertically in header cell
            const textY = yPos - 10 + (maxHeaderHeight / 2) - ((lines.length * 8 * 0.3527) / 2) + 2;
            doc.text(lines, textX, textY, textOptions);
            
            xOffset += colWidth;
          });
          
          yPos += maxHeaderHeight;
          doc.setTextColor(0, 0, 0);
          doc.setFont(undefined, 'normal');
          doc.setFontSize(8);
        }
        
        // Alternating row background
        if (i % 2 === 0) {
          doc.setFillColor(245, 245, 245);
          doc.rect(margin, yPos, contentWidth, rowHeight, 'F');
        }
        
        // Add row data with proper alignment and text wrapping
        xOffset = margin;
        Object.keys(data[0]).forEach(key => {
          const colWidth = columnWidths[key];
          let value = data[i][key];
          
          const isNumeric = key.includes('income') || key.includes('collected') || 
                           key.includes('expense') || key.includes('development') || 
                           key.includes('allocation');
          
          // Format numeric values
          if (isNumeric && typeof value === 'number') {
            value = formatCurrency(value);
          }
          
          // Set text position based on alignment
          const textX = isNumeric ? 
                       (xOffset + colWidth - 2) : 
                       (xOffset + 2);
          
          // Split text and draw wrapped lines
          const maxWidth = colWidth - 4;
          const lines = doc.splitTextToSize(String(value || ''), maxWidth);
          const textOptions = { 
            align: isNumeric ? 'right' as const : 'left' as const,
            maxWidth
          };
          
          // Center text vertically in cell
          const textY = yPos + (rowHeight / 2) - ((lines.length * 8 * 0.3527) / 2) + 2;
          doc.text(lines, textX, textY, textOptions);
          
          xOffset += colWidth;
        });
        
        // Draw cell borders
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, yPos, margin + contentWidth, yPos); // top border
        
        // Draw vertical lines between cells
        let lineX = margin;
        Object.keys(columnWidths).forEach(key => {
          lineX += columnWidths[key];
          doc.line(lineX, yPos, lineX, yPos + rowHeight);
        });
        
        // Draw outer border lines
        doc.line(margin, yPos, margin, yPos + rowHeight); // left border
        doc.line(margin + contentWidth, yPos, margin + contentWidth, yPos + rowHeight); // right border
        
        // Move to next row
        yPos += rowHeight;
        
        // Bottom border for current row
        doc.line(margin, yPos, margin + contentWidth, yPos);
      }
      
      // Add footer on the last page
      const today = new Date();
      const dateStr = today.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      const footerY = pageHeight - 10;
      
      doc.text(`Generated on ${dateStr}`, pageWidth / 2, footerY - 8, { align: 'center' });
      doc.text('University of Dhaka - PMICS Program', pageWidth / 2, footerY - 5, { align: 'center' });
      doc.text(`Records Count: ${data.length}`, pageWidth / 2, footerY - 2, { align: 'center' });
      
      // Save PDF
      doc.save(`${filename}.pdf`);
      
      toast.success("PDF generated successfully", {
        description: `Report saved as ${filename}.pdf`,
      });
      
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error("PDF generation failed", {
        description: String(error),
      });
      
      // Fallback to CSV if PDF generation fails
      toast.loading("Falling back to CSV format...", {
        duration: 2000,
      });
      
      setTimeout(() => {
        try {
          downloadCSV(data, filename);
          toast.success("CSV downloaded instead", {
            description: "PDF failed, but we exported your data as CSV",
          });
        } catch (csvError) {
          toast.error("All export methods failed", {
            description: "Please try again or contact support",
          });
        }
      }, 2000);
    }
  };
  // Helper function to load scripts dynamically
  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve();
      script.onerror = (e) => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(script);
    });
  };

  // Toggle all columns
  const toggleAllColumns = (checked: boolean) => {
    setIncludeAllColumns(checked);
    
    if (checked) {
      // Select all columns
      const allSelected: SelectedColumns = {} as SelectedColumns;
      Object.keys(selectedColumns).forEach(key => {
        allSelected[key as keyof SelectedColumns] = true;
      });
      setSelectedColumns(allSelected);
    }
  };

  // Toggle individual column
  const toggleColumn = (column: keyof SelectedColumns, checked: boolean) => {
    setSelectedColumns(prev => ({
      ...prev,
      [column]: checked
    }));
    
    // If manually deselecting a column, turn off "include all" option
    if (!checked && includeAllColumns) {
      setIncludeAllColumns(false);
    }
    
    // If all columns are now selected, turn on "include all" option
    const allSelected = Object.keys(selectedColumns).every(
      key => key === column ? checked : selectedColumns[key as keyof SelectedColumns]
    );
    
    if (allSelected) {
      setIncludeAllColumns(true);
    }
  };

  // Get report description for button tooltip
  const getReportDescription = (): string => {
    const parts = [];
    if (selectedProgram !== 'all') parts.push(`Program: ${selectedProgram}`);
    if (selectedBatch !== 'all') parts.push(`Batch: ${selectedBatch}`);
    if (selectedPeriod !== 'all') parts.push(`Period: ${selectedPeriod}`);
    
    if (parts.length === 0) return "All batches and programs";
    return parts.join(', ');
  };

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="flex items-center gap-2" disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="h-4 w-4" />
                Download Report
                <ChevronDown className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Export Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleDownload('csv')} disabled={isGenerating}>
            <FileText className="h-4 w-4 mr-2" />
            Download as CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDownload('excel')} disabled={isGenerating}>
            <TableIcon className="h-4 w-4 mr-2" />
            Download as Excel
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDownload('pdf')} disabled={isGenerating}>
            <FileDown className="h-4 w-4 mr-2" />
            Download as PDF
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowAdvancedDialog(true)} disabled={isGenerating}>
            Advanced Export Options...
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showAdvancedDialog} onOpenChange={setShowAdvancedDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Export Configuration</DialogTitle>
            <DialogDescription>
              Customize your report export settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="format">Export Format</Label>
              <Select
                value={downloadFormat}
                onValueChange={(value: string) => setDownloadFormat(value as DownloadFormat)}
              >
                <SelectTrigger id="format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                  <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                  <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="all-columns" 
                  checked={includeAllColumns} 
                  onCheckedChange={(checked) => toggleAllColumns(checked === true)}
                />
                <label htmlFor="all-columns" className="text-sm font-medium">
                  Include all columns
                </label>
              </div>
              
              {!includeAllColumns && (
                <div className="border rounded-md p-3 space-y-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    Select columns to include:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.keys(selectedColumns).map((column) => (
                      <div key={column} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`column-${column}`} 
                          checked={selectedColumns[column as keyof SelectedColumns]} 
                          onCheckedChange={(checked) => toggleColumn(column as keyof SelectedColumns, checked === true)}
                        />
                        <label htmlFor={`column-${column}`} className="text-sm">
                          {columnDisplayNames[column] || column}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdvancedDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                handleDownload(downloadFormat);
                setShowAdvancedDialog(false);
              }}
              disabled={isGenerating}
            >
              {isGenerating ? 'Generating...' : 'Download'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};



export default ReportDownload;