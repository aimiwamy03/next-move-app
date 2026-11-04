export function onboardingMessage(preferredName?: string): string {
  const greeting = preferredName
    ? `👋 Hi ${preferredName}, I’m Boundless.`
    : "👋 Hi, I’m Boundless.";

  return `${greeting}

I’m here to make your next steps feel more manageable. What would you like to do?

1️⃣ Work on my checklist — choose one useful next step.
2️⃣ Find a resource — get trusted information and official links.
3️⃣ Take a mindful pause — try a short practice when things feel heavy.

Reply 1, 2, or 3—or ask me anything.`;
}
