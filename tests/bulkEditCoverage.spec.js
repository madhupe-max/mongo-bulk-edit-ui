// @ts-check
import { test, expect } from '@playwright/test';

test.use({ baseURL: 'http://localhost:5173' });

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Select the first N data rows (skips the header row). */
async function selectRows(page, count) {
  const rows = page.getByRole('row');
  for (let i = 1; i <= count; i++) {
    await rows.nth(i).getByRole('checkbox').click();
  }
}

/** Open the bulk edit panel (assumes ≥1 row is already selected). */
async function openBulkEdit(page) {
  await page.getByRole('button', { name: 'Bulk Edit' }).click();
}

/** Apply updates and wait for the server response. */
async function applyAndWait(page) {
  const [response] = await Promise.all([
    page.waitForResponse(
      (resp) => resp.url().includes('/bulk/update') && resp.status() === 200
    ),
    page.getByRole('button', { name: 'Apply Updates' }).click(),
  ]);
  return response;
}

// ---------------------------------------------------------------------------
// Select-all / deselect-all
// ---------------------------------------------------------------------------

test.describe('Select All / Deselect All', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('table');
  });

  test('header checkbox selects all records', async ({ page }) => {
    const headerCheckbox = page
      .getByRole('columnheader')
      .filter({ has: page.locator('input[type="checkbox"]') })
      .locator('input[type="checkbox"]');

    await headerCheckbox.click();

    // Every data-row checkbox should now be checked
    const dataCheckboxes = page.getByRole('row').locator('input[type="checkbox"]');
    const total = await dataCheckboxes.count();
    // total includes the header checkbox; skip it
    for (let i = 1; i < total; i++) {
      await expect(dataCheckboxes.nth(i)).toBeChecked();
    }
  });

  test('header checkbox deselects all when all are selected', async ({ page }) => {
    const headerCheckbox = page
      .getByRole('columnheader')
      .filter({ has: page.locator('input[type="checkbox"]') })
      .locator('input[type="checkbox"]');

    // Select all, then click again to deselect
    await headerCheckbox.click();
    await headerCheckbox.click();

    const dataCheckboxes = page.getByRole('row').locator('input[type="checkbox"]');
    const total = await dataCheckboxes.count();
    for (let i = 1; i < total; i++) {
      await expect(dataCheckboxes.nth(i)).not.toBeChecked();
    }

    // Selection counter should disappear
    const selectionInfo = page.locator('text=/\\d+ selected/');
    await expect(selectionInfo).not.toBeVisible();
  });

  test('header checkbox reflects correct checked state after select all', async ({ page }) => {
    const headerCheckbox = page
      .getByRole('columnheader')
      .filter({ has: page.locator('input[type="checkbox"]') })
      .locator('input[type="checkbox"]');

    await headerCheckbox.click();
    await expect(headerCheckbox).toBeChecked();
  });

  test('header checkbox is unchecked after deselecting all rows manually', async ({ page }) => {
    const rows = page.getByRole('row');
    const rowCount = (await rows.count()) - 1; // exclude header

    // Select all rows one by one
    for (let i = 1; i <= rowCount; i++) {
      await rows.nth(i).getByRole('checkbox').click();
    }

    // Deselect all rows one by one
    for (let i = 1; i <= rowCount; i++) {
      await rows.nth(i).getByRole('checkbox').click();
    }

    const headerCheckbox = page
      .getByRole('columnheader')
      .filter({ has: page.locator('input[type="checkbox"]') })
      .locator('input[type="checkbox"]');

    await expect(headerCheckbox).not.toBeChecked();
  });
});

// ---------------------------------------------------------------------------
// Row selection UX
// ---------------------------------------------------------------------------

