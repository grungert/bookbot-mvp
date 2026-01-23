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

interface UpgradeRequestUserEmailProps {
  userName: string;
  planName: string;
  includeChatbot: boolean;
  extraCompanyCount: number;
  basePrice: number; // EUR cents
  chatbotPrice: number; // EUR cents
  extraCompaniesPrice: number; // EUR cents
  totalMonthlyPrice: number; // EUR cents
  bankName: string;
  bankAccountName: string;
  bankIban: string;
  bankBic: string;
  paymentReference: string;
}

export function UpgradeRequestUserEmail({
  userName,
  planName,
  includeChatbot,
  extraCompanyCount,
  basePrice,
  chatbotPrice,
  extraCompaniesPrice,
  totalMonthlyPrice,
  bankName,
  bankAccountName,
  bankIban,
  bankBic,
  paymentReference,
}: UpgradeRequestUserEmailProps) {
  const formatPrice = (cents: number) => `€${(cents / 100).toFixed(2)}`;

  return (
    <Html>
      <Head />
      <Preview>Your upgrade request has been received - BookBot</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Upgrade Request Received</Heading>

          <Text style={paragraph}>Hi {userName},</Text>

          <Text style={paragraph}>
            Thank you for your upgrade request to the {planName} plan. Your request
            has been received and is pending payment confirmation.
          </Text>

          <Section style={detailsBox}>
            <Text style={sectionTitle}>Plan Details</Text>
            <Text style={detailRow}>
              <strong>Plan:</strong> {planName}
            </Text>
            <Text style={detailRow}>
              <strong>Base Price:</strong> {formatPrice(basePrice)}/month
            </Text>
            {includeChatbot && (
              <Text style={detailRow}>
                <strong>AI Chatbot Add-on:</strong> +{formatPrice(chatbotPrice)}/month
              </Text>
            )}
            {extraCompanyCount > 0 && (
              <Text style={detailRow}>
                <strong>Extra Companies ({extraCompanyCount}):</strong> +{formatPrice(extraCompaniesPrice)}/month
              </Text>
            )}
            <Hr style={hrSmall} />
            <Text style={totalRow}>
              <strong>Total Monthly:</strong> {formatPrice(totalMonthlyPrice)}/month
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
            Once we confirm your payment, your subscription will be activated
            automatically and you will receive a confirmation email.
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

export default UpgradeRequestUserEmail;
