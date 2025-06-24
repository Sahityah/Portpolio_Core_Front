import { useEffect, useRef, useState, useCallback } from "react";
import { Card } from "@/components/ui/card"; // Keeping existing alias as it seems to resolve
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
} from "lightweight-charts"; // Keeping direct import as it's an external library
import { Button } from "@/components/ui/button"; // Keeping existing alias
import { SecuritiesSearch } from "@/components/SecuritiesSearch"; // Adjusted to absolute path from /src
import { useIsMobile } from "@/hooks/use-mobile"; // Keeping existing alias
import { Calendar, Clock, Maximize, Minimize, RotateCcw, Loader2 } from "lucide-react"; // Added Loader2 import explicitly
import { useToast } from "@/hooks/use-toast"; // Keeping existing alias
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"; // Keeping existing alias
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Keeping existing alias
import { Skeleton } from "@/components/ui/skeleton"; // Keeping existing alias
import { AxiosResponse } from 'axios'; // Keeping direct import

// Define the Security type exactly as it's defined in SecuritiesSearch.tsx
interface Security {
  symbol: string;
  name: string;
  type: string; // e.g., "equity", "fno", "index"
}

// Define the structure of candlestick data points expected from the API
interface CandlestickDataPoint {
  time: string; // ISO string format for date (e.g., "YYYY-MM-DD")
  open: number;
  high: number;
  low: number;
  close: number;
}

// --- Utility Functions ---
// Debounce function to limit the rate at which a function can fire.
const debounce = (func: Function, delay: number) => {
  let timeout: any; // Changed type to 'any' for broader compatibility with NodeJS.Timeout in some environments
  return function executed(...args: any[]) {
    const context = this;
    const later = () => {
      clearTimeout(timeout); // Clear previous timeout immediately
      timeout = setTimeout(() => func.apply(context, args), 0); // Execute after 0ms, allowing batching
    };
    clearTimeout(timeout); // Clear any existing timeout on new call
    timeout = setTimeout(later, delay); // Set new timeout
  };
};


