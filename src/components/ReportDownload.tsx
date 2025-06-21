import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown, Loader2 } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { generatePositionsReport, generatePortfolioSummaryReport, downloadReport } from "@/lib/report-generator";

interface Position {
  id: string;
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
}

interface PortfolioData {
  networth: number;
  todayMTM: number;
  marginAvailable: number;
  equityValue?: number;
  fnoValue?: number;
  positions: Position[];
}

interface ReportDownloadProps {
  positions: Position[];
  portfolioData?: PortfolioData;
  buttonVariant?: "default" | "outline" | "secondary";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  label?: string;
  className?: string;
}

export function ReportDownload({ 
  positions, 
  portfolioData,
  buttonVariant = "outline",
  buttonSize = "sm",
  label = "Download Report",
  className = ""
}: ReportDownloadProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleDownloadReport = async (type: 'daily' | 'weekly' | 'monthly' | 'yearly') => {
    setIsGenerating(true);

    try {
      // Small timeout to simulate report generation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // If portfolio data is provided, generate portfolio summary report
      if (portfolioData) {
        const blob = generatePortfolioSummaryReport(
          portfolioData,
          `Portfolio Summary - ${type.charAt(0).toUpperCase() + type.slice(1)}`
        );
        downloadReport(blob, `portfolio_summary_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
      } else {
        // Generate positions report if no portfolio data
        const blob = generatePositionsReport(
          positions,
          type,
          `${type.charAt(0).toUpperCase() + type.slice(1)} Positions Report`,
          true,
          {
            'Total Positions': positions.length,
            'Active Positions': positions.filter(p => p.status === 'active').length,
            'Total P&L': new Intl.NumberFormat('en-IN', {
              style: 'currency',
              currency: 'INR'
            }).format(positions.reduce((sum, pos) => sum + pos.pnl, 0))
          }
        );
        downloadReport(blob, `positions_${type}_${new Date().toISOString().split('T')[0]}.pdf`);
      }

      toast({
        title: "Report Downloaded",
        description: `Your ${type} report has been generated successfully.`
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Failed to Generate Report",
        description: "There was an issue creating your report. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={buttonVariant} 
          size={buttonSize}
          className={className}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <FileDown className="h-4 w-4 mr-2" />
              {label}
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleDownloadReport('daily')}>
          Daily Report
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownloadReport('weekly')}>
          Weekly Report
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownloadReport('monthly')}>
          Monthly Report
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleDownloadReport('yearly')}>
          Yearly Report
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}