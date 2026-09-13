import { expect, test } from "@playwright/test";

for (const viewport of [
  { width: 1440, height: 960 },
  { width: 834, height: 1112 },
  { width: 390, height: 844 },
  { width: 320, height: 740 },
]) {
  test(`Workspace, capture and detail at ${viewport.width}px`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize(viewport);
    await page.goto("/inbox");
    await expect(page.getByTestId("prompt-card")).toHaveCount(8);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: `test-results/inbox-${viewport.width}.png`,
      animations: "disabled",
    });
    if (viewport.width < 768) {
      await page.getByRole("button", { name: "Open navigation" }).click();
      await page
        .getByRole("dialog")
        .getByRole("link", { name: /^Library/ })
        .click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(page.getByRole("heading", { name: "Library", exact: true })).toBeVisible();
    }
    await page.getByRole("button", { name: "Add prompt", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.locator("#prompt-content")).toBeFocused();
    await page.screenshot({
      path: `test-results/add-${viewport.width}.png`,
      animations: "disabled",
    });
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
    const longContent =
      "A long prompt with an unbroken URL.\n\n" +
      "x".repeat(800) +
      "\n" +
      "Review the details.\n".repeat(70);
    const title =
      "A long prompt title that must wrap within a small viewport without covering actions";
    await dialog.locator("#prompt-content").fill(longContent);
    await dialog.getByLabel("Title").fill(title);
    await dialog.getByRole("button", { name: "Save prompt" }).click();
    await page.getByRole("link", { name: title, exact: true }).click();
    expect(await page.locator("pre").textContent()).toBe(longContent);
    if (viewport.width < 640) {
      const titleBox = await page.getByRole("heading", { name: title, exact: true }).boundingBox();
      expect(titleBox?.width).toBeGreaterThan(viewport.width - 60);
      const editBox = await page.getByRole("button", { name: "Edit", exact: true }).boundingBox();
      expect(editBox?.y).toBeGreaterThan((titleBox?.y ?? 0) + (titleBox?.height ?? 0));
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({
      path: `test-results/detail-${viewport.width}.png`,
      animations: "disabled",
    });
    await page.getByRole("button", { name: "Copy prompt", exact: true }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(longContent);
    await page.getByRole("button", { name: "Edit", exact: true }).click();
    await dialog.getByLabel("Title", { exact: true }).fill("Updated long prompt");
    await dialog.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("heading", { name: "Updated long prompt" })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("Desktop resize releases a mobile navigation focus trap", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/inbox");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 960 });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Add prompt", exact: true }).click();
  await expect(page.getByRole("dialog").locator("#prompt-content")).toBeFocused();
});

test("Deleted or unknown deep links show a recoverable state", async ({ page }) => {
  await page.goto("/prompts/22222222-2222-4222-8222-222222222222");
  await expect(page.getByRole("heading", { name: "Unable to open prompt" })).toBeVisible();
  await page.getByRole("link", { name: "Back to Inbox" }).click();
  await expect(page.getByTestId("prompt-card")).toHaveCount(8);
});
