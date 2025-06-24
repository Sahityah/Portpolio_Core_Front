import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { TableHead, TableRow, TableHeader, TableCell, TableBody, Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter, Loader2, Trash2 } from "lucide-react"; // Import Loader2 and Trash2 for spinners/icons
import { formatCurrency } from "../../lib/currency"; // Adjusted relative import path
import { SecuritiesSearch } from "../../components/SecuritiesSearch"; // Adjusted relative import path
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { ReportDownload } from "../../components/ReportDownload"; // Adjusted relative import path
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
import { AxiosResponse } from 'axios'; // Assuming Axios is used by your API service

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

// --- Import the API services and define a local interface for portfolioApi ---
// This interface helps TypeScript understand the methods available on 'portfolioApi'
// if the original declaration is incomplete in your project's lib/api.ts.
// It assumes portfolioApi is an object with these methods returning AxiosResponses.
interface IPortfolioApi {
  getPositions: () => Promise<AxiosResponse<Position[]>>; // Changed to expect 0 arguments
  addPosition: (positionData: Omit<Position, 'id' | 'ltp' | 'pnl' | 'mtm' | 'status'>) => Promise<AxiosResponse<Position>>;
  deletePosition: (id: string) => Promise<AxiosResponse<void>>;
  // Add other methods that might exist on your portfolioApi if needed for other components
  getPortfolio?: () => Promise<AxiosResponse<any>>;
  downloadReport?: () => Promise<AxiosResponse<any>>;
  getPnlChartData?: (period: string) => Promise<AxiosResponse<any>>;
}

// Cast the imported portfolioApi to the custom interface
// This is a workaround to resolve compilation errors if the original type definition is missing methods or has incorrect signatures.
// If your actual portfolioApi object at runtime does NOT have these methods or their expected behavior,
// this will lead to runtime errors instead of compilation errors.
import { portfolioApi as originalPortfolioApi } from "../../lib/api"; // Adjusted relative import path
const portfolioApi: IPortfolioApi = originalPortfolioApi as IPortfolioApi;


