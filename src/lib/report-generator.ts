import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency } from './currency';

// Extend the jsPDF type definition to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Position data type
interface Position {
  symbol: string;
  strike?: string;
  type: string;
  segment: string;
  qty: number;
  entryPrice: number;
  ltp: number;
  pnl: number;
  mtm: number;
  status: string;
  [key: string]: any; // To allow additional properties
}

/**
 * Generate a positions report in PDF format
 * 
 * @param positions Array of position data
 * @param reportType Type of report (daily, weekly, monthly, yearly)
 * @param title Report title
 * @param includePnl Whether to include P&L columns
 * @param additionalInfo Additional information to include
 * @returns PDF document as a Blob
 */
export const generatePositionsReport = (
  positions: Position[],
  reportType: 'daily' | 'weekly' | 'monthly' | 'yearly',
  title: string = 'Positions Report',
  includePnl: boolean = true,
  additionalInfo: Record<string, any> = {}
): Blob => {
  // Create new PDF document
  const doc = new jsPDF();
  
  // Set font size and add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Add report date range
  const today = new Date();
  let fromDate = new Date();
  
  switch (reportType) {
    case 'weekly':
      fromDate.setDate(today.getDate() - 7);
      break;
    case 'monthly':
      fromDate.setMonth(today.getMonth() - 1);
      break;
    case 'yearly':
      fromDate.setFullYear(today.getFullYear() - 1);
      break;
    case 'daily':
    default:
      fromDate = today;
  }
  
  doc.setFontSize(12);
  doc.text(
    `Period: ${fromDate.toLocaleDateString('en-IN')} to ${today.toLocaleDateString('en-IN')}`,
    14, 32
  );
  
  // Add report generation timestamp
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(
    `Generated on: ${today.toLocaleString('en-IN')}`,
    14, 38
  );
  
  // Determine columns based on segments in positions data
  const hasEquity = positions.some(p => p.segment === 'equity');
  const hasFno = positions.some(p => p.segment === 'fno');
  
  // Setup columns for the table
  let columns: any[];
  
  if (hasEquity && hasFno) {
    // Mixed positions
    columns = [
      { header: 'Symbol', dataKey: 'symbol' },
      { header: 'Segment', dataKey: 'segment' },
      { header: 'Type', dataKey: 'type' },
      { header: 'Strike/Price', dataKey: 'strike' },
      { header: 'Qty', dataKey: 'qty' },
      { header: 'Entry', dataKey: 'entryPrice' },
      { header: 'LTP', dataKey: 'ltp' },
    ];
  } else if (hasFno) {
    // F&O only
    columns = [
      { header: 'Symbol', dataKey: 'symbol' },
      { header: 'Type', dataKey: 'type' },
      { header: 'Strike', dataKey: 'strike' },
      { header: 'Qty', dataKey: 'qty' },
      { header: 'Entry', dataKey: 'entryPrice' },
      { header: 'LTP', dataKey: 'ltp' },
    ];
  } else {
    // Equity only
    columns = [
      { header: 'Symbol', dataKey: 'symbol' },
      { header: 'Qty', dataKey: 'qty' },
      { header: 'Avg. Price', dataKey: 'entryPrice' },
      { header: 'LTP', dataKey: 'ltp' },
    ];
  }
  
  // Add P&L columns if requested
  if (includePnl) {
    columns = [
      ...columns,
      { header: 'P&L', dataKey: 'pnl' },
      { header: 'MTM', dataKey: 'mtm' },
    ];
  }
  
  // Add status column
  columns.push({ header: 'Status', dataKey: 'status' });
  
  // Format data for table
  const tableData = positions.map(position => {
    const formattedPos: any = { ...position };
    formattedPos.entryPrice = formatCurrency(position.entryPrice);
    formattedPos.ltp = formatCurrency(position.ltp);
    
    if (includePnl) {
      formattedPos.pnl = formatCurrency(position.pnl);
      formattedPos.mtm = formatCurrency(position.mtm);
    }
    
    formattedPos.segment = position.segment === 'equity' ? 'Equity' : 'F&O';
    formattedPos.status = position.status === 'active' ? 'Active' : 'Closed';
    
    return formattedPos;
  });
  
  // Calculate summary for footer
  const totalPnl = includePnl ? positions.reduce((sum, pos) => sum + pos.pnl, 0) : 0;
  const totalMtm = includePnl ? positions.reduce((sum, pos) => sum + pos.mtm, 0) : 0;
  
  // Create the table
  doc.autoTable({
    startY: 45,
    head: [columns.map(col => col.header)],
    body: tableData.map(row => columns.map(col => row[col.dataKey])),
    foot: includePnl ? [[
      'Total', '', '', '', '', '', 
      formatCurrency(totalPnl),
      formatCurrency(totalMtm),
      ''
    ]] : undefined,
    theme: 'grid',
    headStyles: {
      fillColor: [79, 134, 247],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    }
  });
  
  // Add summary section if additional info is provided
  if (Object.keys(additionalInfo).length > 0) {
    const finalY = (doc as any).lastAutoTable.finalY || 45;
    
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('Summary', 14, finalY + 15);
    
    let summaryY = finalY + 25;
    doc.setFontSize(10);
    
    Object.entries(additionalInfo).forEach(([key, value]) => {
      doc.text(`${key}: ${value}`, 14, summaryY);
      summaryY += 7;
    });
  }
  
  // Return the PDF as a blob
  return doc.output('blob');
};

