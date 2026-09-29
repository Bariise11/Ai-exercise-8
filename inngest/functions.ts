import { inngest } from "./client";

// 1) Welcome user: multi-step + sleep
export const userRegistered = inngest.createFunction(
  { id: "user-registered" },
  { event: "user/registered" },
  async ({ event, step }) => {
    const email = await step.run("send-welcome-email", async () => {
      console.log("Welcome email ->", event.data.email);
      return { email: event.data.email, status: "sent" };
    });

    await step.sleep("wait-a-bit", "5s");

    await step.run("send-followup", async () => {
      console.log("Follow-up ->", event.data.email);
      return { status: "sent" };
    });

    return { done: true, email };
  }
);

// 2) Multi-step data processor (step.run x3)
export const dataProcessor = inngest.createFunction(
  { id: "data-processor" },
  { event: "data/process" },
  async ({ step }) => {
    const rawData = await step.run("fetch-data", async () => {
      await new Promise((r) => setTimeout(r, 1000));
      return { users: ["Alice", "Bob", "Charlie"] };
    });

    const transformed = await step.run("transform-data", async () => {
      return rawData.users.map((user) => ({
        name: user,
        email: `${user.toLowerCase()}@example.com`,
      }));
    });

    const saved = await step.run("save-data", async () => {
      console.log("Saving", transformed.length, "records");
      return { saved: transformed.length };
    });

    return { transformed, saved };
  }
);

// 3) Approval workflow: waitForEvent
export const approvalWorkflow = inngest.createFunction(
  { id: "approval-workflow" },
  { event: "workflow/request" },
  async ({ event, step }) => {
    const { requestId } = event.data;

    const approval = await step.waitForEvent("wait-for-approval", {
      event: "workflow/approval",
      timeout: "1h",
      match: "data.requestId",
    });

    if (!approval) {
      return { requestId, status: "timeout" };
    }

    await step.run("execute-action", async () => {
      console.log("Approved, executing", requestId);
      return { ok: true };
    });

    return { requestId, status: "approved" };
  }
);

// 4) Retries + concurrency
export const flaky = inngest.createFunction(
  { id: "flaky-task", retries: 3, concurrency: { limit: 2 } },
  { event: "task/flaky" },
  async ({ step }) => {
    return await step.run("maybe-fail", async () => {
      if (Math.random() < 0.6) throw new Error("Random failure, will retry");
      return { ok: true };
    });
  }
);

// 5) Cron
export const dailyReport = inngest.createFunction(
  { id: "daily-report" },
  { cron: "0 9 * * *" },
  async ({ step }) => {
    await step.run("generate-report", async () => {
      console.log("Daily report generated");
      return { ok: true };
    });
  }
);

export const functions = [
  userRegistered,
  dataProcessor,
  approvalWorkflow,
  flaky,
  dailyReport,
];
