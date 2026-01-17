"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Loader2, Trash2, Eye } from "lucide-react";

interface LineItem {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total?: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  status: "DRAFT" | "SENT" | "PAID" | "CANCELLED";
  issueDate: string;
  dueDate: string | null;
  subtotal: number;
  tax: number;
  total: number;
  currency: string;
  notes: string | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  lineItems: LineItem[];
}

interface User {
  id: string;
  name: string | null;
  email: string;
}

export default function InvoicesPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [selectedUserId, setSelectedUserId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ]);

  useEffect(() => {
    loadInvoices();
    loadUsers();
  }, [companySlug]);

  async function loadInvoices() {
    try {
      const response = await fetch(`/api/c/${companySlug}/invoices`);
      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (error) {
      toast.error(tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  }

  async function loadUsers() {
    // In a real app, you'd have a users API endpoint
    // For now, we'll use the appointments endpoint to get users
    try {
      const response = await fetch(`/api/c/${companySlug}/appointments`);
      if (response.ok) {
        const data = await response.json();
        const uniqueUsers = Array.from(
          new Map(data.map((apt: { user: User }) => [apt.user.id, apt.user])).values()
        ) as User[];
        setUsers(uniqueUsers);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    }
  }

  function addLineItem() {
    setLineItems([...lineItems, { description: "", quantity: 1, unitPrice: 0 }]);
  }

  function removeLineItem(index: number) {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index));
    }
  }

  function updateLineItem(index: number, updates: Partial<LineItem>) {
    setLineItems(
      lineItems.map((item, i) => (i === index ? { ...item, ...updates } : item))
    );
  }

  function calculateTotal() {
    return lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedUserId || lineItems.some((item) => !item.description)) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/c/${companySlug}/invoices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
          notes: notes || undefined,
          lineItems: lineItems.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create invoice");
      }

      toast.success("Invoice created");
      setIsDialogOpen(false);
      resetForm();
      loadInvoices();
    } catch (error) {
      toast.error(tCommon("error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setSelectedUserId("");
    setDueDate("");
    setNotes("");
    setLineItems([{ description: "", quantity: 1, unitPrice: 0 }]);
  }

  async function updateStatus(invoiceId: string, status: Invoice["status"]) {
    try {
      const response = await fetch(
        `/api/c/${companySlug}/invoices/${invoiceId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      toast.success("Status updated");
      loadInvoices();
    } catch (error) {
      toast.error(tCommon("error"));
    }
  }

  function getStatusBadge(status: Invoice["status"]) {
    const variants: Record<Invoice["status"], "default" | "secondary" | "destructive" | "outline"> = {
      DRAFT: "secondary",
      SENT: "default",
      PAID: "outline",
      CANCELLED: "destructive",
    };

    const labels: Record<Invoice["status"], string> = {
      DRAFT: t("statusDraft"),
      SENT: t("statusSent"),
      PAID: t("statusPaid"),
      CANCELLED: t("statusCancelled"),
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              {t("createInvoice")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("createInvoice")}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Customer</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name || user.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">{t("dueDate")}</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t("lineItems")}</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                      <Plus className="h-3 w-3 mr-1" />
                      {t("addLineItem")}
                    </Button>
                  </div>
                  {lineItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <Input
                        placeholder="Description"
                        value={item.description}
                        onChange={(e) =>
                          updateLineItem(index, { description: e.target.value })
                        }
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateLineItem(index, { quantity: parseInt(e.target.value) || 1 })
                        }
                        className="w-20"
                        placeholder="Qty"
                      />
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) =>
                          updateLineItem(index, { unitPrice: parseFloat(e.target.value) || 0 })
                        }
                        className="w-28"
                        placeholder="Price"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLineItem(index)}
                        disabled={lineItems.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="text-right text-sm text-muted-foreground">
                    Subtotal: RSD {calculateTotal().toLocaleString()}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  {tCommon("cancel")}
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  {tCommon("create")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {invoices.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{t("noInvoices")}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("invoiceNumber")}</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>{t("issueDate")}</TableHead>
                <TableHead>{t("total")}</TableHead>
                <TableHead>{tCommon("status")}</TableHead>
                <TableHead className="text-right">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    {invoice.user.name || invoice.user.email}
                  </TableCell>
                  <TableCell>
                    {format(parseISO(invoice.issueDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    {invoice.currency} {Number(invoice.total).toLocaleString()}
                  </TableCell>
                  <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                  <TableCell className="text-right">
                    {invoice.status === "DRAFT" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="mr-2"
                        onClick={() => updateStatus(invoice.id, "SENT")}
                      >
                        Send
                      </Button>
                    )}
                    {invoice.status === "SENT" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatus(invoice.id, "PAID")}
                      >
                        Mark Paid
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
