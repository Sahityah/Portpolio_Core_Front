import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import {
  createChart,
  ColorType,
  IChartApi,
  SeriesOptionsMap,
  SeriesType,
} from "lightweight-charts";
import { Button } from "@/components/ui/button";
import { SecuritiesSearch } from "@/components/SecuritiesSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import { Calendar, Clock, Maximize, Minimize, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Tabs,
  TabsContent,
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

// Sample chart data
const generateCandlestickData = (days = 50) => {
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

// Sample symbols
const chartSymbols = [
  { id: "NIFTY", name: "NIFTY Index", data: generateCandlestickData() },
  { id: "BANKNIFTY", name: "BANKNIFTY Index", data: generateCandlestickData() },
  { id: "RELIANCE", name: "Reliance Industries", data: generateCandlestickData() },
  { id: "TCS", name: "Tata Consultancy Services", data: generateCandlestickData() },
  { id: "HDFCBANK", name: "HDFC Bank", data: generateCandlestickData() },
];

// Time intervals
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
  const activeSeriesRef = useRef<any>(null); // ✅ Track active series
  const [activeSymbol, setActiveSymbol] = useState(chartSymbols[0]);
  const [selectedInterval, setSelectedInterval] = useState("1d");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartType, setChartType] = useState<"candle" | "line" | "area">("candle");
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [lastUpdated, setLastUpdated] = useState(new Date());

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current?.clientWidth || 400,
        });
      }
    };

    if (!chartRef.current) {
      chartRef.current = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: "#ffffff" },
          textColor: "#333",
        },
        width: chartContainerRef.current.clientWidth,
        height: 500,
        grid: {
          vertLines: { color: "#f0f3fa" },
          horzLines: { color: "#f0f3fa" },
        },
      });
    }

    // ✅ Remove old series if exists
    if (activeSeriesRef.current) {
      chartRef.current.removeSeries(activeSeriesRef.current);
    }

    const data = activeSymbol.data;
    let series;

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

    // ✅ Track active series
    activeSeriesRef.current = series;

    chartRef.current.timeScale().fitContent();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [activeSymbol, chartType, selectedInterval]);

  const handleSecuritySelect = (security: any) => {
    const selectedSymbol = chartSymbols.find((s) => s.id === security.symbol);
    if (selectedSymbol) {
      setActiveSymbol(selectedSymbol);
      toast({
        title: "Chart Updated",
        description: `Showing chart for ${selectedSymbol.name}`,
      });
    }
    setLastUpdated(new Date());
  };

  const handleChartTypeChange = (type: "candle" | "line" | "area") => {
    setChartType(type);
  };

  const handleIntervalChange = (interval: string) => {
    setSelectedInterval(interval);
  };

  const toggleFullscreen = () => {
    if (!chartContainerRef.current) return;
    if (!isFullscreen) {
      chartContainerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const resetChart = () => {
    if (chartRef.current) {
      chartRef.current.timeScale().fitContent();
      toast({
        title: "Chart Reset",
        description: "Chart view has been reset",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        <div ref={chartContainerRef} className="w-full h-[500px] md:h-[600px]" />
      </div>
    </DashboardLayout>
  );
};

export default ChartPage;
