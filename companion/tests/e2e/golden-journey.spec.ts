import { expect, test, type Locator, type Page, type Response } from "@playwright/test";

import type {
  ChatResponse,
  MemoryDecisionResponse,
  OutboundMessage,
  TaskCompletionResponse,
} from "../../src/contracts/api";

const DEMO_PIN = "1937";
const API_TIMEOUT_MS = 90_000;

function isPostTo(response: Response, pathname: string | RegExp): boolean {
  if (response.request().method() !== "POST") return false;

  const responsePath = new URL(response.url()).pathname;
  return typeof pathname === "string"
    ? responsePath === pathname
    : pathname.test(responsePath);
}

function waitForPost(page: Page, pathname: string | RegExp): Promise<Response> {
  return page.waitForResponse(
    (response) => isPostTo(response, pathname),
    { timeout: API_TIMEOUT_MS },
  );
}

async function clickCardAction(card: Locator): Promise<void> {
  const childButton = card.getByRole("button");
  if ((await childButton.count()) > 0) {
    await childButton.first().click();
    return;
  }

  await card.click();
}

async function signIn(page: Page): Promise<void> {
  // A cold Next.js dev server may compile the client bundle before the
  // bootstrap request can resolve to the PIN screen.
  await expect(page.getByTestId("pin-input")).toBeVisible({
    timeout: API_TIMEOUT_MS,
  });
  await page.getByTestId("pin-input").fill(DEMO_PIN);

  const authResponsePromise = waitForPost(page, "/api/auth/pin");
  await page.getByTestId("pin-submit").click();
  const authResponse = await authResponsePromise;

  expect(authResponse.ok()).toBe(true);
  await expect(page.getByTestId("chat-composer")).toBeVisible({
    timeout: API_TIMEOUT_MS,
  });
  await expect(page.getByTestId("pin-entry-message")).toContainText("••••");
  await expect(page.getByTestId("pin-entry-message")).not.toContainText(DEMO_PIN);
}

async function resetDemo(page: Page): Promise<void> {
  await page.getByTestId("conversation-details").click();
  await expect(page.getByTestId("demo-reset")).toBeVisible();
  const resetResponsePromise = waitForPost(page, "/api/demo/reset");
  await page.getByTestId("demo-reset").click();
  const resetResponse = await resetResponsePromise;

  expect(resetResponse.ok()).toBe(true);
  await expect(resetResponse.json()).resolves.toMatchObject({
    reset: true,
    sessionInvalidated: true,
  });
  await expect(page.getByTestId("pin-input")).toBeVisible({
    timeout: API_TIMEOUT_MS,
  });
  await expect(page.getByTestId("chat-composer")).toBeHidden();
}

async function sendMessage(page: Page, text: string): Promise<ChatResponse> {
  await page.getByTestId("chat-composer").fill(text);

  const chatResponsePromise = waitForPost(page, "/api/chat/messages");
  await page.getByTestId("send-message").click();
  const chatResponse = await chatResponsePromise;

  expect(chatResponse.ok()).toBe(true);
  return (await chatResponse.json()) as ChatResponse;
}

