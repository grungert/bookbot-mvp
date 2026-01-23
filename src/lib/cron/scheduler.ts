import cron from "node-cron";

let isInitialized = false;

// Test mode: run cron job immediately and every minute for testing
const TEST_MODE = process.env.CRON_TEST_MODE === "true";

export function initCronJobs() {
  // Prevent double initialization
  if (isInitialized) {
    console.log("[CRON] Scheduler already initialized, skipping...");
    return;
  }

  // Only run if ENABLE_CRON is true
  if (process.env.ENABLE_CRON !== "true") {
    console.log("[CRON] Cron jobs disabled (ENABLE_CRON !== true)");
    return;
  }

  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3000";
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("[CRON] CRON_SECRET not set, skipping cron initialization");
    return;
  }

  const timezone = process.env.CRON_TIMEZONE || "Europe/Belgrade";

  console.log("[CRON] Initializing cron jobs...");
  console.log(`[CRON] Timezone: ${timezone}`);

  if (TEST_MODE) {
    console.log("[CRON] ⚠️  TEST MODE ENABLED - Jobs will run every minute");
  }

  // Appointment Reminders
  // Production: Run at 8 AM daily
  // Test mode: Run every minute
  const reminderSchedule = TEST_MODE ? "* * * * *" : "0 8 * * *";

  const runAppointmentReminders = async () => {
    console.log("[CRON] Running appointment reminders job...");
    try {
      const response = await fetch(`${baseUrl}/api/cron/appointment-reminders`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${cronSecret}`,
        },
      });

      const result = await response.json();
      console.log("[CRON] Appointment reminders result:", JSON.stringify(result));
    } catch (error) {
      console.error("[CRON] Failed to run appointment reminders:", error);
    }
  };

  cron.schedule(reminderSchedule, runAppointmentReminders, { timezone });

  console.log(`[CRON] Scheduled: Appointment reminders (${TEST_MODE ? "every minute - TEST MODE" : `daily at 8:00 AM ${timezone}`})`);

  // In test mode, also run immediately
  if (TEST_MODE) {
    console.log("[CRON] Running initial job immediately (test mode)...");
    setTimeout(runAppointmentReminders, 3000); // Wait 3s for server to be ready
  }

  isInitialized = true;
  console.log("[CRON] Cron jobs initialized successfully");
}
