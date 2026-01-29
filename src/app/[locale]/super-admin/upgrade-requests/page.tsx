"use client";

import { useState, useEffect } from "react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  CreditCard,
  Building2,
  MessageSquare,
  Loader2,
  Euro,
  Trash2,
  Coins,
} from "lucide-react";
import { formatTokenCount } from "@/lib/utils/format-tokens";

interface User {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
}

interface UpgradeRequest {
  id: string;
  userId: string;
  user: User;
  requestedPlanTier: string;
  includeChatbot: boolean;
  extraCompanyCount: number;
  basePrice: number;
  chatbotPrice: number;
  extraCompaniesPrice: number;
  totalMonthlyPrice: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  handledBy: string | null;
  handledAt: string | null;
  adminNotes: string | null;
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
  paymentReference: string;
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

type PaymentRequest =
  | { type: "subscription"; data: UpgradeRequest }
  | { type: "token"; data: TokenPurchase };

export default function PaymentRequestsPage() {
  const [upgradeRequests, setUpgradeRequests] = useState<UpgradeRequest[]>([]);
  const [tokenPurchases, setTokenPurchases] = useState<TokenPurchase[]>([]);
  const [upgradeStats, setUpgradeStats] = useState<Stats | null>(null);
  const [tokenStats, setTokenStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PaymentRequest | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;

  const fetchUpgradeRequests = async () => {
    try {
      const response = await fetch("/api/super-admin/upgrade-requests");
      if (!response.ok) throw new Error("Failed to fetch requests");
      const data = await response.json();
      setUpgradeRequests(data.requests);
      setUpgradeStats(data.stats);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast.error("Failed to load upgrade requests");
    }
  };

  const fetchTokenPurchases = async () => {
    try {
      const response = await fetch("/api/super-admin/token-purchases");
      if (!response.ok) throw new Error("Failed to fetch token purchases");
      const data = await response.json();
      setTokenPurchases(data.purchases);
      setTokenStats(data.stats);
    } catch (error) {
      console.error("Error fetching token purchases:", error);
      toast.error("Failed to load token purchases");
    }
  };

  useEffect(() => {
    Promise.all([fetchUpgradeRequests(), fetchTokenPurchases()]).finally(() => {
      setLoading(false);
    });
  }, []);

  const handleAction = async () => {
    if (!selectedRequest || !actionType) return;

    setProcessing(true);
    try {
      const endpoint = selectedRequest.type === "subscription"
        ? `/api/super-admin/upgrade-requests/${selectedRequest.data.id}`
        : `/api/super-admin/token-purchases/${selectedRequest.data.id}`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: actionType,
          adminNotes,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || error.error || "Failed to process request");
      }

      const successMessage = selectedRequest.type === "subscription"
        ? actionType === "approve"
          ? "Request approved and subscription activated"
          : "Request has been rejected"
        : actionType === "approve"
          ? "Token purchase approved and tokens credited"
          : "Token purchase has been rejected";

      toast.success(successMessage);

      // Refresh the appropriate list
      if (selectedRequest.type === "subscription") {
        fetchUpgradeRequests();
      } else {
        fetchTokenPurchases();
      }

      setSelectedRequest(null);
      setActionType(null);
      setAdminNotes("");
    } catch (error) {
      console.error("Error processing request:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process request");
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

  // Type badge color constants with dark mode support (#23)
  const TYPE_BADGE_COLORS = {
    subscription: "gap-1 border-blue-300 text-blue-700 bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:bg-blue-950",
    token: "gap-1 border-amber-300 text-amber-700 bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:bg-amber-950",
  } as const;

  const getTypeBadge = (type: "subscription" | "token") => {
    if (type === "subscription") {
      return (
        <Badge variant="outline" className={TYPE_BADGE_COLORS.subscription}>
          <CreditCard className="h-3 w-3" />
          Subscription
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className={TYPE_BADGE_COLORS.token}>
        <Coins className="h-3 w-3" />
        Token Pack
      </Badge>
    );
  };

  // Combine and sort all requests by date
  const allRequests: PaymentRequest[] = [
    ...upgradeRequests.map((req): PaymentRequest => ({ type: "subscription", data: req })),
    ...tokenPurchases.map((purchase): PaymentRequest => ({ type: "token", data: purchase })),
  ].sort((a, b) => new Date(b.data.createdAt).getTime() - new Date(a.data.createdAt).getTime());

  const filteredRequests = allRequests.filter((req) => {
    if (statusFilter === "all") return true;
    return req.data.status === statusFilter;
  });

  // Selection handlers
  const getRequestKey = (req: PaymentRequest) => `${req.type}-${req.data.id}`;

  const toggleSelect = (req: PaymentRequest) => {
    const key = getRequestKey(req);
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRequests.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRequests.map(getRequestKey)));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    setShowDeleteConfirm(false);
    setIsDeleting(true);
    try {
      const upgradeIds: string[] = [];
      const tokenIds: string[] = [];

      selectedIds.forEach((key) => {
        const [type, id] = key.split("-");
        if (type === "subscription") {
          upgradeIds.push(id);
        } else {
          tokenIds.push(id);
        }
      });

      const promises: Promise<Response>[] = [];

      if (upgradeIds.length > 0) {
        promises.push(
          fetch("/api/super-admin/upgrade-requests", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: upgradeIds }),
          })
        );
      }

