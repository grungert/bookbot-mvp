"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  Users,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Clock,
  Building2,
  Edit,
  Bot,
  BotOff,
  Coins,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { formatTokenCount } from "@/lib/utils/format-tokens";

interface Subscription {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    createdAt: string;
  };
  plan: {
    id: string;
    name: string;
    tier: string;
    priceMonthly: number;
    maxChatMessagesPerMonth: number;
    maxChatTokensPerMonth: number;
    baseCompanies: number;
    maxCompanies: number;
  };
  status: string;
  extraCompanySlots: number;
  hasChatbot: boolean;
  trialEndsAt: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  companyCount: number;
  chatUsageThisMonth: number;
}

interface Stats {
  totalSubscriptions: number;
  usersWithoutSubscription: number;
  monthlyRevenue: number;
  trialsExpiringSoon: number;
  totalChatUsageThisMonth: number;
  byStatus: Record<string, number>;
  byPlanTier: Record<string, number>;
  // Token purchase stats
  totalTokensPurchased: number;
  tokenRevenueCents: number;
  tokenPurchaseCount: number;
}

const statusColors: Record<string, string> = {
  TRIALING: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  ACTIVE: "bg-green-500/20 text-green-700 dark:text-green-400",
  TRIAL_EXPIRED: "bg-red-500/20 text-red-700 dark:text-red-400",
  PAST_DUE: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
  CANCELLED: "bg-gray-500/20 text-gray-700 dark:text-gray-400",
};

