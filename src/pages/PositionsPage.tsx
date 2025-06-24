import React, { useState, useEffect, useCallback } from "react";
// import DashboardLayout from "@/components/layout/DashboardLayout"; // Uncomment if still needed
import { Card } from "@/components/ui/card";
import { TableHead, TableRow, TableHeader, TableCell, TableBody, Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, Loader2 } from "lucide-react"; // Import Loader2 for spinners
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

// Define the Position interface - ensure this matches your Spring backend's DTO/Entity
interface Position {
  id: string; // Assuming your backend provides an ID, e.g., UUID or auto-increment
  symbol: string;
  strike: string; // Can be string for F&O, or price for EQ, or empty
  type: string; // e.g., "CALL", "PUT", "FUT", "EQ"
  segment: string; // e.g., "fno", "equity"
  qty: number;
  entryPrice: number;
  ltp: number; // Last Traded Price
  pnl: number; // Profit & Loss
  mtm: number; // Mark-to-Market value
  status: string; // e.g., "active", "closed"
  // Add other fields if your backend returns them (e.g., 'userId', 'tradeDate', etc.)
}

// Define the Security type exactly as it's defined in SecuritiesSearch.tsx
interface Security {
  symbol: string;
  name: string;
  type: "equity" | "fno" | "index"; // Add other types if your search supports them
}

// --- IMPORTANT: Replace with your actual Render Spring Backend URL ---
const API_BASE_URL = "YOUR_RENDER_SPRING_BACKEND_URL"; // e.g., "https://my-spring-app.onrender.com"

