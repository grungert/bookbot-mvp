import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { calculateDiscountedPrice, isDiscountActive } from "@/lib/utils/discount";

interface GenerateInvoiceParams {
  companyId: string;
  userId: string;
  appointmentId: string;
  appointmentDate: Date;
  serviceName: string;
  serviceDuration: number;
  servicePrice: Prisma.Decimal | number;
  serviceCurrency: string;
  taxRate?: Prisma.Decimal | number | null;
  // Discount fields
  discountType?: string | null;
  discountValue?: Prisma.Decimal | number | null;
  discountStartDate?: Date | null;
  discountEndDate?: Date | null;
}

/**
 * Generates an invoice number in the format INV-YYYY-XXXXX
 */
async function generateInvoiceNumber(companyId: string): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.invoice.count({
    where: {
      companyId,
      createdAt: {
        gte: new Date(`${year}-01-01`),
      },
    },
  });
  return `INV-${year}-${String(count + 1).padStart(5, "0")}`;
}

/**
 * Creates an invoice for an appointment.
 * Used when an appointment is confirmed.
 */
export async function createInvoiceForAppointment(
  params: GenerateInvoiceParams
) {
  const {
    companyId,
    userId,
    appointmentId,
    appointmentDate,
    serviceName,
    serviceDuration,
    servicePrice,
    serviceCurrency,
    taxRate,
    discountType,
    discountValue,
    discountStartDate,
    discountEndDate,
  } = params;

  // Check if invoice already exists for this appointment
  const existingInvoice = await prisma.invoice.findFirst({
    where: { appointmentId },
  });

  if (existingInvoice) {
    return existingInvoice;
  }

  // Convert price to number for calculations
  const originalPrice = typeof servicePrice === "object"
    ? Number(servicePrice)
    : servicePrice;

  // Check if discount is active and calculate discounted price
  const serviceWithDiscount = {
    price: originalPrice,
    currency: serviceCurrency,
    discountType: discountType as "percentage" | "fixed" | null,
    discountValue: discountValue != null
      ? (typeof discountValue === "object" ? Number(discountValue) : discountValue)
      : null,
    discountStartDate,
    discountEndDate,
  };

  const discountResult = calculateDiscountedPrice(serviceWithDiscount);
  const finalPrice = discountResult.finalPrice;

  // Use company tax rate, default to 20% if not set
  const taxRateValue = taxRate != null
    ? (typeof taxRate === "object" ? Number(taxRate) : taxRate)
    : 20;

  // Calculate totals using final (discounted) price
  const subtotal = finalPrice;
  const tax = subtotal * (taxRateValue / 100);
  const total = subtotal + tax;

  const invoiceNumber = await generateInvoiceNumber(companyId);

  // Set due date to 14 days from now
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  // Prepare line item data with discount info if applicable
  const lineItemData: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
    originalUnitPrice?: number;
    discountType?: string;
    discountValue?: number;
    discountPercentage?: number;
  } = {
    description: `${serviceName} (${serviceDuration} min)`,
    quantity: 1,
    unitPrice: finalPrice,
    total: finalPrice,
  };

  // Add discount info to line item if discount was applied
  if (discountResult.isDiscounted) {
    lineItemData.originalUnitPrice = originalPrice;
    lineItemData.discountType = discountType || undefined;
    lineItemData.discountValue = discountValue != null
      ? (typeof discountValue === "object" ? Number(discountValue) : discountValue)
      : undefined;
    lineItemData.discountPercentage = discountResult.discountPercentage;
  }

  const invoice = await prisma.invoice.create({
    data: {
      companyId,
      userId,
      appointmentId,
      appointmentDate,
      invoiceNumber,
      status: "SENT", // Automatically sent to customer
      dueDate,
      subtotal,
      tax,
      total,
      currency: serviceCurrency,
      lineItems: {
        create: [lineItemData],
      },
    },
    include: {
      lineItems: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return invoice;
}
