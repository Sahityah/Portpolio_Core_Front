import { useEffect, useRef, useState, useCallback } from "react";
// REMOVE THIS IMPORT: DashboardLayout is no longer directly imported and wrapped here
// import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
} from "lightweight-charts";
import { Button } from "@/components/ui/button";
import { SecuritiesSearch } from "@/components/SecuritiesSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import { Calendar, Clock, Maximize, Minimize, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

// Define the Security type exactly as it's defined in SecuritiesSearch.tsx
interface Security {
  symbol: string;
  name: string;
  type: string; // e.g., "equity", "fno", "index"
}

// --- Utility Functions ---
const debounce = (func: Function, delay: number) => {
  let timeout: NodeJS.Timeout;
  return function executed(...args: any[]) {
    const context = this;
    const later = () => {
      timeout = setTimeout(() => func.apply(context, args), 0);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, delay);
  };
};

// --- Sample chart data generation (for demonstration) ---
const generateCandlestickData = (days: number = 50) => {
  const data = [];
  const today = new Date();
  let price = 18500 + Math.random() * 500;

  for (let i = days; i > 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const volatility = Math.random() * 2 + 0.1;
    const open = price;
    const high = open + Math.random() * 100 * volatility;
    const low = Math.max(open - Math.random() * 100 * volatility, open * 0.95);
    const close =
      Math.random() > 0.5
        ? open + Math.random() * (high - open)
        : open - Math.random() * (open - low);

    data.push({
      time: date.toISOString().split("T")[0],
      open,
      high,
      low,
      close,
    });

    price = close;
  }
  return data;
};

// --- Sample symbols (static for chart data, but dynamic for search) ---
const chartSymbols = [
  { id: "NIFTY", name: "NIFTY Index", data: generateCandlestickData(60) },
  { id: "BANKNIFTY", name: "BANKNIFTY Index", data: generateCandlestickData(70) },
  { id: "RELIANCE", name: "Reliance Industries", data: generateCandlestickData(55) },
  { id: "TCS", name: "Tata Consultancy Services", data: generateCandlestickData(65) },
  { id: "HDFCBANK", name: "HDFC Bank", data: generateCandlestickData(75) },
  // Add some dummy entries that SecuritiesSearch might return but for which we don't have local chart data
  { id: "INFY", name: "Infosys Ltd", data: generateCandlestickData(50) },
  { id: "ICICIBANK", name: "ICICI Bank", data: generateCandlestickData(50) },
];

// --- Time intervals ---
const timeIntervals = [
  { value: "1m", label: "1 Minute" },
  { value: "5m", label: "5 Minutes" },
  { value: "15m", label: "15 Minutes" },
  { value: "30m", label: "30 Minutes" },
  { value: "1h", label: "1 Hour" },
  { value: "1d", label: "1 Day" },
  { value: "1w", label: "1 Week" },
  { value: "1M", label: "1 Month" },
];

