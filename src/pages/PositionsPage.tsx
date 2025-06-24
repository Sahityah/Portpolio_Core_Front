import React, { useState, useEffect, useCallback } from "react";
// import DashboardLayout from "@/components/layout/DashboardLayout"; // <--- REMOVE THIS IMPORT
import { Card } from "@/components/ui/card";
import { TableHead, TableRow, TableHeader, TableCell, TableBody, Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter } from "lucide-react";
import { formatCurrency } from "@/lib/currency";
import { SecuritiesSearch } from "@/components/SecuritiesSearch";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { ReportDownload } from "@/components/ReportDownload";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Define the Position interface
interface Position {
  id: string;
  symbol: string;
  strike: string;
  type: string;
  segment: string;
  qty: number;
  entryPrice: number;
  ltp: number;
  pnl: number;
  mtm: number;
  status: string;
}

// Mock API functions (replace with actual fetch calls)
const API_BASE_URL = "/api"; // Replace with your actual backend API base URL

const fetchPositionsFromBackend = async (): Promise<Position[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  const mockData = [
    {
      id: "pos1", symbol: "NIFTY", strike: "18000 CE", type: "CALL", segment: "fno",
      qty: 75, entryPrice: 12050, ltp: 13725, pnl: 125625, mtm: 125625, status: "active"
    },
    {
      id: "pos2", symbol: "BANKNIFTY", strike: "44000 PUT", type: "PUT", segment: "fno",
      qty: 75, entryPrice: 13750, ltp: 13725, pnl: 405000, mtm: 15255, status: "active"
    },
    {
      id: "pos3", symbol: "RELIANCE", strike: "2400", type: "EQ", segment: "equity",
      qty: 50, entryPrice: 2385.5, ltp: 2450.75, pnl: 326250, mtm: 13660, status: "active"
    },
    {
      id: "pos4", symbol: "TATAMOTOR", strike: "675", type: "EQ", segment: "equity",
      qty: 100, entryPrice: 635.55, ltp: 622.15, pnl: -133000, mtm: 62215, status: "closed"
    },
    {
      id: "pos5", symbol: "INFY", strike: "1480", type: "EQ", segment: "equity",
      qty: 75, entryPrice: 1500.05, ltp: 1474.45, pnl: -191250, mtm: 110584, status: "active"
    }
  ];
  return mockData;
};

const addPositionToBackend = async (newPositionData: Omit<Position, 'id' | 'pnl' | 'ltp' | 'mtm' | 'status'>): Promise<Position> => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  const newId = `pos${Math.random().toString(36).substring(2, 9)}`;
  const ltp = newPositionData.entryPrice;
  const mtm = newPositionData.entryPrice * newPositionData.qty;
  return {
    id: newId,
    ...newPositionData,
    ltp: ltp,
    pnl: 0,
    mtm: mtm,
    status: "active"
  };
};