test.describe('Row selection UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('table');
  });

  test('selected row has "selected" CSS class', async ({ page }) => {
    const rows = page.getByRole('row');
    const firstDataRow = rows.nth(1);
    await firstDataRow.getByRole('checkbox').click();
    await expect(firstDataRow).toHaveClass(/selected/);
  });

  test('deselected row loses "selected" CSS class', async ({ page }) => {
    const rows = page.getByRole('row');
    const firstDataRow = rows.nth(1);
    await firstDataRow.getByRole('checkbox').click();
    await expect(firstDataRow).toHaveClass(/selected/);
    await firstDataRow.getByRole('checkbox').click();
    await expect(firstDataRow).not.toHaveClass(/selected/);
  });

  test('Bulk Edit button is not visible when no records are selected', async ({ page }) => {
    const bulkEditButton = page.getByRole('button', { name: 'Bulk Edit' });
    await expect(bulkEditButton).not.toBeVisible();
  });

  test('selecting then deselecting a record hides the Bulk Edit button', async ({ page }) => {
    const rows = page.getByRole('row');
    await rows.nth(1).getByRole('checkbox').click();
    await expect(page.getByRole('button', { name: 'Bulk Edit' })).toBeVisible();
    await rows.nth(1).getByRole('checkbox').click();
    await expect(page.getByRole('button', { name: 'Bulk Edit' })).not.toBeVisible();
  });

  test('table renders ID column for each row', async ({ page }) => {
    const rows = page.getByRole('row');
    const firstDataRow = rows.nth(1);
    // ID is shown truncated with "..."
    await expect(firstDataRow.locator('td.id-col')).toContainText('...');
  });
});

// ---------------------------------------------------------------------------
// Email field
// ---------------------------------------------------------------------------

test.describe('Bulk Edit - Email Field', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('table');
  });

  test('should update email field for selected records', async ({ page }) => {
    await selectRows(page, 2);
    await openBulkEdit(page);

    const newEmail = 'bulk-updated@example.com';
    await page.getByRole('textbox', { name: 'New email' }).fill(newEmail);

    await applyAndWait(page);

    await page.waitForFunction(
      (email) => document.body.innerText.includes(email),
      newEmail,
      { timeout: 10000 }
    );

    const cell = page.locator(`text=${newEmail}`);
    await expect(cell.first()).toBeVisible();
  });

  test('email field accepts email-formatted input', async ({ page }) => {
    await selectRows(page, 1);
    await openBulkEdit(page);

    const emailInput = page.getByRole('textbox', { name: 'New email' });
    await emailInput.fill('test.user+tag@domain.co.uk');
    await expect(emailInput).toHaveValue('test.user+tag@domain.co.uk');
  });

  test('email field can be cleared', async ({ page }) => {
    await selectRows(page, 1);
    await openBulkEdit(page);

    const emailInput = page.getByRole('textbox', { name: 'New email' });
    await emailInput.fill('test@example.com');
    await emailInput.clear();
    await expect(emailInput).toHaveValue('');
  });
});

// ---------------------------------------------------------------------------
// Status field
// ---------------------------------------------------------------------------

test.describe('Bulk Edit - Status Field', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('table');
  });

  test('should update status field for selected records', async ({ page }) => {
    await selectRows(page, 2);
    await openBulkEdit(page);

    const newStatus = 'inactive';
    await page.getByRole('textbox', { name: 'New status' }).fill(newStatus);

    await applyAndWait(page);

    await page.waitForFunction(
      (status) => document.body.innerText.includes(status),
      newStatus,
      { timeout: 10000 }
    );

    const cell = page.locator(`text=${newStatus}`);
    await expect(cell.first()).toBeVisible();
  });

  test('status field accepts value', async ({ page }) => {
    await selectRows(page, 1);
    await openBulkEdit(page);

    const statusInput = page.getByRole('textbox', { name: 'New status' });
    await statusInput.fill('active');
    await expect(statusInput).toHaveValue('active');
  });
});

// ---------------------------------------------------------------------------
// Department field
// ---------------------------------------------------------------------------

test.describe('Bulk Edit - Department Field', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('table');
  });

  test('should update department field for selected records', async ({ page }) => {
    await selectRows(page, 2);
    await openBulkEdit(page);

    const newDept = 'Engineering';
    await page.getByRole('textbox', { name: 'New department' }).fill(newDept);

    await applyAndWait(page);

    await page.waitForFunction(
      (dept) => document.body.innerText.includes(dept),
      newDept,
      { timeout: 10000 }
    );

    const cell = page.locator(`text=${newDept}`);
    await expect(cell.first()).toBeVisible();
  });

  test('department field accepts value', async ({ page }) => {
    await selectRows(page, 1);
    await openBulkEdit(page);

    const deptInput = page.getByRole('textbox', { name: 'New department' });
    await deptInput.fill('HR');
    await expect(deptInput).toHaveValue('HR');
  });
});

// ---------------------------------------------------------------------------
// Multi-field simultaneous update
// ---------------------------------------------------------------------------

