import { expect, test } from "@playwright/test";

const origin = "http://127.0.0.1:3102";
const bearer = { Authorization: "Bearer test-capture-key" };
const basic = {
  Authorization: `Basic ${Buffer.from("owner:test-workspace-password").toString("base64")}`,
};

test("Workspace authentication and capture-only Bearer access", async ({ request }) => {
  expect((await request.get(`${origin}/api/prompts`)).status()).toBe(401);
  expect((await request.get(`${origin}/inbox`)).status()).toBe(401);
  expect((await request.get(`${origin}/api/prompts`, { headers: bearer })).status()).toBe(401);
  expect((await request.get(`${origin}/api/prompts`, { headers: basic })).status()).toBe(200);
  expect(
    (
      await request.post(`${origin}/api/prompts`, { data: { content: "unauthenticated" } })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.post(`${origin}/api/prompts`, {
        headers: { Authorization: "Bearer wrong-key" },
        data: { content: "invalid key" },
      })
    ).status(),
  ).toBe(401);
  const response = await request.post(`${origin}/api/prompts`, {
    headers: bearer,
    data: { content: "A captured prompt", aiOrganize: false },
  });
  expect(response.status()).toBe(201);
  const { prompt } = await response.json();
  expect(
    (
      await request.patch(`${origin}/api/prompts/${prompt.id}`, {
        headers: bearer,
        data: { title: "Not permitted" },
      })
    ).status(),
  ).toBe(401);
  expect(
    (await request.delete(`${origin}/api/prompts/${prompt.id}`, { headers: bearer })).status(),
  ).toBe(401);
  expect(
    (await request.delete(`${origin}/api/prompts/${prompt.id}`, { headers: basic })).status(),
  ).toBe(200);
});

test("AI extraction preserves exact content and honors a manual title", async ({ request }) => {
  const content = "  Input: source code.\nProcess: review risks.\nOutput: findings.  ";
  const response = await request.post(`${origin}/api/prompts`, {
    headers: bearer,
    data: { content, title: "My chosen title", source: "Claude", aiOrganize: true },
  });
  expect(response.status()).toBe(201);
  const result = await response.json();
  expect(result).toMatchObject({
    success: true,
    organization: "ai",
    prompt: {
      content,
      title: "My chosen title",
      description: "A structured code review workflow.",
      category: "Coding",
      type: "skill",
      tags: ["review", "engineering"],
      source: "claude",
    },
  });
  await request.delete(`${origin}/api/prompts/${result.prompt.id}`, { headers: basic });
});

for (const failure of [
  "INVALID_JSON",
  "INVALID_CATEGORY",
  "REWRITTEN_CONTENT",
  "HTTP_ERROR",
  "TIMEOUT",
]) {
  test(`AI ${failure} still saves original content with fallback`, async ({ request }) => {
    const content = `${failure}\nOriginal content stays intact.`;
    const response = await request.post(`${origin}/api/prompts`, {
      headers: bearer,
      data: { content, aiOrganize: true },
    });
    expect(response.status()).toBe(201);
    const result = await response.json();
    expect(result).toMatchObject({
      organization: "fallback",
      prompt: {
        content,
        title: content.slice(0, 30),
        description: "",
        category: "Other",
        tags: [],
        type: "prompt",
      },
    });
    await request.delete(`${origin}/api/prompts/${result.prompt.id}`, { headers: basic });
  });
}

test("Authenticated browser can save using same-origin requests", async ({ browser }) => {
  const context = await browser.newContext({
    httpCredentials: { username: "owner", password: "test-workspace-password" },
  });
  try {
    const page = await context.newPage();
    await page.goto(`${origin}/inbox`);
    await page.getByRole("button", { name: "Add prompt", exact: true }).last().click();
    await page.locator("#prompt-content").fill("Authenticated browser capture");
    await page.getByLabel("AI organize automatically").uncheck();
    await page.getByRole("button", { name: "Save prompt", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByTestId("prompt-card")).toHaveCount(1);
  } finally {
    await context.close();
  }
});
