import { expect, test } from "@playwright/test";

const content =
  "  Review my interaction design.\n\nPreserve this exact whitespace and the unique needle: capture-verification.\nReturn actionable findings.  ";

test.afterEach(async ({ request }) => {
  const { prompts } = await (await request.get("/api/prompts")).json();
  for (const prompt of prompts as { id: string }[]) {
    if (!prompt.id.startsWith("00000000-")) await request.delete(`/api/prompts/${prompt.id}`);
  }
});

test("Flows 1-5: capture, search, copy, organize, and edit", async ({ page, request }) => {
  const browserErrors: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning")
      browserErrors.push(message.text());
  });
  await page.goto("/inbox");
  await expect(page.getByTestId("prompt-card")).toHaveCount(9);
  await page.getByRole("button", { name: "Add prompt", exact: true }).last().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByLabel("Prompt", { exact: false }).first()).toBeFocused();
  await dialog.locator("#prompt-content").fill(content);
  await dialog.getByLabel("Title").fill("Capture workflow verification");
  await dialog.getByLabel("Source URL").fill("https://example.com/prompt");
  await dialog.getByRole("button", { name: "Save prompt", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const card = page.getByTestId("prompt-card").filter({ hasText: "Capture workflow verification" });
  await expect(card).toBeVisible();
  await page.reload();
  await expect(card).toBeVisible();

  await page.getByRole("textbox", { name: "Search prompts" }).fill("capture-verification");
  await expect(page.getByTestId("prompt-card")).toHaveCount(1);
  await card.getByRole("button", { name: "Copy prompt", exact: true }).click();
  await expect(page.getByText("Copied \u2713", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(content);
  await expect(page).toHaveURL(/\/inbox$/);

  await card.getByRole("button", { name: /More actions/ }).click();
  await page.getByRole("menuitem", { name: "Move to Library" }).click();
  await expect(card).toHaveCount(0);
  await page.getByRole("link", { name: /^Library/ }).click();
  await expect(card).toBeVisible();
  await card.getByRole("link", { name: "Capture workflow verification" }).click();
  await expect(page.locator("pre")).toHaveText(content);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await dialog.getByLabel("Title", { exact: true }).fill("Updated workflow verification");
  await dialog.getByLabel("Description").fill("Edited and persisted");
  await dialog.getByLabel("Category", { exact: true }).selectOption("Design");
  await dialog.getByLabel("Type", { exact: true }).selectOption("template");
  await dialog.getByLabel("Tags", { exact: true }).fill("quality, reusable");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("heading", { name: "Updated workflow verification" })).toBeVisible();
  await expect(page.getByText("Edited and persisted", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Updated workflow verification" })).toBeVisible();

  const id = page.url().split("/").pop();
  const saved = await (await request.get(`/api/prompts/${id}`)).json();
  expect(saved.prompt).toMatchObject({
    title: "Updated workflow verification",
    content,
    category: "Design",
    type: "template",
    tags: ["quality", "reusable"],
    status: "library",
    source: "manual",
    source_url: "https://example.com/prompt",
  });
  expect(saved.prompt.updated_at >= saved.prompt.created_at).toBe(true);
  expect(browserErrors).toEqual([]);
  await request.delete(`/api/prompts/${id}`);
});

test("Flow 6: external creation, normalization and no-key AI fallback", async ({ request }) => {
  const response = await request.post("/api/prompts", {
    data: { content, source: "ChatGPT", aiOrganize: true },
  });
  expect(response.status()).toBe(201);
  const result = await response.json();
  expect(result).toMatchObject({
    success: true,
    organization: "fallback",
    prompt: {
      content,
      title: Array.from(content.trim()).slice(0, 30).join(""),
      category: "Other",
      description: "",
      tags: [],
      type: "prompt",
      status: "inbox",
      source: "chatgpt",
    },
  });
  const saved = await (await request.get(`/api/prompts/${result.prompt.id}`)).json();
  expect(saved.prompt.content).toBe(content);
  await request.delete(`/api/prompts/${result.prompt.id}`);
});

test("Invalid API payloads are rejected without writing data", async ({ request }) => {
  for (const data of [
    {},
    { content: "   " },
    { content: "valid", source: "unsupported" },
    { content: "valid", sourceUrl: "javascript:alert(1)" },
    { content: "valid", aiOrganize: "true" },
    { content: "valid", user_id: "11111111-1111-4111-8111-111111111111" },
    { content: "x".repeat(100_001) },
  ]) {
    expect((await request.post("/api/prompts", { data })).status()).toBe(400);
  }
  expect(
    (
      await request.post("/api/prompts", {
        data: "{not json",
        headers: { "Content-Type": "application/json" },
      })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/prompts", {
        data: "plain text",
        headers: { "Content-Type": "text/plain" },
      })
    ).status(),
  ).toBe(415);
  expect((await request.get("/api/prompts/not-a-uuid")).status()).toBe(400);
  expect((await request.get("/api/prompts/22222222-2222-4222-8222-222222222222")).status()).toBe(
    404,
  );
  expect(
    (
      await request.post("/api/prompts", {
        data: { content: "blocked" },
        headers: { Origin: "https://untrusted.example" },
      })
    ).status(),
  ).toBe(403);
});

test("Search covers title, description, content and tags", async ({ page }) => {
  await page.goto("/inbox");
  const search = page.getByRole("textbox", { name: "Search prompts" });
  for (const term of [
    "second pair",
    "smallest interaction",
    "underlying assumptions",
    "product-design",
  ]) {
    await search.fill(term);
    await expect(
      page.getByTestId("prompt-card").filter({ hasText: "A second pair of eyes" }),
    ).toBeVisible();
  }
  await search.fill("no-result-unique-value");
  await expect(page.getByText("No matching prompts.")).toBeVisible();
  await expect(page.getByTestId("prompt-card")).toHaveCount(0);
});

test("Library category, type, status and tag filtering", async ({ page }) => {
  await page.goto("/library");
  await expect(page.getByTestId("prompt-card")).toHaveCount(5);
  await page.getByRole("tab", { name: "Coding", exact: true }).click();
  await expect(page.getByTestId("prompt-card")).toHaveCount(2);
  await page.getByLabel("Filter by type").selectOption("skill");
  await expect(page.getByTestId("prompt-card")).toHaveCount(1);
  await page.getByLabel("Filter by status").selectOption("tested");
  await expect(page.getByTestId("prompt-card")).toHaveCount(0);
  await page.goto("/library?tag=accessibility");
  await expect(page.getByTestId("prompt-card")).toHaveCount(1);
  await page.goto("/library?status=archived");
  await expect(page.getByTestId("prompt-card")).toHaveCount(1);
});

test("Tested, archive, restore, and confirmed delete", async ({ page, request }) => {
  const { prompt } = await (
    await request.post("/api/prompts", {
      data: { content: "Status workflow", title: "Status workflow", aiOrganize: false },
    })
  ).json();
  await page.goto(`/prompts/${prompt.id}`);
  await page.getByRole("button", { name: "Mark as Tested", exact: true }).click();
  await expect(page.locator("dd").filter({ hasText: /^Tested$/ })).toBeVisible();
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(page.locator("dd").filter({ hasText: /^Archived$/ })).toBeVisible();
  await page.getByRole("button", { name: "Move to Library", exact: true }).click();
  await expect(page.locator("dd").filter({ hasText: /^Library$/ })).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Status workflow" })).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Delete prompt", exact: true }).click();
  await expect(page).toHaveURL(/\/inbox$/);
  expect((await request.get(`/api/prompts/${prompt.id}`)).status()).toBe(404);
});

