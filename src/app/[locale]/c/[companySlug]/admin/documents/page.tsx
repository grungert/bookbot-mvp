"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Plus, Pencil, Trash2, Loader2, FileText, ArrowUpDown, ArrowUp, ArrowDown, X, Search, Copy, ChevronLeft, ChevronRight, AlertTriangle, Eye, RefreshCw, RotateCcw, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { ChatWidget } from "@/components/chat/chat-widget";
import { LimitModal, useLimitModal } from "@/components/subscription/limit-modal";
import { cn } from "@/lib/utils";
import MDEditor from "@uiw/react-md-editor";

interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const MAX_CONTENT_SIZE = 100 * 1024; // 100KB - must match API
const DEFAULT_MAX_TOKENS = 1500; // Default max tokens per document

export default function DocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const companySlug = params.companySlug as string;
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");
  const { resolvedTheme } = useTheme();

  // Limit modal state
  const { modalState, showLimitModal, setModalOpen } = useLimitModal();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingDocumentId, setDeletingDocumentId] = useState<string | null>(null);

  // Selection and sorting state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sortColumn, setSortColumn] = useState<"title" | "updatedAt" | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [titleError, setTitleError] = useState("");
  const [contentError, setContentError] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [showDirtyWarning, setShowDirtyWarning] = useState(false);

  // Track original values for dirty detection
  const [originalTitle, setOriginalTitle] = useState("");
  const [originalContent, setOriginalContent] = useState("");

  // System prompt preview state
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isLoadingPrompt, setIsLoadingPrompt] = useState(false);

  // Chat widget state
  const [chatKey, setChatKey] = useState(0);
  const [primaryColor, setPrimaryColor] = useState<string>("#10b981");

  // Token limit state
  const [maxTokens, setMaxTokens] = useState(DEFAULT_MAX_TOKENS);

  const loadDocuments = useCallback(async (page = 1) => {
    try {
      const response = await fetch(`/api/c/${companySlug}/documents?page=${page}&limit=20`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents);
        setPagination(data.pagination);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || t("loadError") || tCommon("error"));
      }
    } catch {
      toast.error(t("networkError") || tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  }, [companySlug, t, tCommon]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  // Load company settings for primary color
  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch(`/api/c/${companySlug}/settings`);
        if (response.ok) {
          const data = await response.json();
          if (data.primaryColor) {
            setPrimaryColor(data.primaryColor);
          }
        }
      } catch {
        // Ignore errors, use default color
      }
    }
    loadSettings();
  }, [companySlug]);

  // Load document token limit
  useEffect(() => {
    async function loadTokenLimit() {
      try {
        const response = await fetch("/api/settings/document-limit");
        if (response.ok) {
          const data = await response.json();
          if (data.maxTokens) {
            setMaxTokens(data.maxTokens);
          }
        }
      } catch {
        // Ignore errors, use default
      }
    }
    loadTokenLimit();
  }, []);

  // Load system prompt preview
  const loadSystemPrompt = useCallback(async () => {
    setIsLoadingPrompt(true);
    try {
      const response = await fetch(`/api/c/${companySlug}/chat/preview`);
      if (response.ok) {
        const data = await response.json();
        setSystemPrompt(data.prompt);
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || t("loadError") || tCommon("error"));
      }
    } catch {
      toast.error(t("networkError") || tCommon("error"));
    } finally {
      setIsLoadingPrompt(false);
    }
  }, [companySlug, t, tCommon]);

  // Reset chat widget
  const handleResetChat = () => {
    setChatKey((prev) => prev + 1);
  };

  // Body scroll lock when panel is open
  useEffect(() => {
    if (isPanelOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isPanelOpen]);

  // Escape key handler
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isPanelOpen) {
        e.preventDefault();
        handleClosePanel();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isPanelOpen, isDirty]);

  // Check dirty state
  useEffect(() => {
    const hasChanges = title !== originalTitle || content !== originalContent;
    setIsDirty(hasChanges);
  }, [title, content, originalTitle, originalContent]);

  function resetForm() {
    setTitle("");
    setContent("");
    setOriginalTitle("");
    setOriginalContent("");
    setTitleError("");
    setContentError("");
    setIsDirty(false);
  }

  function openCreatePanel() {
    resetForm();
    setEditingDocument(null);
    setIsPanelOpen(true);
  }

  function openEditPanel(doc: Document) {
    setEditingDocument(doc);
    setTitle(doc.title);
    setContent(doc.content);
    setOriginalTitle(doc.title);
    setOriginalContent(doc.content);
    setTitleError("");
    setContentError("");
    setIsDirty(false);
    setIsPanelOpen(true);
  }

  function handleClosePanel() {
    if (isDirty) {
      setShowDirtyWarning(true);
    } else {
      closePanel();
    }
  }

  function closePanel() {
    setIsPanelOpen(false);
    setShowDirtyWarning(false);
    setTimeout(() => {
      setEditingDocument(null);
      resetForm();
    }, 300);
  }

  function validateForm(): boolean {
    let isValid = true;

    // Validate title
    if (!title.trim()) {
      setTitleError(t("titleRequired") || "Title is required");
      isValid = false;
    } else if (title.length > 200) {
      setTitleError(t("titleTooLong") || "Title must be 200 characters or less");
      isValid = false;
    } else {
      setTitleError("");
    }

    // Validate content
    if (!content.trim()) {
      setContentError(t("contentRequired") || "Content is required");
      isValid = false;
    } else if (content.length > MAX_CONTENT_SIZE) {
      setContentError(t("contentTooLarge") || `Content must be ${MAX_CONTENT_SIZE / 1024}KB or less`);
      isValid = false;
    } else {
      setContentError("");
    }

    return isValid;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingDocument
        ? `/api/c/${companySlug}/documents/${editingDocument.id}`
        : `/api/c/${companySlug}/documents`;

      const response = await fetch(url, {
        method: editingDocument ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        // Handle document limit exceeded (429)
        if (response.status === 429 && data.code === "DOCUMENT_LIMIT") {
          showLimitModal(
            "DOCUMENT_LIMIT",
            data.currentUsage,
            data.limit,
            null
          );
          return;
        }

        if (response.status === 400) {
          // Handle validation errors from API
          if (data.details?.fieldErrors) {
            const fieldErrors = data.details.fieldErrors;
            if (fieldErrors.title?.[0]) {
              setTitleError(fieldErrors.title[0]);
            }
            if (fieldErrors.content?.[0]) {
              setContentError(fieldErrors.content[0]);
            }
          }
          toast.error(data.error || t("validationFailed") || "Validation failed. Please check your input.");
        } else if (response.status === 401) {
          toast.error(t("unauthorized") || "You are not authorized to perform this action.");
        } else if (response.status === 403) {
          toast.error(t("forbidden") || "Access denied.");
        } else if (response.status === 404) {
          toast.error(t("documentNotFound") || "Document not found.");
        } else {
          toast.error(data.error || t("saveFailed") || "Failed to save document. Please try again.");
        }
        return;
      }

      toast.success(editingDocument ? t("documentUpdated") || "Document updated" : t("documentCreated") || "Document created");
      closePanel();
      loadDocuments(pagination.page);
    } catch {
      toast.error(t("networkError") || "Network error. Please check your connection and try again.");
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
        const data = await response.json().catch(() => ({}));
        if (response.status === 404) {
          toast.error(t("documentNotFound") || "Document not found.");
        } else {
          toast.error(data.error || t("deleteFailed") || "Failed to delete document. Please try again.");
        }
        return;
      }

      toast.success(t("documentDeleted") || "Document deleted");
      loadDocuments(pagination.page);
    } catch {
      toast.error(t("networkError") || "Network error. Please check your connection and try again.");
    } finally {
      setDeletingDocumentId(null);
    }
  }

  // Document duplication
  async function handleDuplicate(doc: Document) {
    const duplicatedTitle = `${doc.title} (${t("copy") || "Copy"})`;
    setEditingDocument(null);
    setTitle(duplicatedTitle);
    setContent(doc.content);
    setOriginalTitle("");
    setOriginalContent("");
    setTitleError("");
    setContentError("");
    setIsDirty(true);
    setIsPanelOpen(true);
  }

  // Sorting helper - now includes search filtering
  const filteredAndSortedDocuments = useMemo(() => {
    let filtered = documents;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = documents.filter(
        (doc) =>
          doc.title.toLowerCase().includes(query) ||
          doc.content.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    if (!sortColumn) return filtered;

    return [...filtered].sort((a, b) => {
      let comparison = 0;

      if (sortColumn === "title") {
        comparison = a.title.localeCompare(b.title);
      } else if (sortColumn === "updatedAt") {
        comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [documents, sortColumn, sortDirection, searchQuery]);

  // Selection helpers - only select from filtered documents
  function toggleSelectAll() {
    const filteredIds = filteredAndSortedDocuments.map((doc) => doc.id);
    if (selectedIds.size === filteredIds.length && filteredIds.every((id) => selectedIds.has(id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredIds));
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

  // Bulk delete handler - fixed race condition
  async function handleBulkDelete() {
    setIsBulkDeleting(true);

    try {
      const deletePromises = Array.from(selectedIds).map((id) =>
        fetch(`/api/c/${companySlug}/documents/${id}`, { method: "DELETE" })
          .then((response) => ({ id, ok: response.ok, response }))
          .catch(() => ({ id, ok: false, response: null }))
      );

      const results = await Promise.allSettled(deletePromises);

      let successCount = 0;
      let failCount = 0;

      for (const result of results) {
        if (result.status === "fulfilled" && result.value.ok) {
          successCount++;
        } else {
          failCount++;
        }
      }

      if (successCount > 0) {
        toast.success(
          t("documentsDeletedCount", { count: successCount }) ||
          `${successCount} document(s) deleted successfully`
        );
      }
      if (failCount > 0) {
        toast.error(
          t("documentsDeleteFailedCount", { count: failCount }) ||
          `Failed to delete ${failCount} document(s)`
        );
      }

      setSelectedIds(new Set());
      setIsBulkDeleteOpen(false);
      loadDocuments(pagination.page);
    } catch {
      toast.error(t("networkError") || "Network error. Please try again.");
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

  // Pagination handlers
  function handlePageChange(newPage: number) {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setSelectedIds(new Set());
      loadDocuments(newPage);
    }
  }

  // Character, word, and token count
  const characterCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
  const tokenCount = Math.ceil(characterCount / 4); // Simple token estimation: ~4 chars per token
  const tokenPercent = Math.round((tokenCount / maxTokens) * 100);
  const isApproachingLimit = tokenPercent >= 80 && tokenPercent < 100;
  const isOverLimit = tokenCount > maxTokens;

  // Check if all filtered documents are selected
  const allFilteredSelected = filteredAndSortedDocuments.length > 0 &&
    filteredAndSortedDocuments.every((doc) => selectedIds.has(doc.id));

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadDocuments(pagination.page);
    } finally {
      setIsRefreshing(false);
    }
  };

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
            {t("documentsSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
          </Button>
          <Button onClick={openCreatePanel} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            {t("uploadDocument")}
          </Button>
        </div>
      </div>

      {/* Documents Table Container */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t("knowledgeBase")}
            {pagination.total > 0 && (
              <span className="ml-2 text-xs font-normal normal-case">
                ({pagination.total} {pagination.total === 1 ? t("document") : t("documentsPlural")})
              </span>
            )}
          </h3>
          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("searchDocuments") || "Search documents..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
        </div>
        {documents.length === 0 ? (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
              <FileText className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">
              {t("noDocuments")}
            </p>
            <Button onClick={openCreatePanel} variant="link" className="text-primary">
              {t("addFirstDocument")}
            </Button>
          </div>
        ) : filteredAndSortedDocuments.length === 0 ? (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
              <Search className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">
              {t("noSearchResults") || "No documents match your search"}
            </p>
            <Button onClick={() => setSearchQuery("")} variant="link" className="text-primary">
              {t("clearSearch") || "Clear search"}
            </Button>
          </div>
        ) : (
          <>
            {/* Bulk Actions Bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center justify-between bg-muted/50 px-4 py-3 border-b animate-fade-in">
                <span className="text-sm font-medium">
                  {selectedIds.size} {selectedIds.size !== 1 ? t("documentsPlural") : t("document")} {t("selected")}
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setIsBulkDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("deleteSelected")}
                </Button>
              </div>
            )}

            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={allFilteredSelected}
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
                      {t("documentTitle")}
                      {getSortIcon("title")}
                    </button>
                  </TableHead>
                  <TableHead className="text-xs font-medium">{t("preview")}</TableHead>
                  <TableHead className="text-xs font-medium text-right">{t("Tokens") || "Tokens"}</TableHead>
                  <TableHead className="text-xs font-medium">
                    <button
                      type="button"
                      className="flex items-center hover:text-foreground transition-colors"
                      onClick={() => handleSort("updatedAt")}
                    >
                      {t("lastUpdated")}
                      {getSortIcon("updatedAt")}
                    </button>
                  </TableHead>
                  <TableHead className="text-xs font-medium text-right">{tCommon("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedDocuments.map((doc, index) => (
                  <TableRow
                    key={doc.id}
                    className={cn(
                      "hover:bg-muted/50 transition-colors cursor-pointer",
                      selectedIds.has(doc.id) && "bg-primary/5"
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                    data-state={selectedIds.has(doc.id) ? "selected" : undefined}
                    onClick={() => openEditPanel(doc)}
                  >
                    <TableCell className="w-12" onClick={(e) => e.stopPropagation()}>
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
                    <TableCell className="text-right">
                      {(() => {
                        const docTokens = Math.ceil(doc.content.length / 4);
                        const docPercent = Math.round((docTokens / maxTokens) * 100);
                        return (
                          <span className={cn(
                            "text-sm tabular-nums",
                            docTokens > maxTokens && "text-destructive font-medium"
                          )}>
                            {docTokens.toLocaleString()} ({docPercent}%)
                          </span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{format(parseISO(doc.updatedAt), "MMM d, yyyy")}</span>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-muted"
                          onClick={() => handleDuplicate(doc)}
                          title={t("duplicate") || "Duplicate"}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary"
                          onClick={() => openEditPanel(doc)}
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
                              <AlertDialogTitle>{t("deleteDocument")}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                {t("deleteDocumentConfirm", { title: doc.title })}
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

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <p className="text-sm text-muted-foreground">
                  {t("showing") || "Showing"} {((pagination.page - 1) * pagination.limit) + 1}-
                  {Math.min(pagination.page * pagination.limit, pagination.total)} {t("of") || "of"} {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {tCommon("previous")}
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    {tCommon("next")}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* System Prompt Preview Section */}
      <div className="rounded-xl border bg-card overflow-hidden w-full max-w-full">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("systemPromptPreview") || "System Prompt Preview"}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadSystemPrompt}
              disabled={isLoadingPrompt}
            >
              {isLoadingPrompt ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {systemPrompt ? (t("refresh") || "Refresh") : (t("loadPreview") || "Load Preview")}
            </Button>
            {systemPrompt && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPromptPreview(!showPromptPreview)}
              >
                {showPromptPreview ? (
                  <ChevronUp className="h-4 w-4 mr-2" />
                ) : (
                  <ChevronDown className="h-4 w-4 mr-2" />
                )}
                {showPromptPreview ? (t("collapse") || "Collapse") : (t("expand") || "Expand")}
              </Button>
            )}
            {systemPrompt && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(systemPrompt);
                  toast.success(t("copiedToClipboard") || "Copied to clipboard");
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                {t("copy") || "Copy"}
              </Button>
            )}
          </div>
        </div>
        {!systemPrompt ? (
          <div className="py-12 text-center">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted mb-4">
              <Eye className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">
              {t("noPromptLoaded") || "Click \"Load Preview\" to see the full system prompt"}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("promptDescription") || "This shows what the AI receives, including bot identity, services, tools, and knowledge base."}
            </p>
          </div>
        ) : showPromptPreview ? (
          <div className="p-4 w-full max-w-full overflow-hidden" data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}>
            <div className="max-h-[600px] w-full max-w-full overflow-y-auto overflow-x-hidden">
              <div className="w-full max-w-full prose prose-sm dark:prose-invert break-words overflow-hidden [&>*]:max-w-full [&_pre]:overflow-x-auto [&_pre]:whitespace-pre-wrap [&_code]:break-all [&_code]:whitespace-pre-wrap">
                <MDEditor.Markdown source={systemPrompt} style={{ background: "transparent", maxWidth: "100%", overflow: "hidden" }} />
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground">
              {t("promptCollapsed") || "Prompt loaded. Click \"Expand\" to view."}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {systemPrompt.length.toLocaleString()} {t("characters") || "characters"}
            </p>
          </div>
        )}
      </div>

      {/* Test Chat Section */}
      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {t("testChat") || "Test Chat"}
            </h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetChat}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            {t("resetChat") || "Reset"}
          </Button>
        </div>
        <div className="h-[500px]">
          <ChatWidget
            key={chatKey}
            companySlug={companySlug}
            primaryColor={primaryColor}
            embedded={true}
          />
        </div>
      </div>

      {/* Bulk Delete AlertDialog */}
      <AlertDialog open={isBulkDeleteOpen} onOpenChange={setIsBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDocuments")} ({selectedIds.size})</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDocumentsConfirm")}
              <ul className="mt-2 list-disc list-inside text-sm">
                {getSelectedDocumentTitles().slice(0, 5).map((docTitle) => (
                  <li key={docTitle}>{docTitle}</li>
                ))}
                {selectedIds.size > 5 && (
                  <li>...{t("andMore", { count: selectedIds.size - 5 })}</li>
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
              {tCommon("delete")} ({selectedIds.size})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dirty State Warning Dialog */}
      <AlertDialog open={showDirtyWarning} onOpenChange={setShowDirtyWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("unsavedChanges") || "Unsaved Changes"}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("unsavedChangesDescription") || "You have unsaved changes. Are you sure you want to close without saving?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("keepEditing") || "Keep Editing"}</AlertDialogCancel>
            <AlertDialogAction onClick={closePanel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("discardChanges") || "Discard Changes"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Backdrop overlay for mobile */}
      {isPanelOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={handleClosePanel}
        />
      )}

      {/* Document Editor Slide-in Panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full sm:w-[560px] lg:w-[640px] bg-background border-l shadow-xl",
          "transform transition-transform duration-300 ease-in-out",
          isPanelOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Panel Header */}
          <div className="flex items-center justify-between p-4 border-b shrink-0">
            <h2 className="text-xl font-semibold">
              {editingDocument ? t("editDocument") : t("addDocument")}
            </h2>
            <Button type="button" variant="ghost" size="icon" onClick={handleClosePanel}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Panel Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t("documentTitle")}</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError) setTitleError("");
                }}
                placeholder={t("documentTitlePlaceholder")}
                className={cn(titleError && "border-destructive focus-visible:ring-destructive")}
                aria-invalid={!!titleError}
              />
              {titleError && (
                <p className="text-sm text-destructive">{titleError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {title.length}/200 {t("characters") || "characters"}
              </p>
            </div>

            <div className="space-y-2" data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}>
              <Label htmlFor="content">{t("documentContent")}</Label>
              <div className="md-editor-wrapper">
                <MDEditor
                  key={editingDocument?.id || "new"}
                  value={content}
                  onChange={(value) => {
                    setContent(value || "");
                    if (contentError) setContentError("");
                  }}
                  height={500}
                  preview="edit"
                  textareaProps={{
                    placeholder: t("documentContentPlaceholder"),
                  }}
                />
              </div>
              {contentError && (
                <p className="text-sm text-destructive">{contentError}</p>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {wordCount} {t("words") || "words"} · {characterCount.toLocaleString()} {t("characters") || "characters"} · {tokenCount.toLocaleString()} {t("tokens") || "tokens"}
                </span>
                <span className={cn(
                  isOverLimit && "text-destructive font-medium",
                  isApproachingLimit && "text-yellow-600 dark:text-yellow-500"
                )}>
                  {(isApproachingLimit || isOverLimit) && (
                    <AlertTriangle className="inline h-3 w-3 mr-1" />
                  )}
                  {tokenCount.toLocaleString()} / {maxTokens.toLocaleString()} {t("tokens") || "tokens"} ({tokenPercent}%)
                </span>
              </div>
              {isOverLimit && (
                <p className="text-xs text-destructive font-medium">
                  {t("tokenLimitExceeded") || "Document exceeds token limit. Please reduce the content."}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {t("markdownSupport")}
              </p>
            </div>
          </div>

          {/* Panel Footer */}
          <div className="flex items-center justify-between gap-2 p-4 border-t bg-muted/30 shrink-0">
            <div className="text-xs text-muted-foreground">
              {isDirty && (
                <span className="text-yellow-600 dark:text-yellow-500">
                  {t("unsaved") || "Unsaved changes"}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={handleClosePanel}>
                {tCommon("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !title.trim() || isOverLimit}
              >
                {isSubmitting && (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                )}
                {tCommon("save")}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Limit Modal */}
      <LimitModal
        open={modalState.open}
        onOpenChange={setModalOpen}
        limitType={modalState.limitType}
        currentUsage={modalState.currentUsage}
        limit={modalState.limit}
        resetsAt={modalState.resetsAt}
        onUpgrade={() => router.push("/#pricing")}
      />
    </div>
  );
}