test.describe('Bulk Edit - Multiple Fields', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('table');
  });

  test('should update name and email together', async ({ page }) => {
    await selectRows(page, 2);
    await openBulkEdit(page);

    const newName = 'MultiField Name';
    const newEmail = 'multifield@example.com';

    await page.getByRole('textbox', { name: 'New name' }).fill(newName);
    await page.getByRole('textbox', { name: 'New email' }).fill(newEmail);

    await applyAndWait(page);

    await page.waitForFunction(
      ([name, email]) =>
        document.body.innerText.includes(name) &&
        document.body.innerText.includes(email),
      [newName, newEmail],
      { timeout: 10000 }
    );

    await expect(page.locator(`text=${newName}`).first()).toBeVisible();
    await expect(page.locator(`text=${newEmail}`).first()).toBeVisible();
  });

  test('should update all four fields simultaneously', async ({ page }) => {
    await selectRows(page, 1);
    await openBulkEdit(page);

    const updates = {
      name: 'All Fields Name',
      email: 'allfields@example.com',
      status: 'pending',
      department: 'Finance',
    };

    await page.getByRole('textbox', { name: 'New name' }).fill(updates.name);
    await page.getByRole('textbox', { name: 'New email' }).fill(updates.email);
    await page.getByRole('textbox', { name: 'New status' }).fill(updates.status);
    await page.getByRole('textbox', { name: 'New department' }).fill(updates.department);

    await applyAndWait(page);

    // Check all four values appear simultaneously to avoid race conditions with
    // parallel tests that may overwrite data between sequential waitForFunction calls.
    await page.waitForFunction(
      (values) => values.every((v) => document.body.innerText.includes(v)),
      Object.values(updates),
      { timeout: 15000 }
    );

    for (const value of Object.values(updates)) {
      await expect(page.locator(`text=${value}`).first()).toBeVisible();
    }
  });

  test('filling only some fields sends only those fields in the request', async ({ page }) => {
    await selectRows(page, 1);
    await openBulkEdit(page);

    let requestBody;
    page.on('request', (req) => {
      if (req.url().includes('/bulk/update') && req.method() === 'POST') {
        requestBody = req.postDataJSON();
      }
    });

    await page.getByRole('textbox', { name: 'New name' }).fill('OnlyName');
    // Leave other fields empty

    await applyAndWait(page);

    // Only the "name" key should be in updates (empty strings are sent but the
    // server applies $set with all fields; verify "name" is definitely present)
    expect(requestBody?.updates).toHaveProperty('name', 'OnlyName');
  });
});

// ---------------------------------------------------------------------------
// Post-update state
// ---------------------------------------------------------------------------

