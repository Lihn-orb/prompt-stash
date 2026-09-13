import { expect, test } from "@playwright/test";
import { rm } from "node:fs/promises";

// Remote mode runs against the on-disk server store (stand-in for Supabase), so the
// UI must go through the HTTP API rather than browser storage. Reset the file first.
test.beforeAll(async () => {
  await rm(".data/e2e-remote.json", { force: true });
});

test("Remote mode drives the full CRUD flow through the HTTP API", async ({ page }) => {
  const apiMethods: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/prompts")) apiMethods.push(request.method());
  });

  // Empty server store shows the empty state, not the localStorage seed.
  await page.goto("/inbox");
  await expect(page.getByRole("heading", { name: "Nothing here yet." })).toBeVisible();
  expect(apiMethods).toContain("GET");

  // Create through the modal -> POST /api/prompts.
  await page.getByRole("button", { name: "Add prompt", exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog
    .locator("#prompt-content")
    .fill("Draft a release note from a list of merged pull requests.");
  await dialog.getByRole("switch").uncheck();
  await dialog.getByLabel("Title").fill("Release notes helper");
  await dialog.getByRole("button", { name: "Save prompt", exact: true }).click();
  await expect(page.getByText("Prompt saved", { exact: true })).toBeVisible();
  const card = page.getByTestId("prompt-card").filter({ hasText: "Release notes helper" });
  await expect(card).toBeVisible();
  expect(apiMethods).toContain("POST");

  // Persist across reload: data lives on the server, not the browser.
  await page.reload();
  await expect(
    page.getByTestId("prompt-card").filter({ hasText: "Release notes helper" }),
  ).toBeVisible();

  // Copy the exact content from the server-backed card.
  await card.getByRole("button", { name: "Copy prompt", exact: true }).click();
  await expect(page.getByText("Copied \u2713", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "Draft a release note from a list of merged pull requests.",
  );

  // Status change -> PATCH, then it leaves Inbox and appears in Library.
  await card.getByRole("button", { name: /More actions/ }).click();
  await page.getByRole("menuitem", { name: "Move to Library" }).click();
  await expect(card).toHaveCount(0);
  expect(apiMethods).toContain("PATCH");
  await page.getByRole("link", { name: /^Library/ }).click();
  await expect(
    page.getByTestId("prompt-card").filter({ hasText: "Release notes helper" }),
  ).toBeVisible();

  // Edit through detail -> PATCH updates server data.
  await page.getByRole("link", { name: "Release notes helper" }).click();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Title", { exact: true }).fill("Release notes writer");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("heading", { name: "Release notes writer" })).toBeVisible();

  // Delete -> DELETE removes it from the server store.
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("button", { name: "Delete prompt", exact: true }).click();
  await expect(page).toHaveURL(/\/inbox$/);
  expect(apiMethods).toContain("DELETE");
});
