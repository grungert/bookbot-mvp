import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

interface GenerateInvoiceParams {
  companyId: string;
  userId: string;
  appointmentId: string;
  serviceName: string;
  serviceDuration: number;
  servicePrice: Prisma.Decimal | number;
  serviceCurrency: string;
  taxRate?: Prisma.Decimal | number | null;
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
    serviceName,
    serviceDuration,
    servicePrice,
    serviceCurrency,
    taxRate,
  } = params;

  // Check if invoice already exists for this appointment
  const existingInvoice = await prisma.invoice.findFirst({
    where: { appointmentId },
  });

  if (existingInvoice) {
    return existingInvoice;
  }

  // Convert price to number for calculations
  const price = typeof servicePrice === "object"
    ? Number(servicePrice)
    : servicePrice;

  // Use company tax rate, default to 20% if not set
  const taxRateValue = taxRate != null
    ? (typeof taxRate === "object" ? Number(taxRate) : taxRate)
    : 20;

  // Calculate totals
  const subtotal = price;
  const tax = subtotal * (taxRateValue / 100);
  const total = subtotal + tax;

  const invoiceNumber = await generateInvoiceNumber(companyId);

  // Set due date to 14 days from now
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 14);

  const invoice = await prisma.invoice.create({
    data: {
      companyId,
      userId,
      appointmentId,
      invoiceNumber,
      status: "SENT", // Automatically sent to customer
      dueDate,
      subtotal,
      tax,
      total,
      currency: serviceCurrency,
      lineItems: {
        create: [
          {
            description: `${serviceName} (${serviceDuration} min)`,
            quantity: 1,
            unitPrice: price,
            total: price,
          },
        ],
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
