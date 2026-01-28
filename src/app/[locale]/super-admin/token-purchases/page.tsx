"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Clock,
  CheckCircle,
  XCircle,
  Ban,
  Coins,
  Euro,
  Loader2,
  Trash2,
} from "lucide-react";

interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

interface TokenPurchase {
  id: string;
  userId: string;
  user: User;
  packName: string;
  tokenAmount: number;
  priceEurCents: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  handledBy: string | null;
  handledAt: string | null;
  adminNotes: string | null;
  createdAt: string;
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  cancelled: number;
  totalPendingAmount: number;
}

const formatTokenAmount = (amount: number): string => {
  if (amount >= 1_000_000) {
    const val = amount / 1_000_000;
    return val % 1 === 0 ? `${val}M` : `${val.toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    const val = amount / 1_000;
    return val % 1 === 0 ? `${val}K` : `${val.toFixed(1)}K`;
  }
  return amount.toLocaleString();
};

export default function TokenPurchasesPage() {
  const t = useTranslations();
  const [purchases, setPurchases] = useState<TokenPurchase[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState<TokenPurchase | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;

  const fetchPurchases = async () => {
    try {
      const response = await fetch("/api/super-admin/token-purchases");
      if (!response.ok) throw new Error("Failed to fetch purchases");
      const data = await response.json();
      setPurchases(data.purchases);
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching purchases:", error);
      toast.error("Failed to load token purchases");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  const handleAction = async () => {
    if (!selectedPurchase || !actionType) return;

    setProcessing(true);
    try {
      const response = await fetch(`/api/super-admin/token-purchases/${selectedPurchase.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          adminNotes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || "Failed to process purchase");
      }

      toast.success(
        actionType === "approve"
          ? "Purchase approved and tokens credited"
          : "Purchase has been rejected"
      );

      // Refresh the list
      fetchPurchases();
      setSelectedPurchase(null);
      setActionType(null);
      setAdminNotes("");
    } catch (error) {
      console.error("Error processing purchase:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process purchase");
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-4 w-4" />;
      case "APPROVED":
        return <CheckCircle className="h-4 w-4" />;
      case "REJECTED":
        return <XCircle className="h-4 w-4" />;
      case "CANCELLED":
        return <Ban className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="gap-1">{getStatusIcon(status)} Pending</Badge>;
      case "APPROVED":
        return <Badge variant="default" className="gap-1 bg-green-600">{getStatusIcon(status)} Approved</Badge>;
      case "REJECTED":
        return <Badge variant="destructive" className="gap-1">{getStatusIcon(status)} Rejected</Badge>;
      case "CANCELLED":
        return <Badge variant="secondary" className="gap-1">{getStatusIcon(status)} Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredPurchases = purchases.filter((purchase) => {
    if (statusFilter === "all") return true;
    return purchase.status === statusFilter;
  });

  // Selection handlers
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPurchases.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPurchases.map((p) => p.id)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/super-admin/token-purchases", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete purchases");
      }

      const data = await response.json();
      toast.success(`Deleted ${data.deletedCount} purchase(s)`);
      setSelectedIds(new Set());
      fetchPurchases();
    } catch (error) {
      console.error("Error deleting purchases:", error);
      toast.error("Failed to delete purchases");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Token Purchases</h1>
        <p className="text-muted-foreground">
          Manage token purchase requests from users
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                {formatPrice(stats.totalPendingAmount)} pending revenue
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Approved</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rejected</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.rejected}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
              <Ban className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cancelled}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Purchases</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
        {selectedIds.size > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Trash2 className="h-4 w-4 mr-2" />
            )}
            Delete {selectedIds.size} selected
          </Button>
        )}
      </div>

      {/* Purchases Table */}
      <Card>
        <CardHeader>
          <CardTitle>Token Purchases</CardTitle>
          <CardDescription>
            {filteredPurchases.length} purchase(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredPurchases.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No token purchases found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={filteredPurchases.length > 0 && selectedIds.size === filteredPurchases.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Pack Name</TableHead>
                  <TableHead>Token Amount</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.map((purchase) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(purchase.id)}
                        onCheckedChange={() => toggleSelect(purchase.id)}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{purchase.user.name || "No name"}</p>
                        <p className="text-sm text-muted-foreground">{purchase.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{purchase.packName}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">{formatTokenAmount(purchase.tokenAmount)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Euro className="h-4 w-4" />
                        <span className="font-medium">
                          {(purchase.priceEurCents / 100).toFixed(2)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                    <TableCell>
                      {format(new Date(purchase.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      {purchase.status === "PENDING" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedPurchase(purchase);
                              setActionType("approve");
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedPurchase(purchase);
                              setActionType("reject");
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {purchase.adminNotes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Note: {purchase.adminNotes}
                        </p>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog
        open={!!selectedPurchase && !!actionType}
        onOpenChange={() => {
          setSelectedPurchase(null);
          setActionType(null);
          setAdminNotes("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Token Purchase" : "Reject Token Purchase"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "This will credit the tokens to the user's account immediately."
                : "This will reject the token purchase request."}
            </DialogDescription>
          </DialogHeader>

          {selectedPurchase && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User:</span>
                  <span className="font-medium">{selectedPurchase.user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pack:</span>
                  <span className="font-medium">{selectedPurchase.packName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tokens:</span>
                  <span className="font-medium">{formatTokenAmount(selectedPurchase.tokenAmount)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 mt-2">
                  <span className="text-muted-foreground">Price:</span>
                  <span className="font-bold">{formatPrice(selectedPurchase.priceEurCents)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Admin Notes (optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this decision..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedPurchase(null);
                setActionType(null);
                setAdminNotes("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant={actionType === "approve" ? "default" : "destructive"}
              onClick={handleAction}
              disabled={processing}
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {actionType === "approve" ? "Approve & Credit Tokens" : "Reject Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