const PositionsPage = () => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSegment, setSelectedSegment] = useState("all"); // Controls main table segment filter

  const [isNewPositionDialogOpen, setIsNewPositionDialogOpen] = useState(false);
  const [newPosition, setNewPosition] = useState({
    symbol: "",
    name: "", // For displaying selected security name
    type: "", // For F&O: CALL, PUT, FUT, or EQ for equity
    segment: "equity", // 'equity' or 'fno' - controls the form's radio group
    strike: "", // Only relevant for F&O
    qty: "",
    entryPrice: ""
  });
  const [positionType, setPositionType] = useState<"equity" | "fno">("equity"); // Controls form fields (synced with newPosition.segment)
  const [isSubmitting, setIsSubmitting] = useState(false); // For add position dialog submission

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [positionToDeleteId, setPositionToDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false); // For showing spinner on delete button

  const isMobile = useIsMobile();
  const { toast } = useToast();

  // --- Fetch Positions from Spring Backend ---
  const fetchPositions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Adjusted to call getPositions with no arguments, based on the compilation error.
      // All filtering will now happen client-side in the 'filteredPositions' array.
      const response = await portfolioApi.getPositions();
      setPositions(response.data);
    } catch (err: any) {
      console.error("Failed to fetch positions:", err);
      // Check for specific error message from backend if available
      const errorMessage = err.response?.data?.message || err.message || "Network error";
      setError(`Failed to load positions: ${errorMessage}`);
      toast({
        title: "Error",
        description: `Failed to load positions: ${errorMessage}. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]); // Dependencies simplified as filters are now applied client-side

  useEffect(() => {
    fetchPositions();
  }, [fetchPositions]); // Run once on mount and when fetchPositions changes (due to useCallback dependencies)

  // Filter positions based on search term and selected status/segment (local filtering)
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
      // Automatically set segment and type based on the selected security's type
      segment: security.type === 'equity' ? 'equity' : 'fno',
      type: security.type === 'equity' ? 'EQ' : '', // Clear type for F&O, set EQ for equity
      strike: security.type === 'equity' ? '' : prev.strike, // Clear strike for equity if equity selected
    }));
    // Sync the local form type state with the selected security's segment
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
    setPositionType(value); // Update local form type state
    setNewPosition({
      ...newPosition,
      segment: value, // Sync newPosition's segment
      strike: value === 'fno' ? newPosition.strike : '', // Clear strike if switching to Equity
      type: value === 'fno' ? newPosition.type : 'EQ' // Set to EQ if switching to Equity, otherwise keep current type
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
    setPositionType("equity"); // Reset form type selection to equity
  }, []);

  // --- Add Position to Spring Backend ---
  const handleAddPosition = useCallback(async () => {
    // Basic client-side validation
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
      const positionToSubmit = {
        symbol: newPosition.symbol,
        strike: positionType === 'fno' ? newPosition.strike : null, // Send null for equity strike
        type: positionType === 'equity' ? 'EQ' : newPosition.type,
        segment: positionType, // Use positionType which is synced with segment
        qty: parsedQty,
        entryPrice: parsedEntryPrice,
        // Backend should typically handle LTP, PnL, MTM, Status upon creation
        // These are initial/default values, backend might overwrite
        ltp: parsedEntryPrice, // Initial LTP can be entry price
        pnl: 0,
        mtm: parsedQty * parsedEntryPrice,
        status: "active",
      };

      // Use portfolioApi to add the position
      const response = await portfolioApi.addPosition(positionToSubmit);
      const addedPosition: Position = response.data; // Assuming backend returns the created position

      // After successful addition, refetch all positions to update the table
      await fetchPositions();

      setIsNewPositionDialogOpen(false);
      resetNewPositionForm(); // Reset form after successful submission

      toast({
        title: "Position Added",
        description: `${addedPosition.symbol} (${addedPosition.segment}) position has been added successfully.`,
      });
    } catch (err: any) {
      console.error("Error adding position:", err);
      const errorMessage = err.response?.data?.message || err.message || "An unknown error occurred.";
      toast({
        title: "Failed to add position",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [newPosition, positionType, resetNewPositionForm, fetchPositions, toast]);

  // --- Delete Position Functions ---
  const openDeleteDialog = useCallback((id: string) => {
    setPositionToDeleteId(id);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!positionToDeleteId) return;

    setIsDeleting(true);
    try {
      // Use portfolioApi to delete the position
      await portfolioApi.deletePosition(positionToDeleteId);
      toast({ title: "Success", description: "Position deleted successfully!" });
      fetchPositions(); // Refresh positions list after deletion
      setIsDeleteDialogOpen(false); // Close dialog
      setPositionToDeleteId(null); // Clear ID
    } catch (err: any) {
      console.error("Failed to delete position:", err);
      const errorMessage = err.response?.data?.message || err.message || "An unknown error occurred.";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  }, [positionToDeleteId, fetchPositions, toast]);

  return (
    // <DashboardLayout> {/* Uncomment this if you still use DashboardLayout */}
    <div className="container mx-auto py-6 px-4 md:px-6 max-w-7xl font-inter">
      <div className="flex flex-col space-y-6">
        {/* Header and Filters */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200">Positions</h1>

          <div className="flex flex-col md:flex-row gap-4 md:items-center">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search positions..."
                className="pl-8 w-full rounded-md shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full md:w-[180px] rounded-md shadow-sm">
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
            <Button
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md transition-all duration-200 ease-in-out"
              onClick={() => setIsNewPositionDialogOpen(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Position
            </Button>
          </div>
        </div>

        {/* Segment Tabs */}
        <Tabs defaultValue="all" onValueChange={setSelectedSegment}>
          <TabsList className="grid w-full grid-cols-3 mb-4 bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm">
            <TabsTrigger value="all" className="rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-colors">All</TabsTrigger>
            <TabsTrigger value="equity" className="rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-colors">Equity</TabsTrigger>
            <TabsTrigger value="fno" className="rounded-md data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-colors">F&O</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Positions Table */}
        <Card className="portfolio-card border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
          <div className="flex justify-between items-center mb-4 px-6 pt-6">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
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
              <TableHeader className="bg-gray-50 dark:bg-gray-700">
                <TableRow>
                  <TableHead className="text-gray-600 dark:text-gray-300">Symbol</TableHead>
                  <TableHead className="text-gray-600 dark:text-gray-300">Strike/Price</TableHead>
                  <TableHead className="text-gray-600 dark:text-gray-300">Type</TableHead>
                  <TableHead className="text-gray-600 dark:text-gray-300">Segment</TableHead>
                  <TableHead className="text-gray-600 dark:text-gray-300">Qty</TableHead>
                  <TableHead className="text-gray-600 dark:text-gray-300">Entry Price</TableHead>
                  <TableHead className="text-gray-600 dark:text-gray-300">LTP</TableHead>
                  <TableHead className="text-gray-600 dark:text-gray-300">P&L</TableHead>
                  <TableHead className="text-gray-600 dark:text-gray-300">MTM</TableHead>
                  <TableHead className="text-gray-600 dark:text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-600 dark:text-gray-300">Actions</TableHead> {/* New column for actions */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground"> {/* Increased colspan */}
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-blue-500" />
                      Loading positions...
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-red-500"> {/* Increased colspan */}
                      {error}
                    </TableCell>
                  </TableRow>
                ) : filteredPositions.length > 0 ? (
                  filteredPositions.map((position) => (
                    <TableRow key={position.id} className="position-row hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">{position.symbol}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{position.strike}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{position.type}</TableCell>
                      <TableCell>
                        <Badge variant={position.segment === "equity" ? "outline" : "secondary"} className="rounded-full px-3 py-1 text-xs">
                          {position.segment === "equity" ? "Equity" : "F&O"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{position.qty}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{formatCurrency(position.entryPrice)}</TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{formatCurrency(position.ltp)}</TableCell>
                      <TableCell className={position.pnl >= 0 ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                        {position.pnl >= 0 ? "+" : ""}{formatCurrency(position.pnl)}
                      </TableCell>
                      <TableCell className="text-gray-700 dark:text-gray-300">{formatCurrency(position.mtm)}</TableCell>
                      <TableCell>
                        <Badge variant={position.status === "active" ? "default" : "secondary"} className="rounded-full px-3 py-1 text-xs">
                          {position.status === "active" ? "Active" : "Closed"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="rounded-md shadow-sm transition-all duration-200 ease-in-out hover:scale-105"
                          onClick={() => openDeleteDialog(position.id)}
                          aria-label={`Delete position ${position.symbol}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-muted-foreground"> {/* Increased colspan */}
                      No positions found matching your filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Summary statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="stat-card p-5 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-muted-foreground">Total Positions</h3>
            <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">{filteredPositions.length}</div>
          </Card>

          <Card className="stat-card p-5 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-muted-foreground">Total P&L</h3>
            <div className={`mt-2 text-3xl font-bold ${
              filteredPositions.reduce((sum, pos) => sum + pos.pnl, 0) >= 0
                ? "text-green-600"
                : "text-red-600"
            }`}>
              {formatCurrency(filteredPositions.reduce((sum, pos) => sum + pos.pnl, 0))}
            </div>
          </Card>

          <Card className="stat-card p-5 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md">
            <h3 className="text-sm font-medium text-muted-foreground">Active Positions</h3>
            <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
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
          <DialogContent className="sm:max-w-[500px] p-6 rounded-lg shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">Add New Position</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Enter the details of your new position below.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              {/* Position Type Selection */}
              <div className="grid gap-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Position Type</Label>
                <RadioGroup
                  value={positionType}
                  onValueChange={handleSegmentChange}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="equity" id="equity" className="border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white" />
                    <Label htmlFor="equity" className="cursor-pointer text-gray-700 dark:text-gray-300">Equity</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fno" id="fno" className="border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white" />
                    <Label htmlFor="fno" className="cursor-pointer text-gray-700 dark:text-gray-300">F&O</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Security Search */}
              <div className="grid gap-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Security</Label>
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
                    <Label htmlFor="type" className="text-sm font-medium text-gray-700 dark:text-gray-300">Option Type</Label>
                    <Select onValueChange={value => setNewPosition({ ...newPosition, type: value })} value={newPosition.type}>
                      <SelectTrigger className="rounded-md shadow-sm">
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
                    <Label htmlFor="strike" className="text-sm font-medium text-gray-700 dark:text-gray-300">Strike Price</Label>
                    <Input
                      id="strike"
                      name="strike"
                      placeholder="e.g. 18000"
                      value={newPosition.strike}
                      onChange={handleInputChange}
                      type="number"
                      className="rounded-md shadow-sm"
                    />
                  </div>
                </>
              )}

              {/* Common Fields */}
              <div className="grid gap-2">
                <Label htmlFor="qty" className="text-sm font-medium text-gray-700 dark:text-gray-300">Quantity</Label>
                <Input
                  id="qty"
                  name="qty"
                  type="number"
                  placeholder="e.g. 100"
                  value={newPosition.qty}
                  onChange={handleInputChange}
                  className="rounded-md shadow-sm"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="entryPrice" className="text-sm font-medium text-gray-700 dark:text-gray-300">Entry Price (₹)</Label>
                <Input
                  id="entryPrice"
                  name="entryPrice"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 1250.75"
                  value={newPosition.entryPrice}
                  onChange={handleInputChange}
                  className="rounded-md shadow-sm"
                />
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                variant="outline"
                onClick={() => setIsNewPositionDialogOpen(false)}
                className="rounded-md shadow-sm transition-all duration-200 ease-in-out hover:scale-105"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPosition}
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-md transition-all duration-200 ease-in-out hover:scale-105"
              >
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

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setPositionToDeleteId(null); // Clear the ID when dialog closes
          }
        }}>
          <DialogContent className="sm:max-w-[425px] p-6 rounded-lg shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">Confirm Deletion</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Are you sure you want to delete this position? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="pt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="rounded-md shadow-sm transition-all duration-200 ease-in-out hover:scale-105"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="rounded-md shadow-md transition-all duration-200 ease-in-out hover:scale-105"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>Delete</>
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
