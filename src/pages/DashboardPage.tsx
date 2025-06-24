import { useState, useEffect, useCallback } from "react";
// REMOVE THIS LINE: DashboardLayout is no longer directly imported and wrapped here
// import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { TableHead, TableRow, TableHeader, TableCell, TableBody, Table } from "@/components/ui/table";
import { StockTicker } from "@/components/StockTicker";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  TooltipProps,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Percent
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCurrency } from "@/lib/currency";
import { SecuritiesSearch } from "@/components/SecuritiesSearch";
import { ReportDownload } from "@/components/ReportDownload";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// --- Import your API modules ---
import { portfolioApi, marketApi } from "@/lib/api"; // Adjust path as needed

// Define interfaces for backend data (MUST match your Spring Boot DTOs precisely)
interface Position {
  id: string; // Use string for ID as it might come as UUID or Long converted to string
  symbol: string;
  strike?: string; // Optional for equity
  type: string; // e.g., "CALL", "PUT", "EQ"
  segment: "fno" | "equity";
  qty: number;
  entryPrice: number;
  ltp: number; // Last Traded Price
  pnl: number; // Profit/Loss for this position
  mtm: number; // Mark-to-Market for this position
  status: "active" | "closed";
}

interface PortfolioData {
  networth: number;
  todayMTM: number;
  marginAvailable: number;
  equityValue: number; // Total value of equity holdings
  fnoValue: number;    // Total margin blocked/value for F&O
  positions: Position[];
  marginUsed: number; // Added for margin pie chart, assuming backend provides this
  todayEquityPnL?: number; // Added for more precise data from backend
  todayFnoPnL?: number;   // Added for more precise data from backend
}

interface ChartDataPoint {
  date: string; // Date string for X-axis (e.g., "Jan 01", "Week 1", "Mar")
  value: number; // P&L value for that point
}

interface PnLChartData {
  daily: ChartDataPoint[];
  weekly: ChartDataPoint[];
  monthly: ChartDataPoint[];
  yearly: ChartDataPoint[];
}

interface IndexData {
  symbol: string;
  price: number;
  change: number; // Percentage change
}

// Custom tooltip for Line Chart
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded shadow-lg z-50 dark:bg-gray-800 dark:border-gray-700">
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-primary">{`P&L: ${formatCurrency(payload[0].value)}`}</p>
      </div>
    );
  }
  return null;
};

// Helper function to format large numbers for Y-axis (e.g., for Lakhs, Crores)
const formatValueForChart = (value: number) => {
    if (Math.abs(value) >= 10000000) { // Crore
        return `₹${(value / 10000000).toFixed(2)} Cr`;
    }
    if (Math.abs(value) >= 100000) { // Lakh
        return `₹${(value / 100000).toFixed(2)} L`;
    }
    if (Math.abs(value) >= 1000) { // Thousand
        return `₹${(value / 1000).toFixed(2)} K`;
    }
    return `₹${value.toFixed(0)}`;
};


const DashboardPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [chartPeriod, setChartPeriod] = useState("daily");
  const [selectedSegment, setSelectedSegment] = useState("all");
  const [indices, setIndices] = useState<IndexData[]>([]);

  // State for data fetched from backend
  const [portfolioData, setPortfolioData] = useState<PortfolioData | null>(null);
  const [pnlChartData, setPnlChartData] = useState<PnLChartData | null>(null);

  // Loading and Error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoized COLORS for margin pie chart
  const COLORS = ['#4F86F7', '#F0F0F0']; // Blue for Used, Light Grey for Available

  // --- Data Fetching Functions using your API modules ---

  const fetchPortfolioData = useCallback(async () => {
    setLoading(true); // Start loading
    setError(null);    // Clear previous errors
    try {
      const response = await portfolioApi.getPortfolio();
      setPortfolioData(response.data);
    } catch (err: any) {
      console.error("Failed to fetch portfolio data:", err);
      setError(err.response?.data?.message || "Failed to load portfolio data. Please try again.");
    } finally {
      setLoading(false); // End loading regardless of success or failure
    }
  }, []);

  const fetchPnlChartData = useCallback(async () => {
    try {
      // Assuming marketApi.getChartData can fetch aggregated portfolio P&L data
      // You might need a dedicated endpoint like portfolioApi.getPnlChartData() on backend
      const response = await marketApi.getChartData("portfolio", "all"); // "portfolio" as symbol, "all" for periods
      setPnlChartData(response.data);
    } catch (err: any) {
      console.error("Failed to fetch P&L chart data:", err);
      // Specific error handling for chart if needed, or rely on global error state if critical
    }
  }, []);

  useEffect(() => {
    const fetchAndSetIndices = async () => {
      try {
        const response = await marketApi.getIndices();
        setIndices(response.data);
      } catch (error) {
        console.error("Failed to fetch indices:", error);
      }
    };

    fetchAndSetIndices();
    const interval = setInterval(fetchAndSetIndices, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchPortfolioData();
    fetchPnlChartData();
  }, [fetchPortfolioData, fetchPnlChartData]);

  // Update current time every second for "Last updated" display
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSecuritySelect = (security: any) => {
    console.log("Selected security:", security);
    // TODO: In a real application, navigate to a security detail page or fetch specific data
  };

  const getChartData = (): ChartDataPoint[] => {
    if (!pnlChartData) return [];
    switch (chartPeriod) {
      case "weekly":
        return pnlChartData.weekly;
      case "monthly":
        return pnlChartData.monthly;
      case "yearly":
        return pnlChartData.yearly;
      case "daily":
      default:
        return pnlChartData.daily;
    }
  };

  const getMarginData = useCallback(() => { // Memoize this function too
    if (!portfolioData) return [{ name: "Used", value: 0 }, { name: "Available", value: 0 }];
    return [
      { name: "Used", value: portfolioData.marginUsed },
      { name: "Available", value: portfolioData.marginAvailable }
    ];
  }, [portfolioData]); // Dependency on portfolioData

  // --- Conditional Rendering for Loading and Error States ---
  if (loading) {
    return (
      // Removed DashboardLayout wrapper here as well
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-lg font-semibold text-gray-700">Loading dashboard data...</p>
        <p className="text-sm text-gray-500 mt-2">Fetching your latest portfolio details.</p>
      </div>
    );
  }

  if (error) {
    return (
      // Removed DashboardLayout wrapper here as well
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-red-600">
        <p className="text-lg font-semibold mb-2">Error loading dashboard:</p>
        <p className="text-sm text-gray-700 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            fetchPortfolioData();
            fetchPnlChartData();
          }}
          className="mt-4 px-6 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // Ensure portfolioData is not null before attempting to render the main dashboard content
  if (!portfolioData) {
    return (
      // Removed DashboardLayout wrapper here as well
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-lg font-semibold text-gray-700">No portfolio data available.</p>
        <p className="text-sm text-gray-500 mt-2">Please ensure you are logged in and have an active portfolio.</p>
      </div>
    );
  }

  const filteredPositions = portfolioData.positions.filter(p => p.status === "active" && (selectedSegment === "all" || p.segment === selectedSegment));

  // --- Main Dashboard Rendering (only if data is loaded) ---
  return (
    // REMOVED THE DashboardLayout WRAPPER HERE
    <> {/* Use a React Fragment if you need a single root element */}
      {/* Stock Ticker - uses indices state */}
      <StockTicker indices={indices} />

      <div className="container mx-auto py-6 px-4 md:px-6 max-w-7xl">
        <div className="flex flex-col space-y-6">
          {/* Securities Search */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="w-full md:w-64">
              <SecuritiesSearch
                onSelect={handleSecuritySelect}
                placeholder="Search for securities..."
              />
            </div>
          </div>

          {/* Segment Tabs for Portfolio Overview */}
          <Tabs defaultValue="all" onValueChange={setSelectedSegment}>
            <TabsList className="grid grid-cols-3 w-full md:w-80">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="equity">Equity</TabsTrigger>
              <TabsTrigger value="fno">F&O</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Card className="stat-card p-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Current Networth</h3>
                    <div className="mt-2 flex items-center">
                      <div className="text-2xl font-bold">{formatCurrency(portfolioData.networth)}</div>
                    </div>
                  </div>
                </Card>

                <Card className="stat-card p-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Today's MTM</h3>
                    <div className="mt-2 flex items-center">
                      <div className={`text-2xl font-bold ${portfolioData.todayMTM >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {portfolioData.todayMTM >= 0 ? "+" : ""}{formatCurrency(portfolioData.todayMTM)}
                      </div>
                      {portfolioData.todayMTM >= 0 ? (
                        <TrendingUp className="ml-2 h-5 w-5 text-green-500" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="ml-2 h-5 w-5 text-red-500" aria-hidden="true" />
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="stat-card p-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Margin Available</h3>
                    <div className="mt-2 flex items-center">
                      <div className="text-2xl font-bold">{formatCurrency(portfolioData.marginAvailable)}</div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="equity">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Card className="stat-card p-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Equity Portfolio Value</h3>
                    <div className="mt-2 flex items-center">
                      <div className="text-2xl font-bold">{formatCurrency(portfolioData.equityValue)}</div>
                    </div>
                  </div>
                </Card>

                <Card className="stat-card p-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Today's Equity P&L</h3>
                    <div className="mt-2 flex items-center">
                      <div className={`text-2xl font-bold ${
                          (portfolioData.todayEquityPnL ?? portfolioData.todayMTM) >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                        {(portfolioData.todayEquityPnL ?? portfolioData.todayMTM) >= 0 ? "+" : ""}
                        {formatCurrency(portfolioData.todayEquityPnL ?? portfolioData.todayMTM)}
                      </div>
                      {(portfolioData.todayEquityPnL ?? portfolioData.todayMTM) >= 0 ? (
                        <TrendingUp className="ml-2 h-5 w-5 text-green-500" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="ml-2 h-5 w-5 text-red-500" aria-hidden="true" />
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="stat-card p-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Active Equity Positions</h3>
                    <div className="mt-2 flex items-center">
                      <div className="text-2xl font-bold">
                        {portfolioData.positions.filter(p => p.segment === "equity" && p.status === "active").length}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="fno">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Card className="stat-card p-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">F&O Margin Blocked</h3>
                    <div className="mt-2 flex items-center">
                      <div className="text-2xl font-bold">{formatCurrency(portfolioData.fnoValue)}</div>
                    </div>
                  </div>
                </Card>

                <Card className="stat-card p-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Today's F&O P&L</h3>
                    <div className="mt-2 flex items-center">
                      <div className={`text-2xl font-bold ${
                          (portfolioData.todayFnoPnL ?? portfolioData.todayMTM) >= 0 ? "text-green-600" : "text-red-600"
                        }`}>
                        {(portfolioData.todayFnoPnL ?? portfolioData.todayMTM) >= 0 ? "+" : ""}
                        {formatCurrency(portfolioData.todayFnoPnL ?? portfolioData.todayMTM)}
                      </div>
                      {(portfolioData.todayFnoPnL ?? portfolioData.todayMTM) >= 0 ? (
                        <TrendingUp className="ml-2 h-5 w-5 text-green-500" aria-hidden="true" />
                      ) : (
                        <TrendingDown className="ml-2 h-5 w-5 text-red-500" aria-hidden="true" />
                      )}
                    </div>
                  </div>
                </Card>

                <Card className="stat-card p-4">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Active F&O Positions</h3>
                    <div className="mt-2 flex items-center">
                      <div className="text-2xl font-bold">
                        {portfolioData.positions.filter(p => p.segment === "fno" && p.status === "active").length}
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Open Positions Table */}
          <Card className="portfolio-card">
            <div className="flex items-center justify-between mb-4 px-4 pt-4">
              <h2 className="text-lg font-semibold">Open Positions</h2>
              <ReportDownload
                positions={portfolioData.positions.filter(p => p.status === "active")}
                portfolioData={portfolioData}
                label="Portfolio Report"
              />
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Strike</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Entry Price</TableHead>
                    <TableHead>LTP</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>MTM</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPositions.length > 0 ? (
                    filteredPositions.map((position) => (
                      <TableRow key={position.id} className="position-row">
                        <TableCell className="font-medium">{position.symbol}</TableCell>
                        <TableCell>{position.strike || '-'}</TableCell>
                        <TableCell>{position.type}</TableCell>
                        <TableCell>{position.qty}</TableCell>
                        <TableCell>{formatCurrency(position.entryPrice)}</TableCell>
                        <TableCell>{formatCurrency(position.ltp)}</TableCell>
                        <TableCell className={position.pnl >= 0 ? "text-green-600" : "text-red-600"}>
                          {position.pnl >= 0 ? "+" : ""}{formatCurrency(position.pnl)}
                        </TableCell>
                        <TableCell>{formatCurrency(position.mtm)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground py-4">
                        No active {selectedSegment !== "all" ? selectedSegment : ""} positions found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* P&L Chart */}
            <Card className="portfolio-card">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 px-4 pt-4">
                <h2 className="text-lg font-semibold">P&L Chart</h2>
                <Select value={chartPeriod} onValueChange={setChartPeriod}>
                  <SelectTrigger className="w-[180px] mt-2 md:mt-0">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-[300px]">
                {pnlChartData && getChartData().length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={getChartData()}
                      margin={{ top: 5, right: 20, left: 20, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tickMargin={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tickMargin={10}
                        tickFormatter={(value) => formatValueForChart(value as number)}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#4F86F7"
                        strokeWidth={2}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6, strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No P&L chart data available for this period.
                  </div>
                )}
              </div>
            </Card>

            {/* Margin Utilization Pie Chart */}
            <Card className="portfolio-card">
              <h2 className="text-lg font-semibold mb-4 px-4 pt-4">Margin Utilization</h2>
              <div className="flex flex-col md:flex-row items-center justify-between h-[300px]">
                <div className="w-full md:w-1/2 h-[200px] md:h-full">
                  {getMarginData()[0].value + getMarginData()[1].value > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getMarginData()}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          startAngle={90}
                          endAngle={450}
                        >
                          {getMarginData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      No margin data available.
                    </div>
                  )}
                </div>
                <div className="flex flex-col space-y-4 p-4">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-[#4F86F7] mr-2"></div>
                    <span className="text-sm">Used: {formatCurrency(getMarginData()[0].value)}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-[#F0F0F0] mr-2"></div>
                    <span className="text-sm">Available: {formatCurrency(getMarginData()[1].value)}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Utilization</span>
                      <span className="font-medium">
                        {/* Enhanced utilization percentage calculation */}
                        {Math.round(
                          (getMarginData()[0].value / (getMarginData()[0].value + getMarginData()[1].value || 1)) * 100
                        )}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(getMarginData()[0].value / (getMarginData()[0].value + getMarginData()[1].value || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Current Time Display */}
          <div className="flex justify-center mt-4">
            <div className="text-center text-muted-foreground text-sm">
              Last updated: {currentTime.toLocaleString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true,
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;