      if (tokenIds.length > 0) {
        promises.push(
          fetch("/api/super-admin/token-purchases", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: tokenIds }),
          })
        );
      }

      // Use Promise.allSettled to handle partial failures (#6)
      const results = await Promise.allSettled(promises);

      // Check for failures
      const failures = results.filter((r) => r.status === "rejected");
      const successes = results.filter((r) => r.status === "fulfilled");

      // Also check for non-OK responses in fulfilled promises
      const responseFailures = await Promise.all(
        successes
          .filter((r): r is PromiseFulfilledResult<Response> => r.status === "fulfilled")
          .map(async (r) => {
            if (!r.value.ok) {
              const data = await r.value.json().catch(() => ({}));
              return data.error || "Request failed";
            }
            return null;
          })
      );
      const httpFailures = responseFailures.filter((f) => f !== null);

      if (failures.length > 0 || httpFailures.length > 0) {
        const failureCount = failures.length + httpFailures.length;
        const successCount = promises.length - failureCount;
        if (successCount > 0) {
          toast.warning(`Deleted ${successCount} request(s), but ${failureCount} failed`);
        } else {
          toast.error("Failed to delete requests");
        }
      } else {
        toast.success(`Deleted ${selectedIds.size} request(s)`);
      }

      setSelectedIds(new Set());
      fetchUpgradeRequests();
      fetchTokenPurchases();
    } catch (error) {
      console.error("Error deleting requests:", error);
      toast.error("Failed to delete requests");
    } finally {
      setIsDeleting(false);
    }
  };

  // Combined stats
  const combinedStats = {
    pending: (upgradeStats?.pending || 0) + (tokenStats?.pending || 0),
    approved: (upgradeStats?.approved || 0) + (tokenStats?.approved || 0),
    rejected: (upgradeStats?.rejected || 0) + (tokenStats?.rejected || 0),
    cancelled: (upgradeStats?.cancelled || 0) + (tokenStats?.cancelled || 0),
    totalPendingAmount: (upgradeStats?.totalPendingAmount || 0) + (tokenStats?.totalPendingAmount || 0),
  };

  // Render details based on request type
  const renderDetails = (req: PaymentRequest) => {
    if (req.type === "subscription") {
      const data = req.data;
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-sm">
            <CreditCard className="h-3 w-3" />
            {data.requestedPlanTier}
          </div>
          {data.includeChatbot && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <MessageSquare className="h-3 w-3" />
              With Chatbot
            </div>
          )}
          {data.extraCompanyCount > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Building2 className="h-3 w-3" />
              +{data.extraCompanyCount} companies
            </div>
          )}
        </div>
      );
    } else {
      const data = req.data;
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1 text-sm font-medium">
            <Coins className="h-3 w-3" />
            {data.packName}
          </div>
          <div className="text-sm text-muted-foreground">
            {formatTokenCount(data.tokenAmount)} tokens
          </div>
        </div>
      );
    }
  };

  const getAmount = (req: PaymentRequest) => {
    if (req.type === "subscription") {
      return (
        <div className="flex items-center gap-1">
          <Euro className="h-4 w-4" />
          <span className="font-medium">
            {(req.data.totalMonthlyPrice / 100).toFixed(2)}
          </span>
          <span className="text-muted-foreground">/month</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1">
        <Euro className="h-4 w-4" />
        <span className="font-medium">
          {(req.data.priceEurCents / 100).toFixed(2)}
        </span>
      </div>
    );
  };

  const getReference = (req: PaymentRequest) => {
    if (req.type === "token") {
      return (
        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
          {req.data.paymentReference}
        </code>
      );
    }
    return <span className="text-muted-foreground">-</span>;
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
        <h1 className="text-2xl font-bold">Payment Requests</h1>
        <p className="text-muted-foreground">
          Manage subscription upgrades and token purchases
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{combinedStats.pending}</div>
            <p className="text-xs text-muted-foreground">
              {formatPrice(combinedStats.totalPendingAmount)} potential
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{combinedStats.approved}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{combinedStats.rejected}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cancelled</CardTitle>
            <Ban className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{combinedStats.cancelled}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
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
            onClick={() => setShowDeleteConfirm(true)}
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

      {/* Unified Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Requests</CardTitle>
          <CardDescription>
            {filteredRequests.length} request(s) found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payment requests found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={filteredRequests.length > 0 && selectedIds.size === filteredRequests.length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.map((req) => (
                  <TableRow key={getRequestKey(req)}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(getRequestKey(req))}
                        onCheckedChange={() => toggleSelect(req)}
                      />
                    </TableCell>
                    <TableCell>{getTypeBadge(req.type)}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{req.data.user.name || "No name"}</p>
                        <p className="text-sm text-muted-foreground">{req.data.user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{renderDetails(req)}</TableCell>
                    <TableCell>{getAmount(req)}</TableCell>
                    <TableCell>{getReference(req)}</TableCell>
                    <TableCell>{getStatusBadge(req.data.status)}</TableCell>
                    <TableCell>
                      {format(new Date(req.data.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      {req.data.status === "PENDING" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(req);
                              setActionType("approve");
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setSelectedRequest(req);
                              setActionType("reject");
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      {req.data.adminNotes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Note: {req.data.adminNotes}
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
        open={!!selectedRequest && !!actionType}
        onOpenChange={() => {
          setSelectedRequest(null);
          setActionType(null);
          setAdminNotes("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve"
                ? selectedRequest?.type === "subscription"
                  ? "Approve Upgrade Request"
                  : "Approve Token Purchase"
                : selectedRequest?.type === "subscription"
                  ? "Reject Upgrade Request"
                  : "Reject Token Purchase"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? selectedRequest?.type === "subscription"
                  ? "This will activate the user's subscription immediately."
                  : "This will credit the tokens to the user's account immediately."
                : selectedRequest?.type === "subscription"
                  ? "This will reject the upgrade request."
                  : "This will reject the token purchase request."}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type:</span>
                  <span>{getTypeBadge(selectedRequest.type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">User:</span>
                  <span className="font-medium">{selectedRequest.data.user.email}</span>
                </div>
                {selectedRequest.type === "subscription" ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Plan:</span>
                      <span className="font-medium">{selectedRequest.data.requestedPlanTier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">With Chatbot:</span>
                      <span className="font-medium">{selectedRequest.data.includeChatbot ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Extra Companies:</span>
                      <span className="font-medium">{selectedRequest.data.extraCompanyCount}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-muted-foreground">Total Monthly:</span>
                      <span className="font-bold">{formatPrice(selectedRequest.data.totalMonthlyPrice)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pack:</span>
                      <span className="font-medium">{selectedRequest.data.packName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tokens:</span>
                      <span className="font-medium">{formatTokenCount(selectedRequest.data.tokenAmount)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-bold">{formatPrice(selectedRequest.data.priceEurCents)}</span>
                    </div>
                  </>
                )}
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
                setSelectedRequest(null);
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
              {actionType === "approve"
                ? selectedRequest?.type === "subscription"
                  ? "Approve & Activate"
                  : "Approve & Credit Tokens"
                : "Reject Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} request(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the selected
              payment request{selectedIds.size > 1 ? "s" : ""} from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSelected}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
