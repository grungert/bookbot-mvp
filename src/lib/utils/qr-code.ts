import QRCode from "qrcode";
import jsPDF from "jspdf";

export interface QrCodeOptions {
  url: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
}

/**
 * Generate a QR code as a Data URL (PNG)
 */
export async function generateQrCodeDataUrl(
  options: QrCodeOptions
): Promise<string> {
  const {
    url,
    size = 300,
    color = "#000000",
    backgroundColor = "#FFFFFF",
    errorCorrectionLevel = "M",
  } = options;

  return QRCode.toDataURL(url, {
    width: size,
    margin: 2,
    color: {
      dark: color,
      light: backgroundColor,
    },
    errorCorrectionLevel,
  });
}

/**
 * Generate a QR code as an SVG string
 */
export async function generateQrCodeSvg(
  options: QrCodeOptions
): Promise<string> {
  const {
    url,
    size = 300,
    color = "#000000",
    backgroundColor = "#FFFFFF",
    errorCorrectionLevel = "M",
  } = options;

  return QRCode.toString(url, {
    type: "svg",
    width: size,
    margin: 2,
    color: {
      dark: color,
      light: backgroundColor,
    },
    errorCorrectionLevel,
  });
}

/**
 * Generate a PDF flyer with the QR code
 */
export function generateQrCodePdf(
  qrDataUrl: string,
  companyName: string,
  bookingUrl: string,
  scanToBookText: string
): jsPDF {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  // Company name at top
  pdf.setFontSize(28);
  pdf.setFont("helvetica", "bold");
  const companyNameWidth = pdf.getTextWidth(companyName);
  pdf.text(companyName, (pageWidth - companyNameWidth) / 2, 40);

  // QR Code in center (80mm x 80mm)
  const qrSize = 80;
  const qrX = (pageWidth - qrSize) / 2;
  const qrY = (pageHeight - qrSize) / 2 - 10;
  pdf.addImage(qrDataUrl, "PNG", qrX, qrY, qrSize, qrSize);

  // "Scan to book" text below QR code
  pdf.setFontSize(20);
  pdf.setFont("helvetica", "normal");
  const scanTextWidth = pdf.getTextWidth(scanToBookText);
  pdf.text(scanToBookText, (pageWidth - scanTextWidth) / 2, qrY + qrSize + 15);

  // URL at bottom
  pdf.setFontSize(10);
  pdf.setTextColor(100);
  const urlWidth = pdf.getTextWidth(bookingUrl);
  pdf.text(bookingUrl, (pageWidth - urlWidth) / 2, pageHeight - 20);

  return pdf;
}

/**
 * Download a file from a data URL
 */
export function downloadDataUrl(
  dataUrl: string,
  filename: string
): void {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download an SVG string as a file
 */
export function downloadSvg(svgContent: string, filename: string): void {
  const blob = new Blob([svgContent], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
