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
  Link,
} from "@react-email/components";

interface NewBookingAdminEmailProps {
  customerName: string;
  customerEmail: string;
  serviceName: string;
  date: string;
  time: string;
  duration: number;
  companyName: string;
  appointmentUrl?: string;
}

export function NewBookingAdminEmail({
  customerName,
  customerEmail,
  serviceName,
  date,
  time,
  duration,
  companyName,
  appointmentUrl,
}: NewBookingAdminEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New booking: {serviceName} with {customerName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>New Booking Received</Heading>

          <Text style={paragraph}>
            A new appointment has been booked at {companyName}.
          </Text>

          <Section style={detailsBox}>
            <Text style={sectionTitle}>Customer Details</Text>
            <Text style={detailRow}>
              <strong>Name:</strong> {customerName}
            </Text>
            <Text style={detailRow}>
              <strong>Email:</strong> {customerEmail}
            </Text>
          </Section>

          <Section style={detailsBox}>
            <Text style={sectionTitle}>Appointment Details</Text>
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

          {appointmentUrl && (
            <Section style={buttonContainer}>
              <Link href={appointmentUrl} style={button}>
                View Appointment
              </Link>
            </Section>
          )}

          <Text style={paragraph}>
            Please review and confirm this appointment in your admin dashboard.
          </Text>

          <Hr style={hr} />

          <Text style={footer}>
            This is an automated notification from BookBot.
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
  marginBottom: "16px",
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

const buttonContainer = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const button = {
  backgroundColor: "#3B82F6",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "12px 24px",
  display: "inline-block",
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

export default NewBookingAdminEmail;
