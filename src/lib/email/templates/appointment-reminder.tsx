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

interface AppointmentReminderEmailProps {
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  duration: number;
  companyName: string;
}

export function AppointmentReminderEmail({
  customerName,
  serviceName,
  date,
  time,
  duration,
  companyName,
}: AppointmentReminderEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Reminder: Your appointment with {companyName} is tomorrow</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Appointment Reminder</Heading>

          <Text style={paragraph}>Hi {customerName},</Text>

          <Text style={paragraph}>
            This is a friendly reminder that you have an upcoming appointment tomorrow.
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
          </Section>

          <Text style={paragraph}>
            If you need to reschedule or cancel, please do so as soon as possible.
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

export default AppointmentReminderEmail;
