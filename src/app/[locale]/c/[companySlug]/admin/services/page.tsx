"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Pencil, Trash2, Loader2, PackageOpen } from "lucide-react";

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
      <div className="flex items-center justify-between">
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
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium">{tCommon("name")}</TableHead>
                <TableHead className="text-xs font-medium">{tCommon("duration")}</TableHead>
                <TableHead className="text-xs font-medium">{tCommon("price")}</TableHead>
                <TableHead className="text-xs font-medium text-right">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.map((service) => (
                <TableRow key={service.id} className="hover:bg-muted/50 transition-colors">
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
        )}
      </div>
    </div>
  );
}
