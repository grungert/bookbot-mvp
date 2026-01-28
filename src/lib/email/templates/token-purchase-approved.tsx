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

interface TokenPurchaseApprovedEmailProps {
  userName: string;
  packName: string;
  tokenAmount: number;
  adminNotes?: string;
}

export function TokenPurchaseApprovedEmail({
  userName,
  packName,
  tokenAmount,
  adminNotes,
}: TokenPurchaseApprovedEmailProps) {
  const formatTokens = (amount: number) => amount.toLocaleString("en-US");

  return (
    <Html>
      <Head />
      <Preview>Your tokens have been added to your account - BookBot</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Token Purchase Approved!</Heading>

          <Text style={paragraph}>Hi {userName},</Text>

          <Text style={paragraph}>
            Great news! Your token purchase has been approved and the tokens have
            been added to your account.
          </Text>

          <Section style={detailsBox}>
            <Text style={sectionTitle}>Purchase Details</Text>
            <Text style={detailRow}>
              <strong>Pack:</strong> {packName}
            </Text>
            <Text style={detailRow}>
              <strong>Tokens Added:</strong> {formatTokens(tokenAmount)} tokens
            </Text>
          </Section>

          {adminNotes && (
            <Section style={notesBox}>
              <Text style={sectionTitle}>Additional Information</Text>
              <Text style={notesText}>{adminNotes}</Text>
            </Section>
          )}

          <Text style={paragraph}>
            Your tokens are now available and ready to use. Log in to your
            account to start using them right away.
          </Text>

          <Text style={paragraph}>
            Thank you for choosing BookBot! If you have any questions, please
            don&apos;t hesitate to contact our support team.
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

const notesBox = {
  backgroundColor: "#fff3e0",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "24px",
};

const notesText = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#484848",
  marginBottom: "0",
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

export default TokenPurchaseApprovedEmail;
