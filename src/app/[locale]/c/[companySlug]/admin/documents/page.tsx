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
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, FileText } from "lucide-react";

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

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    loadDocuments();
  }, [companySlug]);

  async function loadDocuments() {
    try {
      const response = await fetch(`/api/c/${companySlug}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data);
      }
    } catch (error) {
      toast.error(tCommon("error"));
    } finally {
      setIsLoading(false);
    }
  }

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
        throw new Error("Failed to save document");
      }

      toast.success(editingDocument ? "Document updated" : "Document created");
      setIsDialogOpen(false);
      loadDocuments();
    } catch (error) {
      toast.error(tCommon("error"));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(documentId: string) {
    if (!confirm("Are you sure you want to delete this document?")) return;

    try {
      const response = await fetch(
        `/api/c/${companySlug}/documents/${documentId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error("Failed to delete document");
      }

      toast.success("Document deleted");
      loadDocuments();
    } catch (error) {
      toast.error(tCommon("error"));
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
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-medium">Title</TableHead>
                <TableHead className="text-xs font-medium">Preview</TableHead>
                <TableHead className="text-xs font-medium">Last Updated</TableHead>
                <TableHead className="text-xs font-medium text-right">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map((doc) => (
                <TableRow key={doc.id} className="hover:bg-muted/50 transition-colors">
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDelete(doc.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
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
