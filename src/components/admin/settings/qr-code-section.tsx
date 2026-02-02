"use client";

import { useEffect, useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Download, Copy, Check, QrCode } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  generateQrCodeDataUrl,
  generateQrCodeSvg,
  generateQrCodePdf,
  downloadDataUrl,
  downloadSvg,
} from "@/lib/utils/qr-code";

interface QrCodeService {
  id: string;
  name: string;
}

interface QrCodeSectionProps {
  companySlug: string;
  primaryColor: string;
  locale: string;
  companyName: string;
  prefersReducedMotion?: boolean;
}

type QrSize = "small" | "medium" | "large";

const SIZE_MAP: Record<QrSize, number> = {
  small: 200,
  medium: 300,
  large: 400,
};

export function QrCodeSection({
  companySlug,
  primaryColor,
  locale,
  companyName,
  prefersReducedMotion = false,
}: QrCodeSectionProps) {
  const t = useTranslations("admin");
  const tCommon = useTranslations("common");

  const [services, setServices] = useState<QrCodeService[]>([]);
  const [selectedService, setSelectedService] = useState<string>("all");
  const [size, setSize] = useState<QrSize>("medium");
  const [useCompanyColor, setUseCompanyColor] = useState(true);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Build the booking URL
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const bookingUrl =
    selectedService === "all"
      ? `${baseUrl}/${locale}/c/${companySlug}/book`
      : `${baseUrl}/${locale}/c/${companySlug}/book?service=${selectedService}`;

  // Load services
  useEffect(() => {
    async function loadServices() {
      try {
        const response = await fetch(`/api/c/${companySlug}/services?all=true`);
        if (response.ok) {
          const data = await response.json();
          const serviceList = data.services || [];
          setServices(
            serviceList.map((s: { id: string; name: string }) => ({
              id: s.id,
              name: s.name,
            }))
          );
        }
      } catch (error) {
        console.error("Failed to load services:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadServices();
  }, [companySlug]);

  // Generate QR code whenever dependencies change
  const generateQr = useCallback(async () => {
    if (!baseUrl) return;

    setIsGenerating(true);
    try {
      const dataUrl = await generateQrCodeDataUrl({
        url: bookingUrl,
        size: SIZE_MAP[size],
        color: useCompanyColor ? primaryColor : "#000000",
        errorCorrectionLevel: "M",
      });
      setQrDataUrl(dataUrl);
    } catch (error) {
      console.error("Failed to generate QR code:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [bookingUrl, size, useCompanyColor, primaryColor, baseUrl]);

  useEffect(() => {
    generateQr();
  }, [generateQr]);

  // Download handlers
  const handleDownloadPng = () => {
    if (!qrDataUrl) return;
    const serviceName =
      selectedService === "all"
        ? "booking"
        : services.find((s) => s.id === selectedService)?.name || "service";
    const filename = `${companySlug}-${serviceName.toLowerCase().replace(/\s+/g, "-")}-qr.png`;
    downloadDataUrl(qrDataUrl, filename);
    toast.success(t("qrCode.downloadSuccess") || "QR code downloaded");
  };

  const handleDownloadSvg = async () => {
    try {
      const svg = await generateQrCodeSvg({
        url: bookingUrl,
        size: SIZE_MAP[size],
        color: useCompanyColor ? primaryColor : "#000000",
        errorCorrectionLevel: "M",
      });
      const serviceName =
        selectedService === "all"
          ? "booking"
          : services.find((s) => s.id === selectedService)?.name || "service";
      const filename = `${companySlug}-${serviceName.toLowerCase().replace(/\s+/g, "-")}-qr.svg`;
      downloadSvg(svg, filename);
      toast.success(t("qrCode.downloadSuccess") || "QR code downloaded");
    } catch (error) {
      console.error("Failed to generate SVG:", error);
      toast.error(tCommon("error"));
    }
  };

  const handleDownloadPdf = () => {
    if (!qrDataUrl) return;
    try {
      const pdf = generateQrCodePdf(
        qrDataUrl,
        companyName,
        bookingUrl,
        t("qrCode.scanToBook") || "Scan to book"
      );
      const serviceName =
        selectedService === "all"
          ? "booking"
          : services.find((s) => s.id === selectedService)?.name || "service";
      const filename = `${companySlug}-${serviceName.toLowerCase().replace(/\s+/g, "-")}-qr.pdf`;
      pdf.save(filename);
      toast.success(t("qrCode.downloadSuccess") || "QR code downloaded");
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      toast.error(tCommon("error"));
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(bookingUrl);
      setCopiedUrl(true);
      toast.success(t("qrCode.urlCopied") || "URL copied to clipboard");
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      toast.error(tCommon("error"));
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border bg-card p-4 mt-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-48 w-48 mx-auto bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-4 mt-6 transition-all duration-300 hover:shadow-lg hover:border-primary/20",
        !prefersReducedMotion && "animate-fade-in-scale"
      )}
      style={
        !prefersReducedMotion ? { opacity: 0, animationDelay: "250ms" } : undefined
      }
    >
      <div className="flex items-center gap-2 mb-1">
        <QrCode className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {t("qrCode.title") || "QR Code Generator"}
        </h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4">
        {t("qrCode.description") ||
          "Generate a QR code for your booking page that customers can scan"}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* QR Code Preview */}
        <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border min-h-[280px]">
          {isGenerating ? (
            <div className="flex items-center justify-center h-[200px] w-[200px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt="QR Code"
              className="max-w-full h-auto"
              style={{ width: SIZE_MAP[size], height: SIZE_MAP[size] }}
            />
          ) : (
            <div className="flex items-center justify-center h-[200px] w-[200px] bg-muted rounded">
              <QrCode className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-4">
          {/* Service Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t("qrCode.selectService") || "Target Page"}
            </Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("qrCode.allServices") || "General Booking Page"}
                </SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">
              {t("qrCode.size") || "Size"}
            </Label>
            <Select
              value={size}
              onValueChange={(value) => setSize(value as QrSize)}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">
                  {t("qrCode.sizeSmall") || "Small"} (200px)
                </SelectItem>
                <SelectItem value="medium">
                  {t("qrCode.sizeMedium") || "Medium"} (300px)
                </SelectItem>
                <SelectItem value="large">
                  {t("qrCode.sizeLarge") || "Large"} (400px)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Use Company Color Toggle */}
          <div className="flex items-center justify-between">
            <Label htmlFor="use-company-color" className="text-sm font-medium">
              {t("qrCode.useCompanyColor") || "Use brand color"}
            </Label>
            <Switch
              id="use-company-color"
              checked={useCompanyColor}
              onCheckedChange={setUseCompanyColor}
            />
          </div>

          {/* Download Buttons */}
          <div className="space-y-2 pt-2">
            <Label className="text-sm font-medium">
              {t("qrCode.download") || "Download"}
            </Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPng}
                disabled={!qrDataUrl || isGenerating}
              >
                <Download className="h-4 w-4 mr-1" />
                PNG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadSvg}
                disabled={isGenerating}
              >
                <Download className="h-4 w-4 mr-1" />
                SVG
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPdf}
                disabled={!qrDataUrl || isGenerating}
              >
                <Download className="h-4 w-4 mr-1" />
                PDF
              </Button>
            </div>
          </div>

          {/* Copy URL */}
          <div className="pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyUrl}
              className="w-full"
            >
              {copiedUrl ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  {t("qrCode.urlCopied") || "URL Copied"}
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  {t("qrCode.copyUrl") || "Copy Booking URL"}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
