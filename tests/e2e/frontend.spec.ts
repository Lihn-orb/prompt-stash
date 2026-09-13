import { expect, test, type Page } from "@playwright/test";
import { MOCK_STORAGE_KEY } from "../../services/mock-prompts";
import type { Prompt } from "../../types/prompt";

const original =
  "  Review the UX flow for accessibility.\n\nKeep every line and space: capture-needle.\nReturn specific improvements.  ";

async function storedPrompts(page: Page): Promise<Prompt[]> {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? '{"prompts":[]}').prompts,
    MOCK_STORAGE_KEY,
  );
}

async function addPrompt(page: Page, content: string, title = "", organize = true) {
  await page.getByRole("button", { name: "Add prompt", exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.locator("#prompt-content").fill(content);
  if (title) await dialog.getByLabel("Title").fill(title);
  if (!organize) await dialog.getByRole("switch").uncheck();
  await dialog.getByRole("button", { name: "Save prompt", exact: true }).click();
  await expect(dialog).toHaveCount(0);
}

test("Complete frontend capture-to-reuse flow without backend requests", async ({ page }) => {
  const errors: string[] = [];
  const network: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) errors.push(message.text());
  });
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname.startsWith("/api/") || url.hostname !== "127.0.0.1")
      network.push(request.url());
  });
  await page.goto("/inbox");
  await expect(page.getByTestId("prompt-card")).toHaveCount(8);
  await addPrompt(page, original, "Capture verification");
  await expect(page.getByText("Prompt saved", { exact: true })).toBeVisible();
  const card = page.getByTestId("prompt-card").filter({ hasText: "Capture verification" });
  await expect(page.getByTestId("prompt-card").first()).toContainText("Capture verification");
  await card.getByRole("button", { name: "Copy prompt", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(original);
  await expect(page.getByText("Copied \u2713", { exact: true })).toBeVisible();
  await expect(page).toHaveURL(/\/inbox$/);

  await page.getByRole("textbox", { name: "Search prompts" }).fill("capture-needle");
  await page
    .getByRole("group", { name: "Category" })
    .getByRole("button", { name: "Design", exact: true })
    .click();
  await expect(page.getByTestId("prompt-card")).toHaveCount(1);
  await card.getByRole("button", { name: /More actions/ }).click();
  await page.getByRole("menuitem", { name: "Move to Library" }).click();
  await expect(card).toHaveCount(0);
  await page.getByRole("link", { name: /^Library/ }).click();
  await expect(card).toBeVisible();
  await card.getByRole("link", { name: "Capture verification" }).click();
  expect(await page.locator("pre").textContent()).toBe(original);
  const id = page.url().split("/").pop();

  await page.getByRole("button", { name: "Edit", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Title", { exact: true }).fill("Edited verification");
  await dialog.getByLabel("Description").fill("Updated description");
  await dialog.locator("#prompt-content").fill(`${original}\nAdditional requirement.`);
  await dialog.getByLabel("Category", { exact: true }).selectOption("Writing");
  await dialog.getByLabel("Tags", { exact: true }).fill("reusable, quality");
  await dialog.getByLabel("Type", { exact: true }).selectOption("template");
  await dialog.getByLabel("Status", { exact: true }).selectOption("tested");
  await dialog.getByLabel("Source URL").fill("https://example.com/source");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("heading", { name: "Edited verification" })).toBeVisible();
  await page.reload();
  await expect(page.getByText("Updated description", { exact: true })).toBeVisible();
  expect((await storedPrompts(page)).find((prompt) => prompt.id === id)).toMatchObject({
    title: "Edited verification",
    content: `${original}\nAdditional requirement.`,
    category: "Writing",
    type: "template",
    status: "tested",
    tags: ["reusable", "quality"],
    source_url: "https://example.com/source",
  });
  await page.getByRole("button", { name: "Archive", exact: true }).click();
  await expect(page.locator("dd").filter({ hasText: /^Archived$/ })).toBeVisible();
  await page.getByRole("link", { name: "Archived", exact: true }).first().click();
  await expect(page.getByTestId("prompt-card")).toHaveCount(1);
  await page.getByRole("link", { name: "Edited verification", exact: true }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("button", { name: "Cancel" })).toBeFocused();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Edited verification" })).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Delete prompt", exact: true }).click();
  await expect(page).toHaveURL(/\/inbox$/);
  expect((await storedPrompts(page)).some((prompt) => prompt.id === id)).toBe(false);
  expect(errors).toEqual([]);
  expect(network).toEqual([]);
});

