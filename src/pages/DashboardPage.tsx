import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
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

// Mock data
const portfolioData = {
  networth: 12050000, // ₹1.2 Crore
  todayMTM: 125000,   // ₹1.25 Lakh
  marginAvailable: 2570000, // ₹25.7 Lakh
  equityValue: 8240000, // ₹82.4 Lakh
  fnoValue: 3810000, // ₹38.1 Lakh
  positions: [
    { 
      id: "pos1", 
      symbol: "NIFTY", 
      strike: "18000 CE", 
      type: "CALL", 
      segment: "fno",
      qty: 75, 
      entryPrice: 12050, 
      ltp: 13725, 
      pnl: 125625, 
      mtm: 125625,
      status: "active" 
    },
    { 
      id: "pos2", 
      symbol: "BANKNIFTY", 
      strike: "44000 PUT", 
      type: "PUT", 
      segment: "fno",
      qty: 75, 
      entryPrice: 13750, 
      ltp: 13725, 
      pnl: 405000, 
      mtm: 15255,
      status: "active"
    },
    { 
      id: "pos3", 
      symbol: "RELIANCE", 
      strike: "2400", 
      type: "EQ", 
      segment: "equity",
      qty: 50, 
      entryPrice: 2385.5, 
      ltp: 2450.75, 
      pnl: 326250, 
      mtm: 13660,
      status: "active"
    },
    { 
      id: "pos4", 
      symbol: "TATAMOTOR", 
      strike: "675", 
      type: "EQ", 
      segment: "equity",
      qty: 100, 
      entryPrice: 635.55, 
      ltp: 622.15, 
      pnl: -133000, 
      mtm: 62215,
      status: "closed"
    },
    { 
      id: "pos5", 
      symbol: "INFY", 
      strike: "1480", 
      type: "EQ", 
      segment: "equity",
      qty: 75, 
      entryPrice: 1500.05, 
      ltp: 1474.45, 
      pnl: -191250, 
      mtm: 110584,
      status: "active"
    }
  ]
};

// Mock chart data
const pnlChartData = {
  daily: [
    { date: "Jun 10", value: 85000 },
    { date: "Jun 11", value: 94000 },
    { date: "Jun 12", value: 112000 },
    { date: "Jun 13", value: 125000 },
    { date: "Jun 14", value: 138000 },
    { date: "Jun 15", value: 164000 },
    { date: "Jun 16", value: 178000 }
  ],
  weekly: [
    { date: "May W1", value: 350000 },
    { date: "May W2", value: 420000 },
    { date: "May W3", value: 380000 },
    { date: "May W4", value: 510000 },
    { date: "Jun W1", value: 570000 },
    { date: "Jun W2", value: 640000 }
  ],
  monthly: [
    { date: "Jan", value: 1250000 },
    { date: "Feb", value: 1450000 },
    { date: "Mar", value: 1820000 },
    { date: "Apr", value: 2150000 },
    { date: "May", value: 2360000 },
    { date: "Jun", value: 2780000 }
  ],
  yearly: [
    { date: "2020", value: 3250000 },
    { date: "2021", value: 5150000 },
    { date: "2022", value: 8350000 },
    { date: "2023", value: 10450000 },
    { date: "2024", value: 12050000 }
  ]
};

// Mock margin utilization data
const marginData = [
  { name: "Used", value: 7430000 },
  { name: "Available", value: 2570000 }
];

const COLORS = ['#4F86F7', '#F0F0F0'];

// Custom tooltip for Line Chart
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded shadow-lg">
        <p className="font-medium">{label}</p>
        <p className="text-primary">{`P&L: ${formatCurrency(payload[0].value)}`}</p>
      </div>
    );
  }
  return null;
};