const PositionsPage = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSegment, setSelectedSegment] = useState("all");
  const [isNewPositionDialogOpen, setIsNewPositionDialogOpen] = useState(false);
  const [newPosition, setNewPosition] = useState({
    symbol: "",
    name: "",
    type: "",
    segment: "equity",
    strike: "",
    qty: "",
    entryPrice: ""
  });
  const [positionType, setPositionType] = useState("equity");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMobile = useIsMobile();
  const { toast } = useToast();

  const fetchPositions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPositionsFromBackend();
      setPositions(data);
    } catch (err) {
      console.error("Failed to fetch positions:", err);
      setError("Failed to load positions. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load positions.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]);

  const filteredPositions = positions.filter(position => {
    const matchesSearch =
      position.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (position.strike && position.strike.toLowerCase().includes(searchTerm.toLowerCase())) ||
      position.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === "all" || position.status === selectedStatus;
    const matchesSegment = selectedSegment === "all" || position.segment === selectedSegment;

    return matchesSearch && matchesStatus && matchesSegment;
  });

  const handleSecuritySelect = (security: { symbol: string; name: string; type: 'equity' | 'fno' }) => {
    setNewPosition({
      ...newPosition,
      symbol: security.symbol,
      name: security.name,
      segment: security.type === 'equity' ? 'equity' : 'fno',
      type: security.type === 'equity' ? 'EQ' : newPosition.type
    });
    setPositionType(security.type);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPosition({
      ...newPosition,
      [name]: value
    });
  };

  const handleSegmentChange = (value: string) => {
    setPositionType(value);
    setNewPosition({
      ...newPosition,
      segment: value,
      strike: value === 'fno' ? '' : '',
      type: value === 'fno' ? '' : 'EQ'
    });
  };

  const resetNewPositionForm = () => {
    setNewPosition({
      symbol: "",
      name: "",
      type: "",
      segment: "equity",
      strike: "",
      qty: "",
      entryPrice: ""
    });
    setPositionType("equity");
  };

  const handleAddPosition = async () => {
    if (!newPosition.symbol || !newPosition.qty || !newPosition.entryPrice) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    if (positionType === 'fno' && (!newPosition.type || !newPosition.strike)) {
        toast({
            title: "Missing F&O details",
            description: "Please select option type and enter strike price for F&O positions.",
            variant: "destructive"
        });
        return;
    }

    setIsSubmitting(true);

    try {
      const positionToAdd: Omit<Position, 'id' | 'pnl' | 'ltp' | 'mtm' | 'status'> = {
        symbol: newPosition.symbol,
        strike: positionType === 'equity' ? String(newPosition.entryPrice) : newPosition.strike,
        type: positionType === 'equity' ? 'EQ' : newPosition.type,
        segment: positionType,
        qty: parseInt(newPosition.qty),
        entryPrice: parseFloat(newPosition.entryPrice),
      };

      const addedPosition = await addPositionToBackend(positionToAdd);

      setPositions((prevPositions) => [addedPosition, ...prevPositions]);
      setIsNewPositionDialogOpen(false);
      resetNewPositionForm();

      toast({
        title: "Position added",
        description: `${addedPosition.symbol} ${addedPosition.type} position has been added successfully`,
      });
    } catch (error: any) {
      console.error("Error adding position:", error);
      toast({
        title: "Failed to add position",
        description: error.message || "An error occurred while adding the position",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // <DashboardLayout>  <--- REMOVE THIS LINE
      <div className="container mx-auto py-6 px-4 md:px-6 max-w-7xl">
        <div className="flex flex-col space-y-6">
          {/* Header and Filters */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h1 className="text-2xl font-bold">Positions</h1>

            <div className="flex flex-col md:flex-row gap-4 md:items-center">
              {/* Search */}
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search positions..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status filter */}
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue placeholder="Filter by status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Positions</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="closed">Closed Only</SelectItem>
                </SelectContent>
              </Select>

              {/* Add new button */}
              <Button className="w-full md:w-auto" onClick={() => setIsNewPositionDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                New Position
              </Button>
            </div>
          </div>

          {/* Segment Tabs */}
          <Tabs defaultValue="all" onValueChange={setSelectedSegment}>
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="equity">Equity</TabsTrigger>
              <TabsTrigger value="fno">F&O</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Positions Table */}
          <Card className="portfolio-card">
            <div className="flex justify-between items-center mb-4 px-4 pt-4">
              <h2 className="text-lg font-semibold">
                {selectedSegment === 'all'
                  ? 'All Positions'
                  : selectedSegment === 'equity'
                    ? 'Equity Positions'
                    : 'F&O Positions'}
              </h2>

              {/* Report Download Component */}
              <ReportDownload positions={filteredPositions} />
            </div>

            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Strike/Price</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Entry Price</TableHead>
                    <TableHead>LTP</TableHead>
                    <TableHead>P&L</TableHead>
                    <TableHead>MTM</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        Loading positions...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-red-500">
                        {error}
                      </TableCell>
                    </TableRow>
                  ) : filteredPositions.length > 0 ? (
                    filteredPositions.map((position) => (
                      <TableRow key={position.id} className="position-row">
                        <TableCell className="font-medium">{position.symbol}</TableCell>
                        <TableCell>{position.strike}</TableCell>
                        <TableCell>{position.type}</TableCell>
                        <TableCell>
                          <Badge variant={position.segment === "equity" ? "outline" : "secondary"}>
                            {position.segment === "equity" ? "Equity" : "F&O"}
                          </Badge>
                        </TableCell>
                        <TableCell>{position.qty}</TableCell>
                        <TableCell>{formatCurrency(position.entryPrice)}</TableCell>
                        <TableCell>{formatCurrency(position.ltp)}</TableCell>
                        <TableCell className={position.pnl >= 0 ? "text-green-600" : "text-red-600"}>
                          {position.pnl >= 0 ? "+" : ""}{formatCurrency(position.pnl)}
                        </TableCell>
                        <TableCell>{formatCurrency(position.mtm)}</TableCell>
                        <TableCell>
                          <Badge variant={position.status === "active" ? "default" : "secondary"}>
                            {position.status === "active" ? "Active" : "Closed"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        No positions found matching your filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Summary statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="stat-card">
              <h3 className="text-sm font-medium text-muted-foreground">Total Positions</h3>
              <div className="mt-2 text-2xl font-bold">{filteredPositions.length}</div>
            </Card>

            <Card className="stat-card">
              <h3 className="text-sm font-medium text-muted-foreground">Total P&L</h3>
              <div className={`mt-2 text-2xl font-bold ${
                filteredPositions.reduce((sum, pos) => sum + pos.pnl, 0) >= 0
                  ? "text-green-600"
                  : "text-red-600"
              }`}>
                {formatCurrency(filteredPositions.reduce((sum, pos) => sum + pos.pnl, 0))}
              </div>
            </Card>

            <Card className="stat-card">
              <h3 className="text-sm font-medium text-muted-foreground">Active Positions</h3>
              <div className="mt-2 text-2xl font-bold">
                {filteredPositions.filter(p => p.status === "active").length}
              </div>
            </Card>
          </div>

          {/* New Position Dialog */}
          <Dialog open={isNewPositionDialogOpen} onOpenChange={(open) => {
            setIsNewPositionDialogOpen(open);
            if (!open) {
              resetNewPositionForm();
            }
          }}>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Add New Position</DialogTitle>
                <DialogDescription>
                  Enter the details of your new position below.
                </DialogDescription>
              </DialogHeader>

              <div className="grid gap-4 py-4">
                {/* Position Type Selection */}
                <div className="grid gap-2">
                  <Label>Position Type</Label>
                  <RadioGroup
                    value={positionType}
                    onValueChange={handleSegmentChange}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="equity" id="equity" />
                      <Label htmlFor="equity" className="cursor-pointer">Equity</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="fno" id="fno" />
                      <Label htmlFor="fno" className="cursor-pointer">F&O</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Security Search */}
                <div className="grid gap-2">
                  <Label>Security</Label>
                  <SecuritiesSearch
                    onSelect={handleSecuritySelect}
                    segment={positionType === 'equity' ? 'equity' : 'fno'}
                    placeholder="Search for securities..."
                  />
                  {newPosition.name && (
                    <p className="text-sm text-muted-foreground mt-1">{newPosition.name}</p>
                  )}
                </div>

                {/* F&O Specific Fields */}
                {positionType === 'fno' && (
                  <>
                    <div className="grid gap-2">
                      <Label htmlFor="type">Option Type</Label>
                      <Select onValueChange={value => setNewPosition({ ...newPosition, type: value })} value={newPosition.type}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select option type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CALL">Call Option</SelectItem>
                          <SelectItem value="PUT">Put Option</SelectItem>
                          <SelectItem value="FUT">Future</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="strike">Strike Price</Label>
                      <Input
                        id="strike"
                        name="strike"
                        placeholder="e.g. 18000"
                        value={newPosition.strike}
                        onChange={handleInputChange}
                        type="number"
                      />
                    </div>
                  </>
                )}

                {/* Common Fields */}
                <div className="grid gap-2">
                  <Label htmlFor="qty">Quantity</Label>
                  <Input
                    id="qty"
                    name="qty"
                    type="number"
                    placeholder="e.g. 100"
                    value={newPosition.qty}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="entryPrice">Entry Price (₹)</Label>
                  <Input
                    id="entryPrice"
                    name="entryPrice"
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1250.75"
                    value={newPosition.entryPrice}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsNewPositionDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPosition} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 mr-2 border-2 border-r-transparent border-white rounded-full animate-spin"></div>
                      Adding...
                    </>
                  ) : (
                    <>Add Position</>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    // </DashboardLayout> <--- REMOVE THIS LINE
  );
};

export default PositionsPage;