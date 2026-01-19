"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, PackageOpen, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration: number;
  price: number;
  currency: string;
  color: string | null;
  isActive: boolean;
}

const DEFAULT_COLORS = [
  "#F97316", // Orange
  "#3B82F6", // Blue
  "#22C55E", // Green
  "#EF4444", // Red
  "#A855F7", // Purple
  "#EC4899", // Pink
  "#14B8A6", // Teal
  "#F59E0B", // Amber
];

export default function ServicesPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const t = useTranslations("services");
  const tCommon = useTranslations("common");

  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingServiceId, setDeletingServiceId] = useState<string | null>(null);

  // Selection and sorting state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<"name" | "duration" | "price" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("60");
  const [price, setPrice] = useState("0");
  const [color, setColor] = useState("");

  const loadServices = useCallback(async () => {
    try {
      const response = await fetch(`/api/c/${companySlug}/services`);
      if (response.ok) {
        const data = await response.json();
        setServices(data);
      }
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  }, [companySlug, tCommon]);

  useEffect(() => {
    loadServices();
  }, [loadServices]);

  // Sorting helper
  const sortedServices = useMemo(() => {
    if (!sortColumn) return services;

    return [...services].sort((a, b) => {
      let comparison = 0;

      if (sortColumn === "name") {
        comparison = a.name.localeCompare(b.name);
      } else if (sortColumn === "duration") {
        comparison = a.duration - b.duration;
      } else if (sortColumn === "price") {
        comparison = Number(a.price) - Number(b.price);
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [services, sortColumn, sortDirection]);

  // Selection helpers
  function toggleSelectAll() {
    if (selectedIds.size === services.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(services.map((s) => s.id)));
    }
  }

  function toggleSelectOne(id: string) {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  }

  // Sorting handler
  function handleSort(column: "name" | "duration" | "price") {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  // Get sort icon for column
  function getSortIcon(column: "name" | "duration" | "price") {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  }

  // Bulk delete handler
  async function handleBulkDelete() {
    setIsBulkDeleting(true);

    try {
      const deletePromises = Array.from(selectedIds).map((id) =>
        fetch(`/api/c/${companySlug}/services/${id}`, { method: "DELETE" })
      );

      const results = await Promise.allSettled(deletePromises);
      const successCount = results.filter((r) => r.status === "fulfilled" && (r as PromiseFulfilledResult<Response>).value.ok).length;
      const failCount = selectedIds.size - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} service(s) deleted successfully`);
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} service(s)`);
      }

      setSelectedIds(new Set());
      setIsBulkDeleteOpen(false);
      loadServices();
    } catch {
      toast.error("Failed to delete services. Please try again.");
    } finally {
      setIsBulkDeleting(false);
    }
  }

  // Get selected service names for confirmation
  function getSelectedServiceNames(): string[] {
    return services
      .filter((s) => selectedIds.has(s.id))
      .map((s) => s.name);
  }

  function openCreateDialog() {
    setEditingService(null);
    setName("");
    setDescription("");
    setDuration("60");
    setPrice("0");
    setColor("");
    setIsDialogOpen(true);
  }

  function openEditDialog(service: Service) {
    setEditingService(service);
    setName(service.name);
    setDescription(service.description || "");
    setDuration(service.duration.toString());
    setPrice(service.price.toString());
    setColor(service.color || "");
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingService
        ? `/api/c/${companySlug}/services/${editingService.id}`
        : `/api/c/${companySlug}/services`;

      const response = await fetch(url, {
        method: editingService ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          duration: parseInt(duration),
          price: parseFloat(price),
          color: color || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 400) {
          toast.error(data.error || "Validation failed. Please check your input.");
        } else {
          toast.error("Failed to save service. Please try again.");
        }
        return;
      }

      toast.success(
        editingService ? t("serviceUpdated") : t("serviceCreated")
      );
      setIsDialogOpen(false);
      loadServices();
    } catch {
      toast.error("Failed to save service. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(serviceId: string) {
    setDeletingServiceId(serviceId);

    try {
      const response = await fetch(
        `/api/c/${companySlug}/services/${serviceId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to delete service. Please try again.");
        return;
      }

      toast.success(t("serviceDeleted"));
      loadServices();
    } catch {
      toast.error("Failed to delete service. Please try again.");
    } finally {
      setDeletingServiceId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between animate-fade-up">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your service offerings
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              {t("addService")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingService ? t("editService") : t("addService")}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("serviceName")}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">{t("serviceDescription")}</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">{t("serviceDuration")}</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="5"
                      max="480"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">{t("servicePrice")}</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{t("serviceColor")}</Label>
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          color === c ? "border-foreground scale-110" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <div className="relative">
                      <input
                        type="color"
                        value={color || "#3B82F6"}
                        onChange={(e) => setColor(e.target.value)}
                        className="absolute inset-0 w-8 h-8 opacity-0 cursor-pointer"
                      />
                      <div
                        className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs ${
                          color && !DEFAULT_COLORS.includes(color)
                            ? "border-foreground"
                            : "border-dashed border-muted-foreground"
                        }`}
                        style={{
                          backgroundColor:
                            color && !DEFAULT_COLORS.includes(color) ? color : "transparent",
                        }}
                      >
                        {(!color || DEFAULT_COLORS.includes(color)) && "+"}
                      </div>
                    </div>
                  </div>
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
                  {tCommon("save")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Services Table Container */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            All Services
          </h3>
        </div>
        {services.length === 0 ? (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
              <PackageOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">{t("noServices")}</p>
            <Button
              onClick={openCreateDialog}
              variant="link"
              className="mt-2 text-primary"
            >
              {t("addService")}
            </Button>
          </div>
        ) : (
          <>
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between bg-muted/50 px-4 py-3 border-b animate-fade-in">
                <span className="text-sm font-medium">
                  {selectedIds.size} service{selectedIds.size !== 1 ? "s" : ""} selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsBulkDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Selected
                </Button>
              </div>
            )}

            <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-12">
                  <Checkbox
                    checked={services.length > 0 && selectedIds.size === services.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="text-xs font-medium">
                  <button
                    type="button"
                    className="flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort("name")}
                  >
                    {tCommon("name")}
                    {getSortIcon("name")}
                  </button>
                </TableHead>
                <TableHead className="text-xs font-medium">
                  <button
                    type="button"
                    className="flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort("duration")}
                  >
                    {tCommon("duration")}
                    {getSortIcon("duration")}
                  </button>
                </TableHead>
                <TableHead className="text-xs font-medium">
                  <button
                    type="button"
                    className="flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort("price")}
                  >
                    {tCommon("price")}
                    {getSortIcon("price")}
                  </button>
                </TableHead>
                <TableHead className="text-xs font-medium text-right">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedServices.map((service, index) => (
                <TableRow
                  key={service.id}
                  className={`hover:bg-muted/50 transition-colors ${
                    selectedIds.has(service.id) ? "bg-primary/5" : ""
                  }`}
                  style={{ animationDelay: `${index * 30}ms` }}
                  data-state={selectedIds.has(service.id) ? "selected" : undefined}
                >
                  <TableCell className="w-12">
                    <Checkbox
                      checked={selectedIds.has(service.id)}
                      onCheckedChange={() => toggleSelectOne(service.id)}
                      aria-label={`Select ${service.name}`}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: service.color || "#3B82F6" }}
                      />
                      <div>
                        <div className="font-medium">{service.name}</div>
                        {service.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {service.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{service.duration} min</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="font-medium">
                      {service.currency} {Number(service.price).toLocaleString()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                        onClick={() => openEditDialog(service)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("deleteService")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{service.name}&quot;? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(service.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              disabled={deletingServiceId === service.id}
                            >
                              {deletingServiceId === service.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              ) : null}
                              {tCommon("delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </>
        )}
      </div>

      {/* Bulk Delete AlertDialog */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} Service{selectedIds.size !== 1 ? "s" : ""}</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The following services will be permanently deleted:
              <ul className="mt-2 list-disc list-inside text-sm">
                {getSelectedServiceNames().slice(0, 5).map((name) => (
                  <li key={name}>{name}</li>
                ))}
                {selectedIds.size > 5 && (
                  <li>...and {selectedIds.size - 5} more</li>
                )}
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Delete {selectedIds.size} Service{selectedIds.size !== 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
