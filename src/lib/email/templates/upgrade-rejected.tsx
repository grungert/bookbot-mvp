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

interface UpgradeRejectedEmailProps {
  userName: string;
  planName: string;
  adminNotes?: string;
}

export function UpgradeRejectedEmail({
  userName,
  planName,
  adminNotes,
}: UpgradeRejectedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Update on your upgrade request - BookBot</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Upgrade Request Update</Heading>

          <Text style={paragraph}>Hi {userName},</Text>

          <Text style={paragraph}>
            We've reviewed your upgrade request for the {planName} plan and
            unfortunately, we were unable to approve it at this time.
          </Text>

          {adminNotes && (
            <Section style={notesBox}>
              <Text style={sectionTitle}>Additional Information</Text>
              <Text style={notesText}>{adminNotes}</Text>
            </Section>
          )}

          <Text style={paragraph}>
            If you have any questions about this decision or would like to
            discuss your options, please don't hesitate to contact our support
            team. We're here to help.
          </Text>

          <Text style={paragraph}>
            You can submit a new upgrade request at any time through your
            account settings.
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

const notesBox = {
  backgroundColor: "#fff3e0",
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

export default UpgradeRejectedEmail;