/**
 * Generate a performance report showing P&L over time
 * 
 * @param performanceData Array of performance data points
 * @param reportType Type of report
 * @param title Report title
 * @returns PDF document as a Blob
 */
export const generatePerformanceReport = (
  performanceData: Array<{ date: string, value: number }>,
  reportType: 'daily' | 'weekly' | 'monthly' | 'yearly',
  title: string = 'Performance Report'
): Blob => {
  const doc = new jsPDF();
  
  // Set font size and add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Add report type
  doc.setFontSize(14);
  doc.text(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`, 14, 32);
  
  // Add report generation timestamp
  const today = new Date();
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${today.toLocaleString('en-IN')}`, 14, 38);
  
  // Create the table
  doc.autoTable({
    startY: 45,
    head: [['Date', 'P&L']],
    body: performanceData.map(item => [
      item.date,
      formatCurrency(item.value)
    ]),
    foot: [[
      'Total',
      formatCurrency(performanceData.reduce((sum, item) => sum + item.value, 0))
    ]],
    theme: 'grid',
    headStyles: {
      fillColor: [79, 134, 247],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [240, 240, 240],
      textColor: [0, 0, 0],
      fontStyle: 'bold'
    }
  });
  
  // Return the PDF as a blob
  return doc.output('blob');
};

/**
 * Generate a portfolio summary report
 * 
 * @param portfolioData Portfolio summary data
 * @param title Report title
 * @returns PDF document as a Blob
 */
export const generatePortfolioSummaryReport = (
  portfolioData: {
    networth: number;
    todayMTM: number;
    marginAvailable: number;
    equityValue?: number;
    fnoValue?: number;
    positions: Position[];
  },
  title: string = 'Portfolio Summary'
): Blob => {
  const doc = new jsPDF();
  
  // Set font size and add title
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  // Add report generation timestamp
  const today = new Date();
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generated on: ${today.toLocaleString('en-IN')}`, 14, 28);
  
  // Add summary section
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Portfolio Overview', 14, 40);
  
  doc.setFontSize(10);
  doc.text(`Networth: ${formatCurrency(portfolioData.networth)}`, 14, 50);
  doc.text(`Today's MTM: ${formatCurrency(portfolioData.todayMTM)}`, 14, 57);
  doc.text(`Margin Available: ${formatCurrency(portfolioData.marginAvailable)}`, 14, 64);
  
  if (portfolioData.equityValue !== undefined) {
    doc.text(`Equity Portfolio Value: ${formatCurrency(portfolioData.equityValue)}`, 14, 71);
  }
  
  if (portfolioData.fnoValue !== undefined) {
    doc.text(`F&O Margin Used: ${formatCurrency(portfolioData.fnoValue)}`, 14, 78);
  }
  
  // Create positions table
  const equityPositions = portfolioData.positions.filter(p => p.segment === 'equity');
  const fnoPositions = portfolioData.positions.filter(p => p.segment === 'fno');
  
  // Equity Positions
  if (equityPositions.length > 0) {
    doc.setFontSize(14);
    doc.text('Equity Positions', 14, 90);
    
    doc.autoTable({
      startY: 95,
      head: [['Symbol', 'Qty', 'Avg. Price', 'LTP', 'P&L', 'Status']],
      body: equityPositions.map(pos => [
        pos.symbol,
        pos.qty.toString(),
        formatCurrency(pos.entryPrice),
        formatCurrency(pos.ltp),
        formatCurrency(pos.pnl),
        pos.status === 'active' ? 'Active' : 'Closed'
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [79, 134, 247],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      }
    });
  }
  
  // F&O Positions
  if (fnoPositions.length > 0) {
    const finalY1 = equityPositions.length > 0 ? (doc as any).lastAutoTable.finalY + 15 : 90;
    
    doc.setFontSize(14);
    doc.text('F&O Positions', 14, finalY1);
    
    doc.autoTable({
      startY: finalY1 + 5,
      head: [['Symbol', 'Type', 'Strike', 'Qty', 'Entry', 'LTP', 'P&L', 'Status']],
      body: fnoPositions.map(pos => [
        pos.symbol,
        pos.type,
        pos.strike,
        pos.qty.toString(),
        formatCurrency(pos.entryPrice),
        formatCurrency(pos.ltp),
        formatCurrency(pos.pnl),
        pos.status === 'active' ? 'Active' : 'Closed'
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: [79, 134, 247],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      }
    });
  }
  
  // Add disclaimer
  const finalY = (doc as any).lastAutoTable.finalY || 90;
  
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text('Disclaimer: This report is for informational purposes only. Not financial advice.', 14, finalY + 15);
  
  // Return the PDF as a blob
  return doc.output('blob');
};

/**
 * Download report as PDF file
 * 
 * @param blob PDF blob
 * @param filename Filename for downloaded PDF
 */
export const downloadReport = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  link.click();
  
  // Clean up
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
};