const DashboardPage = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [chartPeriod, setChartPeriod] = useState("daily");
  const isMobile = useIsMobile();
  const [selectedSegment, setSelectedSegment] = useState("all");

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Handle security select
  const handleSecuritySelect = (security: any) => {
    console.log("Selected security:", security);
    // In a real app, you would do something with this selection
  };

  // Get chart data based on selected period
  const getChartData = () => {
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

  return (
    <DashboardLayout>
      {/* Stock Ticker */}
    <StockTicker
      indices={[
        { symbol: "NIFTY 50", price: 22986.30, change: 0.45 },
        { symbol: "BANKNIFTY", price: 49123.55, change: -0.12 },
        { symbol: "RELIANCE", price: 2925.40, change: 1.01 },
        { symbol: "TCS", price: 3999.85, change: 0.35 },
        { symbol: "INFY", price: 1565.25, change: -0.22 },
        { symbol: "LT", price: 3675.40, change: 0.65 },
        { symbol: "ICICI BANK", price: 1123.75, change: 0.78 },
      ]}
    />



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
          
          {/* Segment Tabs */}
          <Tabs defaultValue="all">
            <TabsList className="grid grid-cols-3 w-full md:w-80">
              <TabsTrigger value="all" onClick={() => setSelectedSegment("all")}>All</TabsTrigger>
              <TabsTrigger value="equity" onClick={() => setSelectedSegment("equity")}>Equity</TabsTrigger>
              <TabsTrigger value="fno" onClick={() => setSelectedSegment("fno")}>F&O</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Card className="stat-card">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Current Networth</h3>
                    <div className="mt-2 flex items-center">
                      <div className="text-2xl font-bold">{formatCurrency(portfolioData.networth)}</div>
                    </div>
                  </div>
                </Card>
                
                <Card className="stat-card">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Today's MTM</h3>
                    <div className="mt-2 flex items-center">
                      <div className={`text-2xl font-bold ${portfolioData.todayMTM >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {portfolioData.todayMTM >= 0 ? "+" : ""}{formatCurrency(portfolioData.todayMTM)}
                      </div>
                      {portfolioData.todayMTM >= 0 ? (
                        <TrendingUp className="ml-2 h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingDown className="ml-2 h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </div>
                </Card>
                
                <Card className="stat-card">
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
                <Card className="stat-card">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Equity Portfolio Value</h3>
                    <div className="mt-2 flex items-center">
                      <div className="text-2xl font-bold">{formatCurrency(portfolioData.equityValue || 0)}</div>
                    </div>
                  </div>
                </Card>
                
                <Card className="stat-card">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Today's Equity P&L</h3>
                    <div className="mt-2 flex items-center">
                      <div className="text-2xl font-bold text-green-600">
                        +{formatCurrency(75000)}
                      </div>
                      <TrendingUp className="ml-2 h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </Card>
                
                <Card className="stat-card">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Total Equity Holdings</h3>
                    <div className="mt-2 flex items-center">
                      <div className="text-2xl font-bold">12</div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="fno">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <Card className="stat-card">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">F&O Margin Used</h3>
                    <div className="mt-2 flex items-center">
                      <div className="text-2xl font-bold">{formatCurrency(portfolioData.fnoValue || 0)}</div>
                    </div>
                  </div>
                </Card>
                
                <Card className="stat-card">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Today's F&O P&L</h3>
                    <div className="mt-2 flex items-center">
                      <div className="text-2xl font-bold text-red-600">
                        -{formatCurrency(50000)}
                      </div>
                      <TrendingDown className="ml-2 h-5 w-5 text-red-500" />
                    </div>
                  </div>
                </Card>
                
                <Card className="stat-card">
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Active F&O Positions</h3>
                    <div className="mt-2 flex items-center">
                      <div className="text-2xl font-bold">8</div>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
          
          {/* Open Positions */}
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
                  {portfolioData.positions.map((position, index) => (
                    <TableRow key={position.id} className="position-row">
                      <TableCell className="font-medium">{position.symbol}</TableCell>
                      <TableCell>{position.strike}</TableCell>
                      <TableCell>{position.type}</TableCell>
                      <TableCell>{position.qty}</TableCell>
                      <TableCell>{formatCurrency(position.entryPrice)}</TableCell>
                      <TableCell>{formatCurrency(position.ltp)}</TableCell>
                      <TableCell className={position.pnl >= 0 ? "text-green-600" : "text-red-600"}>
                        {position.pnl >= 0 ? "+" : ""}{formatCurrency(position.pnl)}
                      </TableCell>
                      <TableCell>{formatCurrency(position.mtm)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Charts */}
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
                      tickFormatter={(value) => `₹${value/100000}L`}
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
              </div>
            </Card>

            {/* Margin Utilization */}
            <Card className="portfolio-card">
              <h2 className="text-lg font-semibold mb-4 px-4 pt-4">Margin Utilization</h2>
              <div className="flex flex-col md:flex-row items-center justify-between h-[300px]">
                <div className="w-full md:w-1/2 h-[200px] md:h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={marginData}
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
                        {marginData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col space-y-4 p-4">
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-[#4F86F7] mr-2"></div>
                    <span className="text-sm">Used: {formatCurrency(marginData[0].value)}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="h-3 w-3 rounded-full bg-[#F0F0F0] mr-2"></div>
                    <span className="text-sm">Available: {formatCurrency(marginData[1].value)}</span>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Utilization</span>
                      <span className="font-medium">{Math.round((marginData[0].value / (marginData[0].value + marginData[1].value)) * 100)}%</span>
                    </div>
                    <div className="mt-1 h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${(marginData[0].value / (marginData[0].value + marginData[1].value)) * 100}%` }}
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
              })}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;