test.describe("local-LLM demo journey", () => {
  test("PIN, morning check-in, practice, checklist progress, resource, and reset", async ({
    page,
  }) => {
    test.setTimeout(240_000);

    // Match Next's default development origin. The readiness probe may use
    // 127.0.0.1, but Next blocks dev assets from that alternate origin unless
    // it is explicitly allowlisted.
    await page.goto("http://localhost:3000/");

    // Reset once after authentication so the journey is repeatable after an
    // interrupted local run, then sign in to the clean seeded state.
    await signIn(page);
    await resetDemo(page);
    await signIn(page);

    await page.getByTestId("conversation-details").click();
    await expect(page.getByTestId("morning-trigger")).toBeVisible();
    const morningResponsePromise = waitForPost(page, "/api/demo/morning");
    await page.getByTestId("morning-trigger").click();
    const morningResponse = await morningResponsePromise;
    expect(morningResponse.ok()).toBe(true);

    const morning = (await morningResponse.json()) as OutboundMessage;
    expect(morning.kind).toBe("morning_check_in");
    expect(morning.message.text.trim().length).toBeGreaterThan(0);
    await page.keyboard.press("Escape");
    await expect(page.getByText(morning.message.text, { exact: true })).toBeVisible();

    const practiceTurn = await sendMessage(
      page,
      "I'm anxious about my appointment tomorrow.",
    );
    const practiceAction = practiceTurn.message.actions.find(
      (action) => action.type === "practice",
    );
    expect(practiceAction).toBeTruthy();
    expect(practiceTurn.message.text).toContain("Take it slow");

    const practiceCard = page.getByTestId("practice-card").last();
    await expect(practiceCard).toBeVisible();
    if (practiceAction?.type === "practice") {
      await expect(practiceCard).toContainText(practiceAction.title);
    }

    const memoryTurn = await sendMessage(
      page,
      "Remember that I prefer text messages.",
    );
    expect(
      memoryTurn.message.actions.some(
        (action) => action.type === "confirm_memory",
      ),
    ).toBe(true);
    const memoryResponsePromise = waitForPost(
      page,
      /^\/api\/memories\/[^/]+\/decision$/,
    );
    await page.getByTestId("memory-accept").last().click();
    const memoryResponse = await memoryResponsePromise;
    expect(memoryResponse.ok()).toBe(true);
    const memory = (await memoryResponse.json()) as MemoryDecisionResponse;
    expect(memory.memory.status).toBe("accepted");
    await expect(page.getByTestId("memory-status").last()).toHaveText("Saved");

    const completionTurn = await sendMessage(
      page,
      "I have my release ID or DMV receipt.",
    );
    expect(
      completionTurn.message.actions.some(
        (action) => action.type === "confirm_task_completion",
      ),
    ).toBe(true);

    const completionCard = page.getByTestId("task-completion-card").last();
    await expect(completionCard).toBeVisible();

    const completionResponsePromise = waitForPost(
      page,
      /^\/api\/tasks\/[^/]+\/complete$/,
    );
    await clickCardAction(completionCard);
    const completionResponse = await completionResponsePromise;
    expect(completionResponse.ok()).toBe(true);

    const completion = (await completionResponse.json()) as TaskCompletionResponse;
    expect(completion.completedTask.id).toBe("release-id-receipt");
    expect(completion.completedTask.status).toBe("completed");
    expect(completion.newlyUnlocked).toEqual([]);

    const resourceTurn = await sendMessage(page, "How do I apply for CalFresh food benefits?");
    expect(
      resourceTurn.message.actions.some((action) => action.type === "resources"),
    ).toBe(true);

    const resourceCard = page.getByTestId("resource-card").last();
    await expect(resourceCard).toBeVisible();
    await expect(resourceCard).toContainText("Official, reviewed guide");
    await expect(resourceCard).toContainText(/CalFresh|food benefits/i);
    await expect(resourceCard).toContainText("Start an application at BenefitsCal.com");
    await expect(resourceCard.getByRole("link", { name: "Open official site" })).toHaveAttribute(
      "href",
      "https://benefitscal.com/",
    );

    const foodFollowUp = await sendMessage(
      page,
      "I don't have an address or photo ID. Can I still start?",
    );
    expect(
      foodFollowUp.message.actions.some(
        (action) =>
          action.type === "resources" &&
          action.resources.some((resource) => resource.id === "calfresh-los-angeles"),
      ),
    ).toBe(true);
    const foodFollowUpCard = page.getByTestId("resource-card").last();
    await expect(foodFollowUpCard).toContainText("no housing");
    await expect(foodFollowUpCard).toContainText("photo ID is not required");

    const birthGuideTurn = await sendMessage(
      page,
      "What are the steps to request a birth certificate?",
    );
    expect(
      birthGuideTurn.message.actions.some((action) => action.type === "resources"),
    ).toBe(true);
    const birthGuideCard = page.getByTestId("resource-card").last();
    await expect(birthGuideCard).toContainText("Los Angeles County birth certificate");
    await expect(birthGuideCard).toContainText("authorized certified copy");
    await expect(birthGuideCard.getByRole("link", { name: "Open official site" })).toHaveAttribute(
      "href",
      "https://www.lavote.gov/home/records/birth-records/birth-records-request",
    );

    const recordCleaningTurn = await sendMessage(
      page,
      "How do I clear my criminal record in California?",
    );
    expect(
      recordCleaningTurn.message.actions.some(
        (action) =>
          action.type === "resources" &&
          action.resources.some(
            (resource) => resource.id === "california-record-cleaning",
          ),
      ),
    ).toBe(true);
    const recordCleaningCard = page.getByTestId("resource-card").last();
    await expect(recordCleaningCard).toContainText("California criminal-record cleaning");
    await expect(recordCleaningCard).toContainText("case-specific instructions");
    await expect(
      recordCleaningCard.getByRole("link", { name: "Open official site" }),
    ).toHaveAttribute(
      "href",
      "https://selfhelp.courts.ca.gov/clean-your-record",
    );

    await resetDemo(page);

    // Quick exit must hide the conversation immediately and invalidate the
    // cookie-backed session, even on a shared demo device.
    await signIn(page);
    const logoutResponsePromise = waitForPost(page, "/api/auth/logout");
    await page.getByTestId("quick-exit").click();
    const logoutResponse = await logoutResponsePromise;
    expect(logoutResponse.ok()).toBe(true);
    await expect(page.getByTestId("pin-input")).toBeVisible();
    await expect(page.getByTestId("chat-composer")).toBeHidden();
    const bootstrapAfterExit = await page.request.get(
      "http://localhost:3000/api/bootstrap",
    );
    expect(bootstrapAfterExit.status()).toBe(401);
  });
});
