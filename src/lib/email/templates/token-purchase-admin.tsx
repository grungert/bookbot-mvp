import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface TokenPurchaseAdminEmailProps {
  userName: string;
  userEmail: string;
  packName: string;
  tokenAmount: number;
  priceEurCents: number;
  paymentReference: string;
  purchaseId: string;
  adminPanelUrl: string;
}

export function TokenPurchaseAdminEmail({
  userName,
  userEmail,
  packName,
  tokenAmount,
  priceEurCents,
  paymentReference,
  purchaseId,
  adminPanelUrl,
}: TokenPurchaseAdminEmailProps) {
  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;
  const formatTokens = (amount: number) => amount.toLocaleString("en-US");

  return (
    <Html>
      <Head />
      <Preview>New token purchase request from {userName} - BookBot Admin</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>New Token Purchase Request</Heading>

          <Text style={paragraph}>
            A new token purchase request has been submitted and is awaiting
            payment confirmation.
          </Text>

          <Section style={detailsBox}>
            <Text style={sectionTitle}>User Information</Text>
            <Text style={detailRow}>
              <strong>Name:</strong> {userName || "Not provided"}
            </Text>
            <Text style={detailRow}>
              <strong>Email:</strong> {userEmail}
            </Text>
            <Text style={detailRow}>
              <strong>Purchase ID:</strong> {purchaseId}
            </Text>
          </Section>

          <Section style={detailsBox}>
            <Text style={sectionTitle}>Purchase Details</Text>
            <Text style={detailRow}>
              <strong>Pack:</strong> {packName}
            </Text>
            <Text style={detailRow}>
              <strong>Tokens:</strong> {formatTokens(tokenAmount)} tokens
            </Text>
            <Hr style={hrSmall} />
            <Text style={totalRow}>
              <strong>Amount to Collect:</strong> {formatPrice(priceEurCents)}
            </Text>
          </Section>

          <Section style={referenceBox}>
            <Text style={referenceLabel}>Payment Reference</Text>
            <Text style={referenceValue}>{paymentReference}</Text>
          </Section>

          <Text style={paragraph}>
            Once you receive and confirm the bank transfer payment with the above
            reference, approve the request in the admin panel to credit the
            user&apos;s token balance.
          </Text>

          <Section style={buttonContainer}>
            <Link href={adminPanelUrl} style={button}>
              Open Admin Panel
            </Link>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            BookBot Super Admin Notification
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

const sectionTitle = {
  fontSize: "14px",
  fontWeight: "bold",
  color: "#1a1a1a",
  marginBottom: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const detailRow = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#484848",
  marginBottom: "8px",
};

const totalRow = {
  fontSize: "18px",
  lineHeight: "24px",
  color: "#1a1a1a",
  marginTop: "8px",
  fontWeight: "bold",
};

const referenceBox = {
  backgroundColor: "#fff3cd",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const referenceLabel = {
  fontSize: "12px",
  color: "#856404",
  marginBottom: "4px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const referenceValue = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#856404",
  fontFamily: "monospace",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const button = {
  backgroundColor: "#3B82F6",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "6px",
  textDecoration: "none",
  fontSize: "14px",
  fontWeight: "bold",
};

const hr = {
  borderColor: "#e6e6e6",
  margin: "24px 0",
};

const hrSmall = {
  borderColor: "#e6e6e6",
  margin: "12px 0",
};

const footer = {
  fontSize: "12px",
  lineHeight: "16px",
  color: "#9ca299",
  textAlign: "center" as const,
};

export default TokenPurchaseAdminEmail;
