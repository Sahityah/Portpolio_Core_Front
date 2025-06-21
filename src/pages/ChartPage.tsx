import { useEffect, useRef, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { createChart, ColorType, IChartApi, SeriesOptionsMap, SeriesType } from "lightweight-charts";
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

// Sample chart data - in a real app, this would come from an API
const generateCandlestickData = (days = 50) => {
  const data = [];
  const today = new Date();
  let price = 18500 + Math.random() * 500;
  
  for (let i = days; i > 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    const volatility = (Math.random() * 2) + 0.1;
    const open = price;
    const high = open + (Math.random() * 100 * volatility);
    const low = Math.max(open - (Math.random() * 100 * volatility), open * 0.95);
    const close = Math.random() > 0.5 
      ? open + (Math.random() * (high - open))
      : open - (Math.random() * (open - low));
    
    data.push({
      time: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close
    });
    
    price = close;
  }
  
  return data;
};

// Sample symbols with data
const chartSymbols = [
  { id: 'NIFTY', name: 'NIFTY Index', data: generateCandlestickData() },
  { id: 'BANKNIFTY', name: 'BANKNIFTY Index', data: generateCandlestickData() },
  { id: 'RELIANCE', name: 'Reliance Industries', data: generateCandlestickData() },
  { id: 'TCS', name: 'Tata Consultancy Services', data: generateCandlestickData() },
  { id: 'HDFCBANK', name: 'HDFC Bank', data: generateCandlestickData() },
];

// Time intervals
const timeIntervals = [
  { value: '1m', label: '1 Minute' },
  { value: '5m', label: '5 Minutes' },
  { value: '15m', label: '15 Minutes' },
  { value: '30m', label: '30 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '1d', label: '1 Day' },
  { value: '1w', label: '1 Week' },
  { value: '1M', label: '1 Month' }
];

const ChartPage = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [activeSymbol, setActiveSymbol] = useState(chartSymbols[0]);
  const [selectedInterval, setSelectedInterval] = useState('1d');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chartType, setChartType] = useState<'candle' | 'line' | 'area'>('candle');
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [lastUpdated, setLastUpdated] = useState(new Date());
  
  // Set up chart when component mounts or when dependencies change
  useEffect(() => {
    if (!chartContainerRef.current) return;
    
    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current?.clientWidth || 400 
        });
      }
    };
    
    // Initialize chart
    if (!chartRef.current) {
      chartRef.current = createChart(chartContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: '#ffffff' },
          textColor: '#333',
        },
        width: chartContainerRef.current.clientWidth,
        height: 500,
        timeScale: {
          timeVisible: selectedInterval !== '1d' && selectedInterval !== '1w' && selectedInterval !== '1M',
          secondsVisible: selectedInterval === '1m' || selectedInterval === '5m',
        },
        grid: {
          vertLines: { color: '#f0f3fa' },
          horzLines: { color: '#f0f3fa' },
        },
        rightPriceScale: {
          borderColor: '#dfe4ec',
        },
        handleScroll: { mouseWheel: true, pressedMouseMove: true },
        handleScale: { mouseWheel: true, pinch: true },
      });
    }
    
    // Add series based on chart type
    chartRef.current.removeSeries(chartRef.current.series());
    
    const data = activeSymbol.data;
    let series;
    
    switch (chartType) {
      case 'line':
        series = chartRef.current.addLineSeries({
          color: '#2962FF',
          lineWidth: 2,
          crosshairMarkerVisible: true,
          lastValueVisible: true,
          priceLineVisible: true,
        });
        series.setData(data.map(item => ({
          time: item.time,
          value: item.close,
        })));
        break;
      case 'area':
        series = chartRef.current.addAreaSeries({
          topColor: 'rgba(41, 98, 255, 0.4)',
          bottomColor: 'rgba(41, 98, 255, 0.1)',
          lineColor: 'rgba(41, 98, 255, 1)',
          lineWidth: 2,
        });
        series.setData(data.map(item => ({
          time: item.time,
          value: item.close,
        })));
        break;
      case 'candle':
      default:
        series = chartRef.current.addCandlestickSeries({
          upColor: '#26a69a',
          downColor: '#ef5350',
          borderVisible: false,
          wickUpColor: '#26a69a',
          wickDownColor: '#ef5350',
        });
        series.setData(data);
        break;
    }
    
    // Fit content
    chartRef.current.timeScale().fitContent();
    
    // Add event listeners
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [activeSymbol, chartType, selectedInterval]);

  // Handle security selection
  const handleSecuritySelect = (security: any) => {
    const selectedSymbol = chartSymbols.find(s => s.id === security.symbol);
    if (selectedSymbol) {
      setActiveSymbol(selectedSymbol);
      toast({
        title: "Chart Updated",
        description: `Showing chart for ${selectedSymbol.name}`,
      });
    } else {
      toast({
        title: "Symbol Not Found",
        description: "Chart data not available for this symbol",
        variant: "destructive"
      });
    }
    setLastUpdated(new Date());
  };
  
  // Handle chart type change
  const handleChartTypeChange = (type: 'candle' | 'line' | 'area') => {
    setChartType(type);
  };
  
  // Handle interval change
  const handleIntervalChange = (interval: string) => {
    setSelectedInterval(interval);
    toast({
      title: "Timeframe Changed",
      description: `Chart interval set to ${interval}`,
    });
  };
  
  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!chartContainerRef.current) return;
    
    if (!isFullscreen) {
      if (chartContainerRef.current.requestFullscreen) {
        chartContainerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    
    setIsFullscreen(!isFullscreen);
  };
  
  // Handle chart reset
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
      <div className="container mx-auto py-6 px-4 md:px-6 max-w-7xl">
        <div className="flex flex-col space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h1 className="text-2xl font-bold">Trading Charts</h1>
            
            <div className="w-full md:w-64">
              <SecuritiesSearch 
                onSelect={handleSecuritySelect} 
                placeholder="Search for symbols..."
              />
            </div>
          </div>
          
          {/* Chart Controls */}
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex flex-col md:flex-row gap-2">
              <Tabs 
                defaultValue="candle" 
                value={chartType}
                onValueChange={(value) => handleChartTypeChange(value as any)}
                className="w-full md:w-auto"
              >
                <TabsList className="grid grid-cols-3 w-full md:w-[320px]">
                  <TabsTrigger value="candle">Candlestick</TabsTrigger>
                  <TabsTrigger value="line">Line</TabsTrigger>
                  <TabsTrigger value="area">Area</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Select 
                value={selectedInterval} 
                onValueChange={handleIntervalChange}
              >
                <SelectTrigger className="w-full md:w-[120px]">
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
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={resetChart}>
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={toggleFullscreen}>
                {isFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* Symbol Info */}
          <Card className="p-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h2 className="text-xl font-bold">{activeSymbol.name}</h2>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {lastUpdated.toLocaleString('en-IN', {
                      dateStyle: 'medium',
                      timeStyle: 'medium'
                    })}
                  </span>
                </div>
              </div>
              
              <div className="mt-2 md:mt-0 flex flex-col items-start md:items-end">
                <div className="text-2xl font-bold">
                  ₹{activeSymbol.data[activeSymbol.data.length - 1].close.toFixed(2)}
                </div>
                <div className="text-green-600 text-sm">
                  +₹{(activeSymbol.data[activeSymbol.data.length - 1].close - 
                     activeSymbol.data[activeSymbol.data.length - 2].close).toFixed(2)} 
                  (+{((activeSymbol.data[activeSymbol.data.length - 1].close /
                     activeSymbol.data[activeSymbol.data.length - 2].close - 1) * 100).toFixed(2)}%)
                </div>
              </div>
            </div>
          </Card>
          
          {/* Chart Container */}
          <Card className="p-0 overflow-hidden">
            <div 
              ref={chartContainerRef}
              className="w-full h-[500px] md:h-[600px]"
            />
          </Card>
          
          {/* Market Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Volume</h3>
              <div className="mt-2 text-2xl font-bold">1,24,532</div>
              <div className="text-green-600 text-sm">+14.5% vs prev. day</div>
            </Card>
            
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">Day Range</h3>
              <div className="mt-2 text-lg">
                ₹{activeSymbol.data[activeSymbol.data.length - 1].low.toFixed(2)} - 
                ₹{activeSymbol.data[activeSymbol.data.length - 1].high.toFixed(2)}
              </div>
              <div className="mt-1 h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ 
                    width: `${((activeSymbol.data[activeSymbol.data.length - 1].close - 
                              activeSymbol.data[activeSymbol.data.length - 1].low) /
                              (activeSymbol.data[activeSymbol.data.length - 1].high - 
                               activeSymbol.data[activeSymbol.data.length - 1].low)) * 100}%` 
                  }}
                ></div>
              </div>
            </Card>
            
            <Card className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground">52-Week Range</h3>
              <div className="mt-2 text-lg">
                ₹{Math.min(...activeSymbol.data.map(d => d.low)).toFixed(2)} - 
                ₹{Math.max(...activeSymbol.data.map(d => d.high)).toFixed(2)}
              </div>
              <div className="mt-1 h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ 
                    width: `${((activeSymbol.data[activeSymbol.data.length - 1].close - 
                              Math.min(...activeSymbol.data.map(d => d.low))) /
                              (Math.max(...activeSymbol.data.map(d => d.high)) - 
                               Math.min(...activeSymbol.data.map(d => d.low)))) * 100}%` 
                  }}
                ></div>
              </div>
            </Card>
          </div>
          
          {/* Latest Updates */}
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Live Market Updates</h3>
            <p className="text-sm text-muted-foreground">
              <Clock className="inline h-3 w-3 mr-1" />
              Charts are updated in realtime during market hours (9:15 AM - 3:30 PM IST, Mon-Fri)
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Note: This is a demo with simulated data. In a production environment, real-time market data would be displayed.
            </p>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChartPage;