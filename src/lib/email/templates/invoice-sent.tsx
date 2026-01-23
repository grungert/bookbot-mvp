import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
  Link,
} from "@react-email/components";

interface InvoiceSentEmailProps {
  customerName: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  total: string;
  currency: string;
  companyName: string;
  invoiceUrl?: string;
}

export function InvoiceSentEmail({
  customerName,
  invoiceNumber,
  issueDate,
  dueDate,
  total,
  currency,
  companyName,
  invoiceUrl,
}: InvoiceSentEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Invoice #{invoiceNumber} from {companyName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Invoice #{invoiceNumber}</Heading>

          <Text style={paragraph}>Hi {customerName},</Text>

          <Text style={paragraph}>
            Please find below the details of your invoice from {companyName}.
          </Text>

          <Section style={detailsBox}>
            <Text style={detailRow}>
              <strong>Invoice Number:</strong> {invoiceNumber}
            </Text>
            <Text style={detailRow}>
              <strong>Issue Date:</strong> {issueDate}
            </Text>
            <Text style={detailRow}>
              <strong>Due Date:</strong> {dueDate}
            </Text>
            <Text style={totalRow}>
              <strong>Total Amount:</strong> {total} {currency}
            </Text>
          </Section>

          {invoiceUrl && (
            <Section style={buttonContainer}>
              <Link href={invoiceUrl} style={button}>
                View Invoice
              </Link>
            </Section>
          )}

          <Text style={paragraph}>
            If you have any questions about this invoice, please don&apos;t hesitate to contact us.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            This email was sent by {companyName} via BookBot.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "40px 20px",
  borderRadius: "8px",
  maxWidth: "560px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  color: "#1a1a1a",
  marginBottom: "24px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#484848",
  marginBottom: "16px",
};

const detailsBox = {
  backgroundColor: "#f6f9fc",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
};

const detailRow = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#484848",
  marginBottom: "8px",
};

const totalRow = {
  fontSize: "16px",
  lineHeight: "24px",
  color: "#1a1a1a",
  marginTop: "12px",
  paddingTop: "12px",
  borderTop: "1px solid #e6e6e6",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const button = {
  backgroundColor: "#3B82F6",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "12px 24px",
  display: "inline-block",
};

const hr = {
  borderColor: "#e6e6e6",
  margin: "24px 0",
};

const footer = {
  fontSize: "12px",
  lineHeight: "16px",
  color: "#9ca299",
  textAlign: "center" as const,
};

export default InvoiceSentEmail;
