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

interface BookingConfirmationEmailProps {
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  duration: number;
  companyName: string;
  notes?: string;
}

export function BookingConfirmationEmail({
  customerName,
  serviceName,
  date,
  time,
  duration,
  companyName,
  notes,
}: BookingConfirmationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your appointment with {companyName} is confirmed</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Appointment Confirmed</Heading>

          <Text style={paragraph}>Hi {customerName},</Text>

          <Text style={paragraph}>
            Your appointment has been successfully booked. Here are the details:
          </Text>

          <Section style={detailsBox}>
            <Text style={detailRow}>
              <strong>Service:</strong> {serviceName}
            </Text>
            <Text style={detailRow}>
              <strong>Date:</strong> {date}
            </Text>
            <Text style={detailRow}>
              <strong>Time:</strong> {time}
            </Text>
            <Text style={detailRow}>
              <strong>Duration:</strong> {duration} minutes
            </Text>
            {notes && (
              <Text style={detailRow}>
                <strong>Notes:</strong> {notes}
              </Text>
            )}
          </Section>

          <Text style={paragraph}>
            Your appointment is pending confirmation from {companyName}.
            You will receive another email once it&apos;s confirmed.
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

export default BookingConfirmationEmail;