test("Mock organize generates metadata without changing content", async ({ page }) => {
  await page.goto("/inbox");
  for (const sample of [
    { content: "Review this UX design for usability.", category: "Design", type: "prompt" },
    { content: "Write an article for {{audience}}.", category: "Writing", type: "template" },
    {
      content: "Input: code.\nProcess: debug the function.\nOutput: a fix.",
      category: "Coding",
      type: "skill",
    },
    { content: "请研究用户访谈内容，提取主要发现。", category: "Research", type: "prompt" },
    { content: "Create an image with natural lighting.", category: "Image", type: "prompt" },
  ]) {
    await addPrompt(page, sample.content);
    const prompt = (await storedPrompts(page))[0];
    expect(prompt).toMatchObject(sample);
    expect(prompt.title.length).toBeGreaterThan(0);
    expect(prompt.description.length).toBeGreaterThan(0);
    expect(prompt.tags.length).toBeGreaterThan(0);
  }
});

test("Manual capture retains text, manual title and empty metadata", async ({ page }) => {
  await page.goto("/inbox");
  await addPrompt(page, original, "My manual title", false);
  expect((await storedPrompts(page))[0]).toMatchObject({
    title: "My manual title",
    content: original,
    description: "",
    tags: [],
    category: "Other",
    type: "prompt",
  });
  await addPrompt(page, "A short untitled prompt", "", false);
  expect((await storedPrompts(page))[0].title).toBe("A short untitled prompt");
});

test("Title, description, content and tag search with Library filters", async ({ page }) => {
  await page.goto("/inbox");
  const search = page.getByRole("textbox", { name: "Search prompts" });
  for (const query of ["UX design review", "usability", "underlying product decision", "ux"]) {
    await search.fill(query);
    await expect(
      page.getByTestId("prompt-card").filter({ hasText: "UX design review" }),
    ).toBeVisible();
  }
  await search.fill("nonexistent-search-string");
  await expect(page.getByText("No matching prompts.")).toBeVisible();
  await page.getByRole("link", { name: /^Library/ }).click();
  await expect(page.getByTestId("prompt-card")).toHaveCount(4);
  await page
    .getByRole("group", { name: "Category" })
    .getByRole("button", { name: "Coding", exact: true })
    .click();
  await page.getByLabel("Filter by type").selectOption("skill");
  await page.getByLabel("Filter by status").selectOption("library");
  await search.fill("hypotheses");
  await expect(page.getByTestId("prompt-card")).toHaveCount(1);
  await page.getByLabel("Filter by status").selectOption("tested");
  await expect(page.getByText("No matching prompts.")).toBeVisible();
});