test("Keyboard shortcuts, dialog focus trap, and Escape", async ({ page }) => {
  await page.goto("/inbox");
  await expect(page.getByTestId("prompt-card")).toHaveCount(9);
  await page.keyboard.press("ControlOrMeta+k");
  await expect(page.getByRole("textbox", { name: "Search prompts" })).toBeFocused();
  await page.keyboard.press("ControlOrMeta+n");
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator("#prompt-content")).toBeFocused();
  await expect(dialog.getByRole("button", { name: "Save prompt", exact: true })).toBeDisabled();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Close modal" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Cancel", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Search prompts" })).toBeFocused();
});

test("Concurrent API writes do not lose prompts", async ({ request }) => {
  const ids: string[] = [];
  const requests = Array.from({ length: 12 }, (_, index) =>
    request.post("/api/prompts", {
      data: { content: `Concurrent capture ${index}`, aiOrganize: false },
    }),
  );
  for (const pending of requests) {
    const response = await pending;
    expect(response.status()).toBe(201);
    ids.push((await response.json()).prompt.id);
  }
  const { prompts } = await (await request.get("/api/prompts")).json();
  expect(ids.every((id) => prompts.some((prompt: { id: string }) => prompt.id === id))).toBe(true);
  for (const id of ids) await request.delete(`/api/prompts/${id}`);
});

