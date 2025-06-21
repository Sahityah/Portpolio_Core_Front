import React, { useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
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

// Mock positions data
const positionsData = [
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
];

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

const PositionsPage = () => {
  const [positions, setPositions] = useState<Position[]>(positionsData);
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

  // Filter positions based on search, status and segment
  const filteredPositions = positions.filter(position => {
    // Search filter
    const matchesSearch = 
      position.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.strike.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Status filter
    const matchesStatus = selectedStatus === "all" || position.status === selectedStatus;
    
    // Segment filter
    const matchesSegment = selectedSegment === "all" || position.segment === selectedSegment;
    
    return matchesSearch && matchesStatus && matchesSegment;
  });

  const handleSecuritySelect = (security: any) => {
    setNewPosition({
      ...newPosition,
      symbol: security.symbol,
      name: security.name,
      segment: security.type === 'equity' ? 'equity' : 'fno'
    });
    
    // Update position type based on selected security
    setPositionType(security.type === 'equity' ? 'equity' : 'fno');
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
      // Reset fields that differ between segment types
      strike: value === 'fno' ? '' : newPosition.strike,
      type: value === 'fno' ? '' : 'EQ'
    });
  };

  const handleAddPosition = async () => {
    // Validate required fields
    if (!newPosition.symbol || !newPosition.qty || !newPosition.entryPrice) {
      toast({
        title: "Missing information",
        description: "Please fill all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create new position object
      const position: Position = {
        id: `pos${positions.length + 1}`,
        symbol: newPosition.symbol,
        strike: positionType === 'equity' ? newPosition.entryPrice : newPosition.strike,
        type: positionType === 'equity' ? 'EQ' : (newPosition.type || 'CALL'),
        segment: positionType,
        qty: parseInt(newPosition.qty),
        entryPrice: parseFloat(newPosition.entryPrice),
        ltp: parseFloat(newPosition.entryPrice), // Assume same as entry price initially
        pnl: 0, // Initial P&L is zero
        mtm: parseFloat(newPosition.entryPrice) * parseInt(newPosition.qty),
        status: "active"
      };

      // Add to positions list
      setPositions([position, ...positions]);
      
      // Close dialog and reset form
      setIsNewPositionDialogOpen(false);
      setNewPosition({
        symbol: "",
        name: "",
        type: "",
        segment: "equity",
        strike: "",
        qty: "",
        entryPrice: ""
      });
      
      toast({
        title: "Position added",
        description: `${position.symbol} ${position.type} position has been added successfully`,
      });
    } catch (error) {
      toast({
        title: "Failed to add position",
        description: "An error occurred while adding the position",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
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
                  {filteredPositions.length > 0 ? (
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
          <Dialog open={isNewPositionDialogOpen} onOpenChange={setIsNewPositionDialogOpen}>
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
                      <Select onValueChange={value => setNewPosition({...newPosition, type: value})}>
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
    </DashboardLayout>
  );
};

export default PositionsPage;