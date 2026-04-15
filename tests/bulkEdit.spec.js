// @ts-check
import { test, expect } from '@playwright/test';

// Configure baseURL for tests
test.use({ baseURL: 'http://localhost:5173' });

test.describe('Bulk Edit - Name Field', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    // Wait for table to load
    await page.waitForSelector('table');
  });

  test('should display MongoDB Records Bulk Edit title', async ({ page }) => {
    // Verify the page title
    await expect(page).toHaveTitle('MongoDB Bulk Edit UI');
    
    // Verify the heading
    const heading = page.getByRole('heading', { level: 1 });
    await expect(heading).toContainText('MongoDB Records - Bulk Edit');
  });

  test('should display table with records', async ({ page }) => {
    // Verify table exists
    const table = page.getByRole('table');
    await expect(table).toBeVisible();
    
    // Verify header columns
    await expect(page.getByRole('columnheader', { name: 'name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'email' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'department' })).toBeVisible();
  });

  test('should show selection counter when records are selected', async ({ page }) => {
    // Get first row checkbox
    const rows = page.getByRole('row');
    const firstDataRow = rows.nth(1); // Skip header row
    const firstCheckbox = firstDataRow.getByRole('checkbox');
    
    // Click to select first record
    await firstCheckbox.click();
    
    // Verify selection counter appears
    const selectionInfo = page.locator('text=/\\d+ selected/');
    await expect(selectionInfo).toBeVisible();
    await expect(selectionInfo).toContainText('1 selected');
  });

  test('should enable Bulk Edit button when records are selected', async ({ page }) => {
    // Select first record
    const rows = page.getByRole('row');
    const firstDataRow = rows.nth(1);
    const firstCheckbox = firstDataRow.getByRole('checkbox');
    await firstCheckbox.click();
    
    // Verify Bulk Edit button appears
    const bulkEditButton = page.getByRole('button', { name: 'Bulk Edit' });
    await expect(bulkEditButton).toBeVisible();
    await expect(bulkEditButton).toBeEnabled();
  });

  test('should select multiple records', async ({ page }) => {
    const rows = page.getByRole('row');
    
    // Select first record
    await rows.nth(1).getByRole('checkbox').click();
    // Select second record
    await rows.nth(2).getByRole('checkbox').click();
    
    // Verify selection counter shows 2 selected
    const selectionInfo = page.locator('text=/\\d+ selected/');
    await expect(selectionInfo).toContainText('2 selected');
  });

  test('should open bulk edit form when Bulk Edit button is clicked', async ({ page }) => {
    // Select records
    const rows = page.getByRole('row');
    await rows.nth(1).getByRole('checkbox').click();
    await rows.nth(2).getByRole('checkbox').click();
    
    // Click Bulk Edit button
    await page.getByRole('button', { name: 'Bulk Edit' }).click();
    
    // Verify bulk edit form appears
    const heading = page.getByRole('heading', { level: 3 });
    await expect(heading).toContainText('Update 2 selected records');
    
    // Verify form fields exist
    await expect(page.getByRole('textbox', { name: 'New name' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'New email' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'New status' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'New department' })).toBeVisible();
  });

  test('should allow entering value in name field', async ({ page }) => {
    // Select first record
    const rows = page.getByRole('row');
    await rows.nth(1).getByRole('checkbox').click();
    
    // Open bulk edit form
    await page.getByRole('button', { name: 'Bulk Edit' }).click();
    
    // Type in the name field
    const nameInput = page.getByRole('textbox', { name: 'New name' });
    await nameInput.fill('Updated Employee Name');
    
    // Verify the value is entered
    await expect(nameInput).toHaveValue('Updated Employee Name');
  });

  test('should update name field in bulk edit', async ({ page }) => {
    // Get original names before update
    const rows = page.getByRole('row');
    const firstDataRow = rows.nth(1);
    const secondDataRow = rows.nth(2);
    
    // Select two records
    await firstDataRow.getByRole('checkbox').click();
    await secondDataRow.getByRole('checkbox').click();
    
    // Open bulk edit form
    await page.getByRole('button', { name: 'Bulk Edit' }).click();
    
    // Fill in the name field
    const newName = 'Bulk Updated Name';
    const nameInput = page.getByRole('textbox', { name: 'New name' });
    await nameInput.fill(newName);
    
    // Click Apply Updates button
    await page.getByRole('button', { name: 'Apply Updates' }).click();
    
    // Wait for update to complete
    await page.waitForTimeout(500);
    
    // Verify the names are updated in the table (use .first() to get first occurrence)
    const updatedCell = page.locator(`text=${newName}`);
    await expect(updatedCell.first()).toBeVisible();
  });

  test('should update only selected records name field', async ({ page }) => {
    const rows = page.getByRole('row');
    
    // Select only first and second records
    await rows.nth(1).getByRole('checkbox').click();
    await rows.nth(2).getByRole('checkbox').click();
    
    // Open bulk edit form
    await page.getByRole('button', { name: 'Bulk Edit' }).click();
    
    // Update name
    const newName = 'Test Bulk Name Update';
    await page.getByRole('textbox', { name: 'New name' }).fill(newName);
    
    // Apply updates
    await page.getByRole('button', { name: 'Apply Updates' }).click();
    
    // Wait for update
    await page.waitForTimeout(500);
    
    // Verify updated records have the new name (verify at least one instance exists)
    const updatedNameCell = page.locator(`text=${newName}`);
    await expect(updatedNameCell.first()).toBeVisible();
    
    // Verify the count of updated names is at least 2
    const updatedCells = page.locator(`text=${newName}`);
    const count = await updatedCells.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('should close bulk edit form when Cancel is clicked', async ({ page }) => {
    // Select a record
    const rows = page.getByRole('row');
    await rows.nth(1).getByRole('checkbox').click();
    
    // Open bulk edit form
    await page.getByRole('button', { name: 'Bulk Edit' }).click();
    
    // Verify form is visible
    const formHeading = page.getByRole('heading', { level: 3 });
    await expect(formHeading).toBeVisible();
    
    // Click Cancel button (use exact match to distinguish from "Cancel Bulk Edit")
    const buttons = page.locator('button:has-text("Cancel")');
    const cancelButton = buttons.locator('text=/^Cancel$/', { exact: true });
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();
    
    // Verify form is hidden
    await expect(formHeading).not.toBeVisible();
  });

  test('should reset form when Cancel Bulk Edit button is clicked', async ({ page }) => {
    // Select records
    const rows = page.getByRole('row');
    await rows.nth(1).getByRole('checkbox').click();
    await rows.nth(2).getByRole('checkbox').click();
    
    // Verify selections
    let selectionInfo = page.locator('text=/\\d+ selected/');
    await expect(selectionInfo).toContainText('2 selected');
    
    // Open bulk edit form
    await page.getByRole('button', { name: 'Bulk Edit' }).click();
    
    // Verify form is visible
    const formHeading = page.getByRole('heading', { level: 3 });
    await expect(formHeading).toBeVisible();
    
    // Click Cancel Bulk Edit button
    const cancelBulkEditButton = page.getByRole('button', { name: 'Cancel Bulk Edit' });
    await cancelBulkEditButton.click();
    
    // Verify form is closed
    await expect(formHeading).not.toBeVisible();
    
    // Verify Bulk Edit button is visible (selections are not cleared, form just closes)
    const bulkEditButton = page.getByRole('button', { name: 'Bulk Edit' });
    await expect(bulkEditButton).toBeVisible();
  });

  test('should display Refresh button', async ({ page }) => {
    const refreshButton = page.getByRole('button', { name: /Refresh/ });
    await expect(refreshButton).toBeVisible();
  });

  test('should allow clearing name field input', async ({ page }) => {
    // Select a record
    const rows = page.getByRole('row');
    await rows.nth(1).getByRole('checkbox').click();
    
    // Open bulk edit form
    await page.getByRole('button', { name: 'Bulk Edit' }).click();
    
    // Fill and then clear the name field
    const nameInput = page.getByRole('textbox', { name: 'New name' });
    await nameInput.fill('Test Name');
    await nameInput.clear();
    
    // Verify field is empty
    await expect(nameInput).toHaveValue('');
  });

  test('should update name with special characters', async ({ page }) => {
    // Select a record
    const rows = page.getByRole('row');
    await rows.nth(1).getByRole('checkbox').click();
    
    // Open bulk edit form
    await page.getByRole('button', { name: 'Bulk Edit' }).click();
    
    // Fill name field with special characters
    const specialName = "John O'Brien-Smith";
    const nameInput = page.getByRole('textbox', { name: 'New name' });
    await nameInput.fill(specialName);
    
    // Click Apply Updates
    await page.getByRole('button', { name: 'Apply Updates' }).click();
    
    // Wait for update
    await page.waitForTimeout(500);
    
    // Verify the name with special characters is displayed
    const updatedName = page.locator(`text=${specialName}`);
    await expect(updatedName).toBeVisible();
  });
});