const ChartPage = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const activeSeriesRef = useRef<ISeriesApi<any> | null>(null);
  const [activeSymbol, setActiveSymbol] = useState(chartSymbols[0]);
  const [selectedInterval, setSelectedInterval] = useState("1d");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartType, setChartType] = useState<"candle" | "line" | "area">("candle");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Chart initialization and update logic
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = debounce(() => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: isFullscreen ? window.innerHeight - 20 : (isMobile ? 400 : 500),
        });
        chartRef.current.timeScale().fitContent();
      }
    }, 100);

    if (!chartRef.current) {
      chartRef.current = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "#ffffff" },
          textColor: "#333",
        },
        width: chartContainerRef.current.clientWidth,
        height: isMobile ? 400 : 500,
        grid: {
          vertLines: { color: "#f0f3fa" },
          horzLines: { color: "#f0f3fa" },
        },
        rightPriceScale: {
          visible: true,
          borderColor: '#d1d4dc',
        },
        timeScale: {
          visible: true,
          borderColor: '#d1d4dc',
          timeVisible: true,
          secondsVisible: false,
        },
        crosshair: {
          mode: 0, // CrosshairMode.Normal
        },
      });
    }

    const loadChartData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = activeSymbol.data;

        if (!data || data.length === 0) {
          throw new Error(`No data available for ${activeSymbol.name} with interval ${selectedInterval}.`);
        }

        if (activeSeriesRef.current) {
          chartRef.current?.removeSeries(activeSeriesRef.current);
          activeSeriesRef.current = null;
        }

        let series: ISeriesApi<any>;
        switch (chartType) {
          case "line":
            series = chartRef.current.addLineSeries({
              color: "#2962FF",
              lineWidth: 2,
            });
            series.setData(data.map((item) => ({ time: item.time, value: item.close })));
            break;
          case "area":
            series = chartRef.current.addAreaSeries({
              topColor: "rgba(41, 98, 255, 0.4)",
              bottomColor: "rgba(41, 98, 255, 0.1)",
              lineColor: "rgba(41, 98, 255, 1)",
              lineWidth: 2,
            });
            series.setData(data.map((item) => ({ time: item.time, value: item.close })));
            break;
          case "candle":
          default:
            series = chartRef.current.addCandlestickSeries({
              upColor: "#26a69a",
              downColor: "#ef5350",
              borderVisible: false,
              wickUpColor: "#26a69a",
              wickDownColor: "#ef5350",
            });
            series.setData(data);
            break;
        }

        activeSeriesRef.current = series;
        chartRef.current.timeScale().fitContent();
        setLastUpdated(new Date());
      } catch (err: any) {
        setError(err.message);
        toast({
          title: "Chart Load Error",
          description: err.message || "Failed to load chart data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadChartData();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [activeSymbol, chartType, selectedInterval, isFullscreen, isMobile, toast]);

  // Callback for when a security is selected from the SecuritiesSearch component
  const handleSecuritySelect = useCallback((security: Security) => {
    const selectedSymbolData = chartSymbols.find((s) => s.id === security.symbol);

    if (selectedSymbolData) {
      setActiveSymbol(selectedSymbolData);
      toast({
        title: "Chart Updated",
        description: `Showing chart for ${selectedSymbolData.name} (${security.type})`,
      });
    } else {
      setActiveSymbol({
        id: security.symbol,
        name: security.name,
        data: generateCandlestickData(5),
      });
      toast({
        title: "Data Not Found (Sample)",
        description: `Chart data for ${security.name} (${security.symbol}) is not available in sample data. Generating placeholder.`,
        variant: "warning",
      });
    }
    setLastUpdated(new Date());
  }, [toast]);

  const handleChartTypeChange = useCallback((type: "candle" | "line" | "area") => {
    setChartType(type);
    toast({
      title: "Chart Type Changed",
      description: `Displaying chart as ${type} type.`,
    });
  }, [toast]);

  const handleIntervalChange = useCallback((interval: string) => {
    setSelectedInterval(interval);
    toast({
      title: "Time Interval Changed",
      description: `Chart interval set to ${interval}. (Data regeneration simulated)`,
    });
  }, [toast]);

  const toggleFullscreen = useCallback(() => {
    if (!chartContainerRef.current) return;
    if (!document.fullscreenElement) {
      chartContainerRef.current.requestFullscreen().catch((err) => {
        toast({
          title: "Fullscreen Error",
          description: `Error attempting to enable full-screen mode: ${err.message}`,
          variant: "destructive",
        });
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch((err) => {
        toast({
          title: "Fullscreen Error",
          description: `Error attempting to exit full-screen mode: ${err.message}`,
          variant: "destructive",
        });
      });
      setIsFullscreen(false);
    }
  }, [toast]);

  useEffect(() => {
    const fullscreenChangeHandler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', fullscreenChangeHandler);
    return () => {
      document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
    };
  }, []);

  const resetChart = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
      toast({
        title: "Chart Reset",
        description: "Chart view has been reset to fit content.",
      });
    }
  }, [toast]);

  const refreshData = useCallback(() => {
    setActiveSymbol({ ...activeSymbol });
    setLastUpdated(new Date());
    toast({
      title: "Data Refreshed",
      description: "Attempting to refresh chart data.",
    });
  }, [activeSymbol, toast]);

  return (
    // REMOVED THE DashboardLayout WRAPPER
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <Card className="p-4 md:p-6 shadow-lg rounded-lg">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
          {/* Securities Search */}
          <div className="w-full md:w-1/3">
            <SecuritiesSearch
              onSelect={handleSecuritySelect}
              placeholder="Search for stocks or indices..."
              segment="all"
            />
          </div>

          {/* Chart Controls */}
          <div className="flex flex-wrap items-center gap-2 md:gap-4 justify-center md:justify-end">
            {/* Interval Select */}
            <Select value={selectedInterval} onValueChange={handleIntervalChange}>
              <SelectTrigger className="w-[120px]">
                <Clock className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Interval" />
              </SelectTrigger>
              <SelectContent>
                {timeIntervals.map((interval) => (
                  <SelectItem key={interval.value} value={interval.value}>
                    {interval.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Chart Type Tabs */}
            <Tabs value={chartType} onValueChange={handleChartTypeChange as (value: string) => void}>
              <TabsList>
                <TabsTrigger value="candle">Candle</TabsTrigger>
                <TabsTrigger value="line">Line</TabsTrigger>
                <TabsTrigger value="area">Area</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Action Buttons */}
            <Button variant="outline" size="sm" onClick={resetChart} title="Reset Chart View">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={refreshData} title="Refresh Data">
              <RotateCcw className="h-4 w-4 rotate-180" />
            </Button>
            <Button variant="outline" size="sm" onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}>
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <div className="mb-2 text-sm text-gray-500 flex justify-between items-center">
          <span className="font-semibold text-lg text-primary">{activeSymbol.name}</span>
          <span>
            Last Updated:{" "}
            {lastUpdated.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </span>
        </div>

        {/* Chart Container */}
        <div
          ref={chartContainerRef}
          className={`w-full ${isFullscreen ? "h-screen-minus-header" : "h-[400px] md:h-[500px]"} relative`}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
              <Skeleton className="w-full h-full" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary font-semibold">
                Loading Chart...
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 bg-opacity-90 z-10 text-red-700 p-4 rounded-lg text-center">
              <p className="mb-4">Error loading chart: {error}</p>
              <Button onClick={refreshData}>Retry</Button>
            </div>
          )}
          {/* The chart will be rendered into chartContainerRef */}
        </div>
      </Card>
    </div>
  );
};

export default ChartPage;