// --- Helper to get Authentication Token ---
// This is critical for user-wise data.
// You need to replace this logic with how your frontend gets the token
// that your Spring backend expects (e.g., from localStorage, a global context, or `__initial_auth_token` if applicable).
const getAuthToken = (): string | null => {
  // Example: Retrieve a JWT from localStorage
  // const token = localStorage.getItem('authToken');

  // Example: If __initial_auth_token from Canvas is meant for your Spring backend
  // declare const __initial_auth_token: string | undefined;
  // const token = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

  // Placeholder for demonstration:
  // In a real app, this would be dynamically fetched after login
  // For testing, you might hardcode a valid token *temporarily* in development,
  // but NEVER in production.
  console.warn("Auth token logic needs to be implemented. Using placeholder.");
  return "Bearer YOUR_AUTH_TOKEN_LOGIC_HERE"; // e.g., "Bearer eyJhbGciOi..."
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
    name: "", // For displaying selected security name
    type: "", // For F&O: CALL, PUT, FUT, or EQ for equity
    segment: "equity", // 'equity' or 'fno'
    strike: "", // Only relevant for F&O
    qty: "",
    entryPrice: ""
  });
  const [positionType, setPositionType] = useState<"equity" | "fno">("equity"); // Controls form fields
  const [isSubmitting, setIsSubmitting] = useState(false); // For add position dialog submission

  const isMobile = useIsMobile(); // Assuming this hook is defined elsewhere
  const { toast } = useToast(); // Assuming this hook is defined elsewhere

  // --- Fetch Positions from Spring Backend ---
  const fetchPositions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getAuthToken();
      if (!token) {
        setError("Authentication token missing. Please log in.");
        setLoading(false);
        toast({
          title: "Authentication Error",
          description: "Could not fetch positions. Authentication required.",
          variant: "destructive",
        });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/positions`, { // Adjust endpoint as needed
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token, // Send the auth token
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data: Position[] = await response.json();
      setPositions(data);
    } catch (err: any) {
      console.error("Failed to fetch positions:", err);
      setError(`Failed to load positions: ${err.message || "Network error"}`);
      toast({
        title: "Error",
        description: `Failed to load positions: ${err.message || "Please try again."}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]); // Run once on mount and when fetchPositions changes (due to useCallback)

  const filteredPositions = positions.filter(position => {
    const matchesSearch =
      position.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (position.strike && position.strike.toLowerCase().includes(searchTerm.toLowerCase())) ||
      position.type.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === "all" || position.status === selectedStatus;
    const matchesSegment = selectedSegment === "all" || position.segment === selectedSegment;

    return matchesSearch && matchesStatus && matchesSegment;
  });

  const handleSecuritySelect = useCallback((security: Security) => {
    setNewPosition((prev) => ({
      ...prev,
      symbol: security.symbol,
      name: security.name,
      segment: security.type === 'equity' ? 'equity' : 'fno',
      type: security.type === 'equity' ? 'EQ' : '', // Clear type for F&O, set EQ for equity
      strike: security.type === 'equity' ? '' : prev.strike, // Clear strike for equity
    }));
    setPositionType(security.type === 'equity' ? 'equity' : 'fno');
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPosition({
      ...newPosition,
      [name]: value
    });
  };

  const handleSegmentChange = useCallback((value: "equity" | "fno") => {
    setPositionType(value);
    setNewPosition({
      ...newPosition,
      segment: value,
      strike: value === 'fno' ? newPosition.strike : '', // Keep strike if switching to F&O, clear if to Equity
      type: value === 'fno' ? newPosition.type : 'EQ' // Keep type if switching to F&O, set EQ for Equity
    });
  }, [newPosition]);

  const resetNewPositionForm = useCallback(() => {
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
  }, []);

  // --- Add Position to Spring Backend ---
  const handleAddPosition = useCallback(async () => {
    if (!newPosition.symbol || !newPosition.qty || !newPosition.entryPrice) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields: Security, Quantity, Entry Price.",
        variant: "destructive"
      });
      return;
    }

    const parsedQty = parseInt(newPosition.qty);
    const parsedEntryPrice = parseFloat(newPosition.entryPrice);

    if (isNaN(parsedQty) || parsedQty <= 0) {
      toast({
        title: "Invalid Quantity",
        description: "Quantity must be a positive number.",
        variant: "destructive"
      });
      return;
    }
    if (isNaN(parsedEntryPrice) || parsedEntryPrice <= 0) {
      toast({
        title: "Invalid Entry Price",
        description: "Entry Price must be a positive number.",
        variant: "destructive"
      });
      return;
    }

    if (positionType === 'fno' && (!newPosition.type || !newPosition.strike)) {
      toast({
        title: "Missing F&O details",
        description: "Please select option type (CALL/PUT/FUT) and enter strike price for F&O positions.",
        variant: "destructive"
      });
      return;
    }
    if (positionType === 'fno' && (isNaN(parseFloat(newPosition.strike)))) {
      toast({
        title: "Invalid Strike Price",
        description: "Strike Price must be a number for F&O positions.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Structure the data according to what your Spring backend's DTO expects
      const positionToSave = {
        symbol: newPosition.symbol,
        strike: positionType === 'fno' ? newPosition.strike : null, // Send null or empty string for equity strike
        type: positionType === 'equity' ? 'EQ' : newPosition.type,
        segment: positionType,
        qty: parsedQty,
        entryPrice: parsedEntryPrice,
        // For new positions, LTP, PnL, MTM, Status might be set by backend upon creation
        // or you can send initial values if your backend accepts them.
        // Sending default/initial values that backend can overwrite:
        ltp: parsedEntryPrice,
        pnl: 0,
        mtm: parsedQty * parsedEntryPrice,
        status: "active",
      };

      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication token missing.");
      }

      const response = await fetch(`${API_BASE_URL}/api/positions`, { // Adjust endpoint as needed
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token, // Send the auth token
        },
        body: JSON.stringify(positionToSave),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const addedPosition: Position = await response.json(); // Assuming backend returns the created position

      // After successful addition, refetch all positions to update the table
      // This ensures consistency with backend state and any backend-generated fields (like ID)
      await fetchPositions();

      setIsNewPositionDialogOpen(false);
      resetNewPositionForm();

      toast({
        title: "Position Added",
        description: `${addedPosition.symbol} (${addedPosition.segment}) position has been added successfully.`,
      });
    } catch (error: any) {
      console.error("Error adding position:", error);
      toast({
        title: "Failed to add position",
        description: error.message || "An error occurred while adding the position to the database.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [newPosition, positionType, resetNewPositionForm, fetchPositions, toast]);

  return (
    // <DashboardLayout> {/* Uncomment this if you still use DashboardLayout */}
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
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
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
                    segment={positionType} // Pass current segment to search filter
                    placeholder="Search for securities..."
                  />
                  {newPosition.name && (
                    <p className="text-sm text-muted-foreground mt-1">Selected: <span className="font-medium text-foreground">{newPosition.name} ({newPosition.symbol})</span></p>
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
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
    // </DashboardLayout> {/* Uncomment this if you still use DashboardLayout */}
  );
};

export default PositionsPage;