test("Empty and server-error states remain usable", async ({ page }) => {
  await page.route("**/api/prompts", (route) =>
    route.fulfill({ json: { prompts: [], storage: "local" } }),
  );
  await page.goto("/inbox");
  await expect(page.getByText("Nothing here yet.")).toBeVisible();
  await expect(page.getByText("Paste your first useful prompt.")).toBeVisible();
  await page.goto("/library");
  await expect(page.getByText("Your reusable prompts will live here.")).toBeVisible();
  await page.route("**/api/prompts", (route) =>
    route.fulfill({ status: 503, json: { error: "Test database unavailable" } }),
  );
  await page.reload();
  await expect(page.getByRole("main").getByRole("alert")).toHaveText("Test database unavailable");
  await expect(page.getByRole("button", { name: "Try again" })).toBeVisible();
});

test("A failed save keeps the draft", async ({ page }) => {
  await page.goto("/inbox");
  await page.getByRole("button", { name: "Add prompt", exact: true }).last().click();
  await page.getByRole("dialog").locator("#prompt-content").fill("Keep my unsaved draft.");
  await page.route("**/api/prompts", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({ status: 503, json: { error: "Storage temporarily unavailable" } })
      : route.continue(),
  );
  await page.getByRole("button", { name: "Save prompt", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toHaveText(
    "Storage temporarily unavailable",
  );
  await expect(page.getByRole("dialog").locator("#prompt-content")).toHaveValue(
    "Keep my unsaved draft.",
  );
});

for (const viewport of [
  { width: 1440, height: 960 },
  { width: 834, height: 1112 },
  { width: 390, height: 844 },
  { width: 320, height: 740 },
]) {
  test(`Responsive workspace at ${viewport.width}px`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/inbox");
    await expect(page.getByTestId("prompt-card")).toHaveCount(9);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: `test-results/inbox-${viewport.width}.png`,
      fullPage: true,
      animations: "disabled",
    });
    if (viewport.width < 768) {
      await page.getByRole("button", { name: "Open navigation" }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
      await page
        .getByRole("dialog")
        .getByRole("link", { name: /^Library/ })
        .click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(page.getByRole("heading", { name: "Library" })).toBeVisible();
    }
    await page.getByRole("button", { name: "Add prompt", exact: true }).last().click();
    await expect(page.getByRole("dialog")).toBeVisible();
    expect(
      await page.evaluate(() => {
        const rect = document.querySelector('[role="dialog"]')?.getBoundingClientRect();
        return (
          !!rect &&
          rect.left >= 0 &&
          rect.right <= innerWidth &&
          rect.top >= 0 &&
          rect.bottom <= innerHeight
        );
      }),
    ).toBe(true);
    await page.screenshot({
      path: `test-results/add-${viewport.width}.png`,
      fullPage: true,
      animations: "disabled",
    });
  });
}