// --- Sample symbols (static for chart data, but dynamic for search) ---
// This list will be used for initial activeSymbol state and possibly for SecuritiesSearch suggestions.
// The 'data' property is removed as it will now be fetched dynamically via API.
const chartSymbols: Security[] = [
  { symbol: "NIFTY", name: "NIFTY Index", type: "index" },
  { symbol: "BANKNIFTY", name: "BANKNIFTY Index", type: "index" },
  { symbol: "RELIANCE", name: "Reliance Industries", type: "equity" },
  { symbol: "TCS", name: "Tata Consultancy Services", type: "equity" },
  { symbol: "HDFCBANK", name: "HDFC Bank", type: "equity" },
  { symbol: "INFY", name: "Infosys Ltd", type: "equity" },
  { symbol: "ICICIBANK", name: "ICICI Bank", type: "equity" },
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

// --- Import the API services and define a local interface for marketApi ---
// This interface helps TypeScript understand the methods available on 'marketApi'
// if the original declaration is incomplete in your project's lib/api.ts.
// It assumes marketApi is an object with these methods returning AxiosResponses.
interface IMarketApi {
  getChartData: (symbol: string, interval: string) => Promise<AxiosResponse<CandlestickDataPoint[]>>;
  // Assuming searchSecurities exists on marketApi, define it here if needed by other components
  searchSecurities?: (query: string, segment: string) => Promise<AxiosResponse<Security[]>>;
}

// Cast the imported marketApi to the custom interface
// This is a workaround to resolve compilation errors if the original type definition is missing methods or has incorrect signatures.
// If your actual marketApi object at runtime does NOT have these methods or their expected behavior,
// this will lead to runtime errors instead of compilation errors.
import { marketApi as originalMarketApi } from "@/lib/api"; // Adjusted to absolute path from /src
const marketApi: IMarketApi = originalMarketApi as IMarketApi;


const ChartPage = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const activeSeriesRef = useRef<ISeriesApi<any> | null>(null);

  // Initialize activeSymbol with the first item from chartSymbols
  const [activeSymbol, setActiveSymbol] = useState<Security>(chartSymbols[0]);
  const [selectedInterval, setSelectedInterval] = useState("1d");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartType, setChartType] = useState<"candle" | "line" | "area">("candle");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // --- Fetch Chart Data from API ---
  const fetchChartData = useCallback(async () => {
    // Ensure we have a chart instance, a symbol, and an interval before fetching
    if (!chartRef.current || !activeSymbol?.symbol || !selectedInterval) {
      setIsLoading(false); // Turn off loading if pre-conditions aren't met
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Call the marketApi to get chart data
      const response = await marketApi.getChartData(activeSymbol.symbol, selectedInterval);
      const data: CandlestickDataPoint[] = response.data; // Cast response data to expected type

      if (!data || data.length === 0) {
        setError("No chart data available for the selected symbol and interval.");
        // If no data, ensure existing series is removed
        if (activeSeriesRef.current) {
            chartRef.current?.removeSeries(activeSeriesRef.current);
            activeSeriesRef.current = null;
        }
        return;
      }

      // Remove existing series before adding a new one to prevent conflicts
      if (activeSeriesRef.current) {
        chartRef.current?.removeSeries(activeSeriesRef.current);
        activeSeriesRef.current = null;
      }

      let newSeries: ISeriesApi<any>;
      switch (chartType) {
        case "line":
          newSeries = chartRef.current.addLineSeries({
            color: "#2962FF", // A vibrant blue
            lineWidth: 2,
          });
          // For line chart, only 'time' and 'value' (closing price) are needed
          newSeries.setData(data.map((item) => ({ time: item.time, value: item.close })));
          break;
        case "area":
          newSeries = chartRef.current.addAreaSeries({
            topColor: "rgba(41, 98, 255, 0.4)",    // Light blue top fill
            bottomColor: "rgba(41, 98, 255, 0.1)", // Even lighter blue bottom fill
            lineColor: "rgba(41, 98, 255, 1)",    // Solid blue line
            lineWidth: 2,
          });
          // For area chart, also only 'time' and 'value' (closing price) are needed
          newSeries.setData(data.map((item) => ({ time: item.time, value: item.close })));
          break;
        case "candle":
        default:
          newSeries = chartRef.current.addCandlestickSeries({
            upColor: "#26a69a",   // Green for up candles
            downColor: "#ef5350", // Red for down candles
            borderVisible: false, // No border around candles
            wickUpColor: "#26a69a",   // Green for up wicks
            wickDownColor: "#ef5350", // Red for down wicks
          });
          // For candlestick chart, the full OHLCV data is needed
          newSeries.setData(data);
          break;
      }

      activeSeriesRef.current = newSeries; // Store the active series reference
      chartRef.current.timeScale().fitContent(); // Adjust chart to fit all data
      setLastUpdated(new Date()); // Update last updated timestamp
    } catch (err: any) {
      console.error("Error fetching chart data:", err);
      // Construct a user-friendly error message
      const errorMessage = err.response?.data?.message || err.message || "Failed to load chart data. Please try again.";
      setError(errorMessage);
      toast({
        title: "Chart Load Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false); // Always turn off loading at the end
    }
  }, [activeSymbol, selectedInterval, chartType, toast]); // Dependencies for useCallback: re-run if these states change

  // Effect for chart initialization and data loading/reloading
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Handle chart resizing (debounced)
    const handleResize = debounce(() => {
      if (chartRef.current && chartContainerRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: isFullscreen ? window.innerHeight - 20 : (isMobile ? 400 : 500),
        });
        chartRef.current.timeScale().fitContent();
      }
    }, 100);

    // Initialize chart if it doesn't exist
    if (!chartRef.current) {
      chartRef.current = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "#ffffff" }, // White background
          textColor: "#333", // Dark grey text
        },
        width: chartContainerRef.current.clientWidth,
        height: isMobile ? 400 : 500, // Responsive height
        grid: {
          vertLines: { color: "#f0f3fa" }, // Light grey vertical grid lines
          horzLines: { color: "#f0f3fa" }, // Light grey horizontal grid lines
        },
        rightPriceScale: {
          visible: true,
          borderColor: '#d1d4dc', // Light grey border for price scale
        },
        timeScale: {
          visible: true,
          borderColor: '#d1d4dc', // Light grey border for time scale
          timeVisible: true,
          secondsVisible: false, // Hide seconds on time scale
        },
        crosshair: {
          mode: 0, // CrosshairMode.Normal - follows mouse
        },
      });
    }

    // Call fetchChartData whenever dependencies (activeSymbol, selectedInterval, chartType) change
    // This will handle initial load and subsequent reloads due to user interaction
    fetchChartData();

    // Add event listener for window resize
    window.addEventListener("resize", handleResize);

    // Cleanup function for useEffect
    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove(); // Dispose of the chart instance
        chartRef.current = null;
      }
    };
  }, [fetchChartData, isFullscreen, isMobile]); // fetchChartData is a dependency because it's called inside,
                                              // isFullscreen and isMobile affect chart dimensions.

  // Callback for when a security is selected from the SecuritiesSearch component
  const handleSecuritySelect = useCallback((security: Security) => {
    setActiveSymbol(security); // Set the active symbol to the selected security object
    toast({
      title: "Chart Updated",
      description: `Showing chart for ${security.name} (${security.symbol})`,
    });
    // fetchChartData will be triggered by the useEffect due to activeSymbol change
  }, [toast]);

  // Handler for changing chart type (Candle, Line, Area)
  const handleChartTypeChange = useCallback((type: "candle" | "line" | "area") => {
    setChartType(type); // Update chart type state
    toast({
      title: "Chart Type Changed",
      description: `Displaying chart as ${type} type.`,
    });
    // fetchChartData will be triggered by the useEffect due to chartType change
  }, [toast]);

  // Handler for changing time interval
  const handleIntervalChange = useCallback((interval: string) => {
    setSelectedInterval(interval); // Update interval state
    toast({
      title: "Time Interval Changed",
      description: `Chart interval set to ${interval}.`,
    });
    // fetchChartData will be triggered by the useEffect due to selectedInterval change
  }, [toast]);

  // Toggle fullscreen mode for the chart container
  const toggleFullscreen = useCallback(() => {
    if (!chartContainerRef.current) return;
    if (!document.fullscreenElement) {
      // Enter fullscreen
      chartContainerRef.current.requestFullscreen().catch((err) => {
        toast({
          title: "Fullscreen Error",
          description: `Error attempting to enable full-screen mode: ${err.message}`,
          variant: "destructive",
        });
      });
      setIsFullscreen(true);
    } else {
      // Exit fullscreen
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

  // Effect to sync fullscreen state with browser's fullscreen API
  useEffect(() => {
    const fullscreenChangeHandler = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', fullscreenChangeHandler);
    return () => {
      document.removeEventListener('fullscreenchange', fullscreenChangeHandler);
    };
  }, []);

  // Reset chart view to fit all content
  const resetChart = useCallback(() => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
      toast({
        title: "Chart Reset",
        description: "Chart view has been reset to fit content.",
      });
    }
  }, [toast]);

  // Manually refresh chart data
  const refreshData = useCallback(() => {
    fetchChartData(); // Simply re-trigger the data fetch
    setLastUpdated(new Date()); // Update the last updated timestamp immediately
    toast({
      title: "Data Refreshed",
      description: "Attempting to refresh chart data.",
    });
  }, [fetchChartData, toast]); // Depends on fetchChartData

  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl font-inter">
      <Card className="p-4 md:p-6 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
          {/* Securities Search */}
          <div className="w-full md:w-1/3">
            <SecuritiesSearch
              onSelect={handleSecuritySelect}
              placeholder="Search for stocks or indices..."
              segment="all" // Assuming SecuritiesSearch can handle 'all' segments
            />
          </div>

          {/* Chart Controls */}
          <div className="flex flex-wrap items-center gap-2 md:gap-4 justify-center md:justify-end">
            {/* Interval Select */}
            <Select value={selectedInterval} onValueChange={handleIntervalChange}>
              <SelectTrigger className="w-[120px] rounded-md shadow-sm">
                <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
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
              <TabsList className="bg-gray-100 dark:bg-gray-800 rounded-md shadow-sm">
                <TabsTrigger value="candle" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-md transition-colors">Candle</TabsTrigger>
                <TabsTrigger value="line" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-md transition-colors">Line</TabsTrigger>
                <TabsTrigger value="area" className="data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-md transition-colors">Area</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Action Buttons */}
            <Button variant="outline" size="sm" onClick={resetChart} title="Reset Chart View" className="rounded-md shadow-sm transition-all duration-200 ease-in-out hover:scale-105">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={refreshData} title="Refresh Data" className="rounded-md shadow-sm transition-all duration-200 ease-in-out hover:scale-105">
              <RotateCcw className="h-4 w-4 rotate-180" /> {/* Rotated icon for refresh */}
            </Button>
            <Button variant="outline" size="sm" onClick={toggleFullscreen} title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"} className="rounded-md shadow-sm transition-all duration-200 ease-in-out hover:scale-105">
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Current Symbol and Last Updated Info */}
        <div className="mb-2 text-sm text-gray-500 flex flex-col sm:flex-row justify-between items-center gap-1 sm:gap-4">
          <span className="font-semibold text-lg text-gray-900 dark:text-gray-100">{activeSymbol.name} ({activeSymbol.symbol})</span>
          <span className="text-sm">
            Last Updated:{" "}
            <span className="font-medium">
              {lastUpdated.toLocaleTimeString("en-IN", { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
          </span>
        </div>

        {/* Chart Container */}
        <div
          ref={chartContainerRef}
          className={`w-full ${isFullscreen ? "h-screen-minus-header" : "h-[400px] md:h-[500px]"} relative bg-gray-50 dark:bg-gray-900 rounded-md overflow-hidden`}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10 rounded-md">
              <Skeleton className="w-full h-full absolute inset-0" /> {/* Full-size skeleton */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500 font-semibold flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                Loading Chart...
              </div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-50 dark:bg-red-950 bg-opacity-90 z-10 text-red-700 dark:text-red-300 p-4 rounded-lg text-center">
              <p className="mb-4 text-base font-medium">Error loading chart: {error}</p>
              <Button onClick={refreshData} variant="secondary" className="rounded-md shadow-sm">Retry</Button>
            </div>
          )}
          {/* The Lightweight Chart will be rendered into this div by the useEffect */}
        </div>
      </Card>
    </div>
  );
};

export default ChartPage;
