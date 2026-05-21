import { expect, test } from "@playwright/test";

test.describe("auth pages render and gate the app", () => {
  test("/login renders the form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /entrar/i })).toBeVisible();
    await expect(page.getByLabel(/e-?mail/i)).toBeVisible();
    await expect(page.getByLabel(/senha/i)).toBeVisible();
  });

  test("/signup renders the form", async ({ page }) => {
    await page.goto("/signup");
    await expect(page.getByRole("heading", { name: /criar conta|cadastr/i })).toBeVisible();
  });

  test("/forgot-password renders", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByLabel(/e-?mail/i)).toBeVisible();
  });

  test("/dashboard redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("/carteira redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/carteira");
    await expect(page).toHaveURL(/\/login/);
  });

  test("/relatorios redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/relatorios");
    await expect(page).toHaveURL(/\/login/);
  });

  test("/configuracoes redirects unauthenticated user to login", async ({ page }) => {
    await page.goto("/configuracoes");
    await expect(page).toHaveURL(/\/login/);
  });
});