const tierColors: Record<string, string> = {
  TRIAL: "bg-gray-500/20 text-gray-700 dark:text-gray-400",
  PRO: "bg-purple-500/20 text-purple-700 dark:text-purple-400",
  BUSINESS: "bg-indigo-500/20 text-indigo-700 dark:text-indigo-400",
};

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [chatbotFilter, setChatbotFilter] = useState<string>("all");

  // Edit dialog state
  const [editingSubscription, setEditingSubscription] =
    useState<Subscription | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    status: "",
    planTier: "",
    extraCompanySlots: 0,
    hasChatbot: false,
    notes: "",
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const [subsResponse, statsResponse] = await Promise.all([
        fetch("/api/super-admin/subscriptions"),
        fetch("/api/super-admin/subscriptions/stats"),
      ]);

      if (subsResponse.ok) {
        const data = await subsResponse.json();
        setSubscriptions(data);
      }

      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data);
      }
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }

  function openEditDialog(subscription: Subscription) {
    setEditingSubscription(subscription);
    setEditForm({
      status: subscription.status,
      planTier: subscription.plan.tier,
      extraCompanySlots: subscription.extraCompanySlots,
      hasChatbot: subscription.hasChatbot,
      notes: subscription.notes || "",
    });
    setIsEditDialogOpen(true);
  }

  async function handleSaveEdit() {
    if (!editingSubscription) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(
        `/api/super-admin/subscriptions/${editingSubscription.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: editForm.status,
            planTier: editForm.planTier,
            extraCompanySlots: editForm.extraCompanySlots,
            hasChatbot: editForm.hasChatbot,
            notes: editForm.notes || null,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update subscription");
      }

      toast.success("Subscription updated");
      setIsEditDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update subscription"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      !searchQuery ||
      sub.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sub.user.name?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || sub.status === statusFilter;

    const matchesTier =
      tierFilter === "all" || sub.plan.tier === tierFilter;

    const matchesChatbot =
      chatbotFilter === "all" ||
      (chatbotFilter === "with" && sub.hasChatbot) ||
      (chatbotFilter === "without" && !sub.hasChatbot);

    return matchesSearch && matchesStatus && matchesTier && matchesChatbot;
  });

  // Calculate chatbot stats
  const usersWithChatbot = subscriptions.filter((sub) => sub.hasChatbot).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subscriptions</h1>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Subscriptions
              </CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSubscriptions}</div>
              <p className="text-xs text-muted-foreground">
                {stats.usersWithoutSubscription} users without subscription
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${stats.monthlyRevenue.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                From active subscriptions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Trials
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.byStatus.TRIALING || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.trialsExpiringSoon} expiring in 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Needs Attention
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(stats.byStatus.TRIAL_EXPIRED || 0) +
                  (stats.byStatus.PAST_DUE || 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Expired or past due
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Token Usage (Month)
              </CardTitle>
              <MessageSquare className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatTokenCount(stats.totalChatUsageThisMonth)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total tokens this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Users with Chatbot
              </CardTitle>
              <Bot className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usersWithChatbot}</div>
              <p className="text-xs text-muted-foreground">
                {subscriptions.length > 0
                  ? `${Math.round((usersWithChatbot / subscriptions.length) * 100)}% of users`
                  : "0% of users"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Token Revenue
              </CardTitle>
              <Coins className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{(stats.tokenRevenueCents / 100).toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                From {stats.tokenPurchaseCount} purchase(s)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tokens Purchased
              </CardTitle>
              <Coins className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatTokenCount(stats.totalTokensPurchased)}
              </div>
              <p className="text-xs text-muted-foreground">
                Total tokens sold
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Plan Tier Distribution */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subscription Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-6">
              {Object.entries(stats.byPlanTier).map(([tier, count]) => (
                <div key={tier} className="flex items-center gap-2">
                  <Badge className={tierColors[tier] || ""}>{tier}</Badge>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <Badge className={statusColors.ACTIVE}>Active</Badge>
                <span className="font-medium">{stats.byStatus.ACTIVE || 0}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={statusColors.CANCELLED}>Cancelled</Badge>
                <span className="font-medium">
                  {stats.byStatus.CANCELLED || 0}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                  <Bot className="h-3 w-3 mr-1" />
                  With Chatbot
                </Badge>
                <span className="font-medium">{usersWithChatbot}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="TRIALING">Trialing</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="TRIAL_EXPIRED">Trial Expired</SelectItem>
                <SelectItem value="PAST_DUE">Past Due</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="TRIAL">Trial</SelectItem>
                <SelectItem value="PRO">Pro</SelectItem>
                <SelectItem value="BUSINESS">Business</SelectItem>
              </SelectContent>
            </Select>
            <Select value={chatbotFilter} onValueChange={setChatbotFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Chatbot" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chatbot</SelectItem>
                <SelectItem value="with">With Chatbot</SelectItem>
                <SelectItem value="without">Without Chatbot</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Chatbot</TableHead>
              <TableHead>Companies</TableHead>
              <TableHead>Token Usage</TableHead>
              <TableHead>Trial/Period End</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubscriptions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  <p className="text-muted-foreground">No subscriptions found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredSubscriptions.map((sub) => {
                const chatUsagePercent =
                  sub.plan.maxChatTokensPerMonth === -1
                    ? 0
                    : Math.round(
                        (sub.chatUsageThisMonth /
                          sub.plan.maxChatTokensPerMonth) *
                          100
                      );

                const maxCompanies =
                  sub.plan.baseCompanies === -1
                    ? "∞"
                    : sub.plan.baseCompanies + sub.extraCompanySlots;

                return (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {sub.user.name || "No name"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {sub.user.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={tierColors[sub.plan.tier] || ""}>
                        {sub.plan.name}
                      </Badge>
                      {sub.extraCompanySlots > 0 && (
                        <span className="text-xs text-muted-foreground ml-2">
                          +{sub.extraCompanySlots} slots
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[sub.status] || ""}>
                        {sub.status.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sub.hasChatbot ? (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <Bot className="h-4 w-4" />
                          <span className="text-xs">Enabled</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <BotOff className="h-4 w-4" />
                          <span className="text-xs">Disabled</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {sub.companyCount} / {maxCompanies}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {formatTokenCount(sub.chatUsageThisMonth)}
                          {sub.plan.maxChatTokensPerMonth !== -1 && (
                            <span className="text-muted-foreground">
                              {" "}
                              / {formatTokenCount(sub.plan.maxChatTokensPerMonth)}
                            </span>
                          )}
                        </span>
                        {chatUsagePercent >= 80 && chatUsagePercent < 100 && (
                          <Badge variant="outline" className="text-amber-500">
                            {chatUsagePercent}%
                          </Badge>
                        )}
                        {chatUsagePercent >= 100 && (
                          <Badge variant="outline" className="text-red-500">
                            Limit!
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {sub.status === "TRIALING" && sub.trialEndsAt ? (
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(sub.trialEndsAt), {
                            addSuffix: true,
                          })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {new Date(sub.currentPeriodEnd).toLocaleDateString()}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(sub)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Subscription</DialogTitle>
          </DialogHeader>
          {editingSubscription && (
            <div className="space-y-4 py-4">
              <div className="text-sm text-muted-foreground mb-4">
                <p>
                  <strong>User:</strong> {editingSubscription.user.email}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Plan</Label>
                <Select
                  value={editForm.planTier}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, planTier: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRIAL">Trial</SelectItem>
                    <SelectItem value="PRO">Pro ($29/mo)</SelectItem>
                    <SelectItem value="BUSINESS">Business ($99/mo)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={editForm.status}
                  onValueChange={(value) =>
                    setEditForm({ ...editForm, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TRIALING">Trialing</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="TRIAL_EXPIRED">Trial Expired</SelectItem>
                    <SelectItem value="PAST_DUE">Past Due</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Extra Company Slots</Label>
                <Input
                  type="number"
                  min={0}
                  value={editForm.extraCompanySlots}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      extraCompanySlots: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Additional company slots beyond base plan
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasChatbot"
                  checked={editForm.hasChatbot}
                  onCheckedChange={(checked) =>
                    setEditForm({ ...editForm, hasChatbot: checked === true })
                  }
                />
                <Label htmlFor="hasChatbot" className="cursor-pointer">
                  AI Chatbot Enabled
                </Label>
              </div>

              <div className="space-y-2">
                <Label>Admin Notes</Label>
                <Textarea
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm({ ...editForm, notes: e.target.value })
                  }
                  placeholder="Internal notes about this subscription..."
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
