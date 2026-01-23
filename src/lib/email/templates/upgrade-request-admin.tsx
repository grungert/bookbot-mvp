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

interface UpgradeRequestAdminEmailProps {
  userName: string;
  userEmail: string;
  planName: string;
  includeChatbot: boolean;
  extraCompanyCount: number;
  basePrice: number; // EUR cents
  chatbotPrice: number; // EUR cents
  extraCompaniesPrice: number; // EUR cents
  totalMonthlyPrice: number; // EUR cents
  paymentReference: string;
  adminPanelUrl: string;
  requestId: string;
}

export function UpgradeRequestAdminEmail({
  userName,
  userEmail,
  planName,
  includeChatbot,
  extraCompanyCount,
  basePrice,
  chatbotPrice,
  extraCompaniesPrice,
  totalMonthlyPrice,
  paymentReference,
  adminPanelUrl,
  requestId,
}: UpgradeRequestAdminEmailProps) {
  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;

  return (
    <Html>
      <Head />
      <Preview>New upgrade request from {userName} - BookBot Admin</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>New Upgrade Request</Heading>

          <Text style={paragraph}>
            A new upgrade request has been submitted and is awaiting payment
            confirmation.
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
              <strong>Request ID:</strong> {requestId}
            </Text>
          </Section>

          <Section style={detailsBox}>
            <Text style={sectionTitle}>Plan Configuration</Text>
            <Text style={detailRow}>
              <strong>Plan:</strong> {planName}
            </Text>
            <Text style={detailRow}>
              <strong>Base Price:</strong> {formatPrice(basePrice)}/month
            </Text>
            <Text style={detailRow}>
              <strong>AI Chatbot:</strong> {includeChatbot ? `Yes (+${formatPrice(chatbotPrice)}/month)` : "No"}
            </Text>
            <Text style={detailRow}>
              <strong>Extra Companies:</strong> {extraCompanyCount > 0 ? `${extraCompanyCount} (+${formatPrice(extraCompaniesPrice)}/month)` : "None"}
            </Text>
            <Hr style={hrSmall} />
            <Text style={totalRow}>
              <strong>Amount to Collect:</strong> {formatPrice(totalMonthlyPrice)}/month
            </Text>
          </Section>

          <Section style={referenceBox}>
            <Text style={referenceLabel}>Payment Reference</Text>
            <Text style={referenceValue}>{paymentReference}</Text>
          </Section>

          <Text style={paragraph}>
            Once you receive and confirm the bank transfer payment with the above
            reference, approve the request in the admin panel to activate the
            user&apos;s subscription.
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

export default UpgradeRequestAdminEmail;
