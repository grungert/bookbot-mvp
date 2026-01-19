"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { format, parseISO } from "date-fns";
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
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, FileText, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export default function DocumentsPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");

  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);

  // Selection and sorting state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<"title" | "updatedAt" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const loadDocuments = useCallback(async () => {
    try {
      const response = await fetch(`/api/c/${companySlug}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  }, [companySlug, tCommon]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  function openCreateDialog() {
    setEditingDocument(null);
    setTitle("");
    setContent("");
    setIsDialogOpen(true);
  }

  function openEditDialog(doc: Document) {
    setEditingDocument(doc);
    setTitle(doc.title);
    setContent(doc.content);
    setIsDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = editingDocument
        ? `/api/c/${companySlug}/documents/${editingDocument.id}`
        : `/api/c/${companySlug}/documents`;

      const response = await fetch(url, {
        method: editingDocument ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 400) {
          toast.error(data.error || "Validation failed. Please check your input.");
        } else {
          toast.error("Failed to save document. Please try again.");
        }
        return;
      }

      toast.success(editingDocument ? "Document updated" : "Document created");
      setIsDialogOpen(false);
      loadDocuments();
    } catch {
      toast.error("Failed to save document. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(documentId: string) {
    setDeletingDocumentId(documentId);

    try {
      const response = await fetch(
        `/api/c/${companySlug}/documents/${documentId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || "Failed to delete document. Please try again.");
        return;
      }

      toast.success("Document deleted");
      loadDocuments();
    } catch {
      toast.error("Failed to delete document. Please try again.");
    } finally {
      setDeletingDocumentId(null);
    }
  }

  // Sorting helper
  const sortedDocuments = useMemo(() => {
    if (!sortColumn) return documents;

    return [...documents].sort((a, b) => {
      let comparison = 0;

      if (sortColumn === "title") {
        comparison = a.title.localeCompare(b.title);
      } else if (sortColumn === "updatedAt") {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [documents, sortColumn, sortDirection]);

  // Selection helpers
  function toggleSelectAll() {
    if (selectedIds.size === documents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map((doc) => doc.id)));
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
  function handleSort(column: "title" | "updatedAt") {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  }

  // Get sort icon for column
  function getSortIcon(column: "title" | "updatedAt") {
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
        fetch(`/api/c/${companySlug}/documents/${id}`, { method: "DELETE" })
      );

      const results = await Promise.allSettled(deletePromises);
      const successCount = results.filter((r) => r.status === "fulfilled" && (r as PromiseFulfilledResult<Response>).value.ok).length;
      const failCount = selectedIds.size - successCount;

      if (successCount > 0) {
        toast.success(`${successCount} document(s) deleted successfully`);
      }
      if (failCount > 0) {
        toast.error(`Failed to delete ${failCount} document(s)`);
      }

      setSelectedIds(new Set());
      setIsBulkDeleteOpen(false);
      loadDocuments();
    } catch {
      toast.error("Failed to delete documents. Please try again.");
    } finally {
      setIsBulkDeleting(false);
    }
  }

  // Get selected document titles for confirmation
  function getSelectedDocumentTitles(): string[] {
    return documents
      .filter((doc) => selectedIds.has(doc.id))
      .map((doc) => doc.title);
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
          <h1 className="text-2xl font-bold">{t("documents")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Add documents to your knowledge base for the AI chatbot
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              {t("uploadDocument")}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingDocument ? "Edit Document" : "Add Document"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="FAQ, Pricing, About Us, etc."
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Enter the document content that will be used by the AI..."
                    rows={12}
                    required
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
                  {tCommon("save")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Documents Table Container */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Knowledge Base
          </h3>
        </div>
        {documents.length === 0 ? (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">
              No documents in your knowledge base yet
            </p>
            <Button onClick={openCreateDialog} variant="link" className="text-primary">
              Add your first document
            </Button>
          </div>
        ) : (
          <>
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between bg-muted/50 px-4 py-3 border-b animate-fade-in">
                <span className="text-sm font-medium">
                  {selectedIds.size} document{selectedIds.size !== 1 ? "s" : ""} selected
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
                      checked={documents.length > 0 && selectedIds.size === documents.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead className="text-xs font-medium">
                    <button
                      type="button"
                      className="flex items-center hover:text-foreground transition-colors"
                      onClick={() => handleSort("title")}
                    >
                      Title
                      {getSortIcon("title")}
                    </button>
                  </TableHead>
                  <TableHead className="text-xs font-medium">Preview</TableHead>
                  <TableHead className="text-xs font-medium">
                    <button
                      type="button"
                      className="flex items-center hover:text-foreground transition-colors"
                      onClick={() => handleSort("updatedAt")}
                    >
                      Last Updated
                      {getSortIcon("updatedAt")}
                    </button>
                  </TableHead>
                  <TableHead className="text-xs font-medium text-right">{tCommon("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDocuments.map((doc, index) => (
                  <TableRow
                    key={doc.id}
                    className={`hover:bg-muted/50 transition-colors ${
                      selectedIds.has(doc.id) ? "bg-primary/5" : ""
                    }`}
                    style={{ animationDelay: `${index * 30}ms` }}
                    data-state={selectedIds.has(doc.id) ? "selected" : undefined}
                  >
                    <TableCell className="w-12">
                      <Checkbox
                        checked={selectedIds.has(doc.id)}
                        onCheckedChange={() => toggleSelectOne(doc.id)}
                        aria-label={`Select ${doc.title}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground text-sm">
                      {doc.content.substring(0, 100)}...
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{format(parseISO(doc.updatedAt), "MMM d, yyyy")}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                          onClick={() => openEditDialog(doc)}
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
                              <AlertDialogTitle>Delete Document?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;{doc.title}&quot;? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(doc.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                disabled={deletingDocumentId === doc.id}
                              >
                                {deletingDocumentId === doc.id ? (
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
            <AlertDialogTitle>Delete {selectedIds.size} Document{selectedIds.size !== 1 ? "s" : ""}</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The following documents will be permanently deleted:
              <ul className="mt-2 list-disc list-inside text-sm">
                {getSelectedDocumentTitles().slice(0, 5).map((title) => (
                  <li key={title}>{title}</li>
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
              Delete {selectedIds.size} Document{selectedIds.size !== 1 ? "s" : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