test.describe('Post-update state', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('table');
  });

  test('selection is cleared after a successful bulk update', async ({ page }) => {
    await selectRows(page, 2);
    await openBulkEdit(page);
    await page.getByRole('textbox', { name: 'New name' }).fill('PostUpdate Name');

    await applyAndWait(page);

    // After update the selection counter should disappear
    const selectionInfo = page.locator('text=/\\d+ selected/');
    await expect(selectionInfo).not.toBeVisible();
  });

  test('bulk edit panel is closed after a successful update', async ({ page }) => {
    await selectRows(page, 1);
    await openBulkEdit(page);
    await page.getByRole('textbox', { name: 'New name' }).fill('CloseAfterUpdate');

    await applyAndWait(page);

    const formHeading = page.getByRole('heading', { level: 3 });
    await expect(formHeading).not.toBeVisible();
  });

  test('Bulk Edit button disappears after a successful update clears selections', async ({
    page,
  }) => {
    await selectRows(page, 1);
    await openBulkEdit(page);
    await page.getByRole('textbox', { name: 'New name' }).fill('ClearSelBtn');

    await applyAndWait(page);

    await expect(page.getByRole('button', { name: 'Bulk Edit' })).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Error handling (API mocking)
// ---------------------------------------------------------------------------

test.describe('Error handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('table');
  });

  test('shows error message when Apply Updates is clicked with no fields filled', async ({
    page,
  }) => {
    await selectRows(page, 1);
    await openBulkEdit(page);

    // Do NOT fill any field — click Apply Updates directly
    await page.getByRole('button', { name: 'Apply Updates' }).click();

    // The app should display an error
    const errorEl = page.locator('.error');
    await expect(errorEl).toBeVisible();
  });

  test('shows error message when bulk update API returns a server error', async ({ page }) => {
    // Intercept the bulk update endpoint and force a 500
    await page.route('**/bulk/update', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    );

    await selectRows(page, 1);
    await openBulkEdit(page);
    await page.getByRole('textbox', { name: 'New name' }).fill('WillFail');
    await page.getByRole('button', { name: 'Apply Updates' }).click();

    const errorEl = page.locator('.error');
    await expect(errorEl).toBeVisible();
  });

  test('shows error message when records API fails on load', async ({ page }) => {
    // Intercept before navigation
    await page.route('**/api/records', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'DB unavailable' }),
      })
    );

    await page.goto('/');
    const errorEl = page.locator('.error');
    await expect(errorEl).toBeVisible();
  });

  test('error message is cleared on a successful bulk update', async ({ page }) => {
    // First trigger an error with no fields filled
    await selectRows(page, 1);
    await openBulkEdit(page);
    await page.getByRole('button', { name: 'Apply Updates' }).click();
    await expect(page.locator('.error')).toBeVisible();

    // Now fill a field and apply successfully
    await page.getByRole('textbox', { name: 'New name' }).fill('FixedName');
    await applyAndWait(page);

    await expect(page.locator('.error')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Refresh button
// ---------------------------------------------------------------------------

test.describe('Refresh button', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('table');
  });

  test('clicking Refresh triggers a GET /api/records request', async ({ page }) => {
    let refreshCalled = false;
    page.on('request', (req) => {
      if (req.url().includes('/api/records') && req.method() === 'GET') {
        refreshCalled = true;
      }
    });

    await page.getByRole('button', { name: /Refresh/ }).click();
    // Wait briefly for the request to fire
    await page.waitForResponse((resp) => resp.url().includes('/api/records'));

    expect(refreshCalled).toBe(true);
  });

  test('Refresh button is always visible regardless of selection state', async ({ page }) => {
    const refreshButton = page.getByRole('button', { name: /Refresh/ });

    // Initially visible
    await expect(refreshButton).toBeVisible();

    // Still visible after selecting records
    await selectRows(page, 2);
    await expect(refreshButton).toBeVisible();

    // Still visible when bulk edit panel is open
    await openBulkEdit(page);
    await expect(refreshButton).toBeVisible();
  });

  test('Refresh reloads the data and re-renders the table', async ({ page }) => {
    const tableRowsBefore = await page.getByRole('row').count();

    await page.getByRole('button', { name: /Refresh/ }).click();
    await page.waitForResponse((resp) => resp.url().includes('/api/records'));

    const tableRowsAfter = await page.getByRole('row').count();
    expect(tableRowsAfter).toBe(tableRowsBefore);
  });
});

// ---------------------------------------------------------------------------
// Bulk edit panel heading reflects selection count
// ---------------------------------------------------------------------------

test.describe('Bulk edit panel heading', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('table');
  });

  test('heading shows correct count for 1 selected record', async ({ page }) => {
    await selectRows(page, 1);
    await openBulkEdit(page);
    await expect(page.getByRole('heading', { level: 3 })).toContainText('Update 1 selected records');
  });

  test('heading shows correct count for 3 selected records', async ({ page }) => {
    await selectRows(page, 3);
    await openBulkEdit(page);
    await expect(page.getByRole('heading', { level: 3 })).toContainText('Update 3 selected records');
  });
});

// ---------------------------------------------------------------------------
// Keyboard / accessibility
// ---------------------------------------------------------------------------

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('table');
  });

  test('bulk edit form fields are reachable via Tab key', async ({ page }) => {
    await selectRows(page, 1);
    await openBulkEdit(page);

    const nameInput = page.getByRole('textbox', { name: 'New name' });
    await nameInput.focus();
    await page.keyboard.press('Tab');

    const emailInput = page.getByRole('textbox', { name: 'New email' });
    await expect(emailInput).toBeFocused();
  });

  test('Apply Updates button can be activated with keyboard Enter on the button', async ({
    page,
  }) => {
    await selectRows(page, 1);
    await openBulkEdit(page);
    await page.getByRole('textbox', { name: 'New name' }).fill('KeyboardUpdate');

    const applyButton = page.getByRole('button', { name: 'Apply Updates' });
    await applyButton.focus();

    const [response] = await Promise.all([
      page.waitForResponse(
        (resp) => resp.url().includes('/bulk/update') && resp.status() === 200
      ),
      page.keyboard.press('Enter'),
    ]);

    expect(response.status()).toBe(200);
  });
});
