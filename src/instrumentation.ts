export async function register() {
  // Only run on the server side (not during build or on client)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initCronJobs } = await import("@/lib/cron/scheduler");
    initCronJobs();
  }
}