test("Keyboard shortcuts and modal focus stay predictable", async ({ page }) => {
  await page.goto("/inbox");
  await expect(page.getByTestId("prompt-card")).toHaveCount(8);
  await page.keyboard.press("ControlOrMeta+k");
  await expect(page.getByRole("textbox", { name: "Search prompts" })).toBeFocused();
  await page.keyboard.press("ControlOrMeta+n");
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator("#prompt-content")).toBeFocused();
  await expect(dialog.getByRole("button", { name: "Save prompt" })).toBeDisabled();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "skill", exact: true })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "template", exact: true })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "prompt", exact: true })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(dialog.getByRole("button", { name: "Close modal" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Search prompts" })).toBeFocused();
});

test("More menu can edit, test, archive, restore and delete", async ({ page }) => {
  await page.goto("/inbox");
  const card = page.getByTestId("prompt-card").filter({ hasText: "UX design review" });
  await card.getByRole("button", { name: /More actions/ }).click();
  await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Title", { exact: true }).fill("Renamed design review");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const renamed = page.getByTestId("prompt-card").filter({ hasText: "Renamed design review" });
  await renamed.getByRole("button", { name: /More actions/ }).click();
  await page.getByRole("menuitem", { name: "Mark as Tested" }).click();
  await expect(renamed).toHaveCount(0);
  await page.getByRole("link", { name: /^Library/ }).click();
  // Round-trip back to Inbox, then return it to Library for the rest of the flow.
  await renamed.getByRole("button", { name: /More actions/ }).click();
  await page.getByRole("menuitem", { name: "Move to Inbox" }).click();
  await expect(renamed).toHaveCount(0);
  await page.getByRole("link", { name: /^Inbox/ }).click();
  await expect(renamed).toBeVisible();
  await renamed.getByRole("button", { name: /More actions/ }).click();
  await page.getByRole("menuitem", { name: "Move to Library" }).click();
  await page.getByRole("link", { name: /^Library/ }).click();
  await renamed.getByRole("button", { name: /More actions/ }).click();
  await page.getByRole("menuitem", { name: "Archive", exact: true }).click();
  await page.getByRole("link", { name: "Archived", exact: true }).click();
  await renamed.getByRole("button", { name: /More actions/ }).click();
  await page.getByRole("menuitem", { name: "Move to Library" }).click();
  await page.getByRole("link", { name: /^Library/ }).click();
  await renamed.getByRole("button", { name: /More actions/ }).click();
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Delete prompt", exact: true }).click();
  await expect(renamed).toHaveCount(0);
});

test("Invalid URL and failed browser storage preserve the draft", async ({ page }) => {
  await page.goto("/inbox");
  await page.getByRole("button", { name: "Add prompt", exact: true }).click();
  await page.locator("#prompt-content").fill("A draft to keep");
  await page.getByLabel("Source URL").fill("javascript:alert(1)");
  await page.getByRole("button", { name: "Save prompt", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("http or https");
  await page.getByLabel("Source URL").fill("");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("Quota exceeded", "QuotaExceededError");
    };
  });
  await page.getByRole("button", { name: "Save prompt", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("could not be saved");
  await expect(page.locator("#prompt-content")).toHaveValue("A draft to keep");
});

test("Empty and malformed storage do not silently reseed", async ({ page }) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, JSON.stringify({ version: 1, prompts: [] })),
    MOCK_STORAGE_KEY,
  );
  await page.goto("/inbox");
  await expect(page.getByText("Nothing here yet.")).toBeVisible();
  await page.getByRole("link", { name: /^Library/ }).click();
  await expect(page.getByText("Your reusable prompts will live here.")).toBeVisible();
});

test("Malformed browser data is reported without replacement", async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, "{bad-json"), MOCK_STORAGE_KEY);
  await page.goto("/inbox");
  await expect(page.getByRole("main").getByRole("alert")).toContainText("could not be loaded");
  expect(await page.evaluate((key) => localStorage.getItem(key), MOCK_STORAGE_KEY)).toBe(
    "{bad-json",
  );
});

test("Saving from a filtered Inbox resets filters", async ({ page }) => {
  await page.goto("/inbox?category=Coding&type=skill");
  await addPrompt(page, "Review this UX design", "New design prompt");
  await expect(page).toHaveURL(/\/inbox$/);
  await expect(page.getByTestId("prompt-card").first()).toContainText("New design prompt");
});

test("Storage updates synchronize between browser tabs", async ({ page, context }) => {
  await page.goto("/inbox");
  const other = await context.newPage();
  await other.goto("/inbox");
  await expect(other.getByTestId("prompt-card")).toHaveCount(8);
  await addPrompt(page, "Shared browser prompt", "Second tab verification");
  await expect(
    other.getByRole("link", { name: "Second tab verification", exact: true }),
  ).toBeVisible();
  await other.close();
});

test("API stays dormant in local (browser-storage) mode", async ({ request }) => {
  const response = await request.post("/api/prompts", {
    data: { content: "Not sent to storage", aiOrganize: true },
  });
  expect(response.status()).toBe(503);
  expect((await response.json()).error).toContain("local");
});
