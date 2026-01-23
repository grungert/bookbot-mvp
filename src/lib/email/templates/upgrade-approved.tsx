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

interface UpgradeApprovedEmailProps {
  userName: string;
  planName: string;
  includeChatbot: boolean;
  extraCompanyCount: number;
}

export function UpgradeApprovedEmail({
  userName,
  planName,
  includeChatbot,
  extraCompanyCount,
}: UpgradeApprovedEmailProps) {
  const totalCompanies = 1 + extraCompanyCount;

  return (
    <Html>
      <Head />
      <Preview>Your subscription has been activated - BookBot</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Subscription Activated!</Heading>

          <Text style={paragraph}>Hi {userName},</Text>

          <Text style={paragraph}>
            Great news! Your upgrade to the {planName} plan has been approved and
            your subscription is now active.
          </Text>

          <Section style={detailsBox}>
            <Text style={sectionTitle}>Your Plan Details</Text>
            <Text style={detailRow}>
              <strong>Plan:</strong> {planName}
            </Text>
            <Text style={detailRow}>
              <strong>Companies:</strong> {totalCompanies} {totalCompanies === 1 ? "company" : "companies"}
            </Text>
            <Text style={detailRow}>
              <strong>AI Chatbot:</strong> {includeChatbot ? "Included" : "Not included"}
            </Text>
          </Section>

          <Text style={paragraph}>
            You now have full access to all the features included in your plan.
            Log in to your account to start using them right away.
          </Text>

          <Text style={paragraph}>
            Thank you for choosing BookBot! If you have any questions about your
            subscription, please don't hesitate to contact our support team.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            This email was sent by BookBot. If you have any questions, please
            contact our support team.
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
  backgroundColor: "#e8f5e9",
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

export default UpgradeApprovedEmail;
