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
} from "@react-email/components";

interface InvoicePaidEmailProps {
  customerName: string;
  invoiceNumber: string;
  paidDate: string;
  total: string;
  currency: string;
  companyName: string;
}

export function InvoicePaidEmail({
  customerName,
  invoiceNumber,
  paidDate,
  total,
  currency,
  companyName,
}: InvoicePaidEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Payment received for Invoice #{invoiceNumber}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Payment Received</Heading>

          <Text style={paragraph}>Hi {customerName},</Text>

          <Text style={paragraph}>
            Thank you! We have received your payment for the following invoice:
          </Text>

          <Section style={detailsBox}>
            <Text style={detailRow}>
              <strong>Invoice Number:</strong> {invoiceNumber}
            </Text>
            <Text style={detailRow}>
              <strong>Payment Date:</strong> {paidDate}
            </Text>
            <Text style={totalRow}>
              <strong>Amount Paid:</strong> {total} {currency}
            </Text>
          </Section>

          <Section style={successBadge}>
            <Text style={successText}>PAID IN FULL</Text>
          </Section>

          <Text style={paragraph}>
            Thank you for your business. We appreciate your prompt payment.
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

const successBadge = {
  backgroundColor: "#dcfce7",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const successText = {
  fontSize: "14px",
  fontWeight: "bold",
  color: "#166534",
  margin: "0",
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

export default InvoicePaidEmail;
