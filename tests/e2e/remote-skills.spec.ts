import { expect, test } from "@playwright/test";
import JSZip from "jszip";

// The remote project runs against the on-disk file store without Supabase, so a real
// upload cannot succeed here. These specs pin the surface that does not depend on
// Supabase: the dialog UI, dropzone bookkeeping, and the API error contract.

test("Skill mode swaps the dialog into a dropzone with the right copy", async ({ page }) => {
  await page.goto("/inbox");
  await page.getByRole("button", { name: "Add prompt", exact: true }).first().click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Add Prompt" })).toBeVisible();

  await dialog.getByRole("button", { name: "skill", exact: true }).click();
  await expect(dialog.getByRole("heading", { name: "Add Skill" })).toBeVisible();
  await expect(dialog.getByText(/Drop a .* here, or click to browse/)).toBeVisible();
  await expect(dialog.getByText(/Must contain a .*SKILL\.md/)).toBeVisible();
  const submit = dialog.getByRole("button", { name: "Upload skill", exact: true });
  await expect(submit).toBeDisabled();

  const zip = new JSZip();
  zip.file(
    "SKILL.md",
    "---\nname: Sample Skill\nversion: 1.0.0\ndescription: A test skill\n---\nHello",
  );
  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  await dialog
    .locator("input#skill-package")
    .setInputFiles({ name: "sample.zip", mimeType: "application/zip", buffer });
  await expect(dialog.getByText("sample.zip")).toBeVisible();
  await expect(submit).toBeEnabled();
});

test("POST /api/skills rejects malformed uploads with descriptive errors", async ({ request }) => {
  const noBody = await request.post("/api/skills", {
    headers: { "content-type": "application/zip" },
    data: Buffer.alloc(0),
  });
  expect(noBody.status()).toBe(400);
  expect((await noBody.json()).error).toMatch(/empty/i);

  const wrongType = await request.post("/api/skills", {
    headers: { "content-type": "text/plain" },
    data: "not a zip",
  });
  expect(wrongType.status()).toBe(415);

  const missingField = await request.post("/api/skills", { multipart: { other: "value" } });
  expect(missingField.status()).toBe(400);
  expect((await missingField.json()).error).toMatch(/package/i);

  const invalidZip = await request.post("/api/skills", {
    headers: { "content-type": "application/zip" },
    data: Buffer.from("not a real zip file"),
  });
  // Without Supabase configured, createSkill short-circuits with 503 before parsing.
  // With Supabase configured, extractSkill fails with 400. Accept either contract.
  expect([400, 503]).toContain(invalidZip.status());
});

test("GET /api/skills is not supported", async ({ request }) => {
  const response = await request.get("/api/skills");
  expect(response.status()).toBe(405);
});
