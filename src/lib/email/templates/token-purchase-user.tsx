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

interface TokenPurchaseUserEmailProps {
  userName: string;
  packName: string;
  tokenAmount: number;
  priceEurCents: number;
  paymentReference: string;
  bankName: string;
  bankAccountName: string;
  bankIban: string;
  bankBic: string;
}

export function TokenPurchaseUserEmail({
  userName,
  packName,
  tokenAmount,
  priceEurCents,
  paymentReference,
  bankName,
  bankAccountName,
  bankIban,
  bankBic,
}: TokenPurchaseUserEmailProps) {
  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;
  const formatTokens = (amount: number) => amount.toLocaleString("en-US");

  return (
    <Html>
      <Head />
      <Preview>Your token purchase request has been received - BookBot</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Token Purchase Request Received</Heading>

          <Text style={paragraph}>Hi {userName},</Text>

          <Text style={paragraph}>
            Thank you for your token purchase request. Your request has been
            received and is pending payment confirmation.
          </Text>

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
              <strong>Total:</strong> {formatPrice(priceEurCents)}
            </Text>
          </Section>

          <Section style={detailsBox}>
            <Text style={sectionTitle}>Bank Transfer Details</Text>
            <Text style={detailRow}>
              <strong>Bank:</strong> {bankName}
            </Text>
            <Text style={detailRow}>
              <strong>Account Name:</strong> {bankAccountName}
            </Text>
            <Text style={detailRow}>
              <strong>IBAN:</strong> {bankIban}
            </Text>
            <Text style={detailRow}>
              <strong>BIC/SWIFT:</strong> {bankBic}
            </Text>
            <Text style={referenceRow}>
              <strong>Payment Reference:</strong> {paymentReference}
            </Text>
          </Section>

          <Text style={paragraph}>
            <strong>Important:</strong> Please include the payment reference in your
            bank transfer to ensure we can match your payment to your account.
          </Text>

          <Text style={paragraph}>
            Once we confirm your payment, your tokens will be added to your
            account automatically and you will receive a confirmation email.
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
  fontSize: "16px",
  lineHeight: "24px",
  color: "#1a1a1a",
  marginTop: "8px",
};

const referenceRow = {
  fontSize: "14px",
  lineHeight: "20px",
  color: "#1a1a1a",
  marginBottom: "0",
  backgroundColor: "#fff3cd",
  padding: "8px 12px",
  borderRadius: "4px",
  marginTop: "8px",
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

export default TokenPurchaseUserEmail;
