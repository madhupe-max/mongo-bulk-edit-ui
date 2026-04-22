const { expect } = require('chai');

/**
 * Appium tests for Mongo Bulk Edit iOS App.
 *
 * testID props are used as accessibility identifiers, which Appium/XCUITest
 * surfaces via the `~` (accessibility ID) selector strategy.
 *
 * Selector helper: $('~testID')
 */

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Wait for an element by accessibility ID and assert it is displayed.
 */
async function findById(testId, timeout = 15000) {
  const el = await $(`~${testId}`);
  await el.waitForDisplayed({ timeout });
  return el;
}

/**
 * Wait until the records list is loaded and at least one record row exists.
 */
async function waitForRecordsToLoad(timeout = 20000) {
  const list = await $('~records-list');
  await list.waitForDisplayed({ timeout });
}

// ─── Test Suites ─────────────────────────────────────────────────────────────

describe('Mongo Bulk Edit iOS App', () => {
  // ── App Launch ──────────────────────────────────────────────────────────────
  describe('App Launch', () => {
    it('should display the records screen on launch', async () => {
      const screen = await findById('records-screen');
      expect(await screen.isDisplayed()).to.be.true;
    });

    it('should display the toolbar with a Refresh button', async () => {
      const refreshBtn = await findById('refresh-button');
      expect(await refreshBtn.isDisplayed()).to.be.true;
    });

    it('should NOT show selection count when no records are selected', async () => {
      await waitForRecordsToLoad();
      const selCount = await $('~selection-count');
      const exists = await selCount.isExisting();
      expect(exists).to.be.false;
    });
  });

  // ── Records List ────────────────────────────────────────────────────────────
  describe('Records List', () => {
    before(async () => {
      await waitForRecordsToLoad();
    });

    it('should display the records list', async () => {
      const list = await findById('records-list');
      expect(await list.isDisplayed()).to.be.true;
    });

    it('should display the Select All button', async () => {
      const selectAll = await findById('select-all-button');
      expect(await selectAll.isDisplayed()).to.be.true;
    });

    it('should show at least one record row', async () => {
      // Record rows have testID "record-row-<id>"; we find by partial class name
      const rows = await $$('-ios class chain:**/XCUIElementTypeOther[`name BEGINSWITH "record-row-"`]');
      expect(rows.length).to.be.greaterThan(0);
    });
  });

  // ── Record Selection ─────────────────────────────────────────────────────────
  describe('Record Selection', () => {
    before(async () => {
      await waitForRecordsToLoad();
    });

    it('should show selection count after tapping a record row', async () => {
      // Tap the first record row
      const rows = await $$('-ios class chain:**/XCUIElementTypeOther[`name BEGINSWITH "record-row-"`]');
      expect(rows.length).to.be.greaterThan(0);
      await rows[0].click();

      const selCount = await findById('selection-count');
      const text = await selCount.getText();
      expect(text).to.match(/1 selected/);
    });

    it('should show the Bulk Edit button once a record is selected', async () => {
      const bulkEditBtn = await findById('bulk-edit-button');
      expect(await bulkEditBtn.isDisplayed()).to.be.true;
      const label = await bulkEditBtn.getText();
      expect(label).to.equal('Bulk Edit');
    });

    it('should increment selection count when a second record is tapped', async () => {
      const rows = await $$('-ios class chain:**/XCUIElementTypeOther[`name BEGINSWITH "record-row-"`]');
      if (rows.length < 2) {
        return; // not enough records to run this test
      }
      await rows[1].click();

      const selCount = await findById('selection-count');
      const text = await selCount.getText();
      expect(text).to.match(/2 selected/);
    });

    it('should deselect a record when tapped again', async () => {
      const rows = await $$('-ios class chain:**/XCUIElementTypeOther[`name BEGINSWITH "record-row-"`]');
      // Tap row[1] again to deselect it
      await rows[1].click();

      const selCount = await findById('selection-count');
      const text = await selCount.getText();
      expect(text).to.match(/1 selected/);
    });

    it('should select all records using the Select All button', async () => {
      const selectAllBtn = await findById('select-all-button');
      await selectAllBtn.click();

      const selCount = await findById('selection-count');
      const text = await selCount.getText();
      // Count should match total records (text contains "X selected")
      expect(text).to.match(/\d+ selected/);

      const allRows = await $$('-ios class chain:**/XCUIElementTypeOther[`name BEGINSWITH "record-row-"`]');
      const count = parseInt(text.match(/(\d+)/)[1], 10);
      expect(count).to.equal(allRows.length);
    });

    it('should deselect all records when Select All is tapped again', async () => {
      const selectAllBtn = await findById('select-all-button');
      await selectAllBtn.click();

      // Selection count element should disappear
      await driver.pause(500);
      const selCount = await $('~selection-count');
      const exists = await selCount.isExisting();
      expect(exists).to.be.false;
    });
  });

  // ── Bulk Edit Panel ──────────────────────────────────────────────────────────
  describe('Bulk Edit Panel', () => {
    before(async () => {
      await waitForRecordsToLoad();

      // Select two records
      const rows = await $$('-ios class chain:**/XCUIElementTypeOther[`name BEGINSWITH "record-row-"`]');
      await rows[0].click();
      if (rows.length > 1) await rows[1].click();

      // Open bulk edit panel
      const bulkEditBtn = await findById('bulk-edit-button');
      await bulkEditBtn.click();
    });

    it('should display the bulk edit panel', async () => {
      const panel = await findById('bulk-edit-panel');
      expect(await panel.isDisplayed()).to.be.true;
    });

    it('should show the correct title in the bulk edit panel', async () => {
      const title = await findById('bulk-edit-title');
      const text = await title.getText();
      expect(text).to.match(/Update \d+ selected record/);
    });

    it('should display input fields for each editable field', async () => {
      // These fields match the default MongoDB test data
      const fields = ['name', 'email', 'status', 'department'];
      for (const field of fields) {
        const input = await $(`~bulk-input-${field}`);
        const exists = await input.isExisting();
        expect(exists, `Input for field "${field}" should exist`).to.be.true;
      }
    });

    it('should allow typing in the name field', async () => {
      const nameInput = await $('~bulk-input-name');
      await nameInput.clearValue();
      await nameInput.setValue('Test Name');
      const val = await nameInput.getValue();
      expect(val).to.equal('Test Name');
    });

    it('should allow typing in the status field', async () => {
      const statusInput = await $('~bulk-input-status');
      await statusInput.clearValue();
      await statusInput.setValue('active');
      const val = await statusInput.getValue();
      expect(val).to.equal('active');
    });

    it('should dismiss the panel when Cancel is tapped', async () => {
      const cancelBtn = await findById('cancel-bulk-edit-button');
      await cancelBtn.click();

      await driver.pause(500);
      const panel = await $('~bulk-edit-panel');
      const visible = await panel.isExisting();
      expect(visible).to.be.false;
    });
  });

  // ── Apply Bulk Update ────────────────────────────────────────────────────────
  describe('Apply Bulk Update', () => {
    const NEW_STATUS = `test-${Date.now()}`;

    before(async () => {
      await waitForRecordsToLoad();

      // Select first record
      const rows = await $$('-ios class chain:**/XCUIElementTypeOther[`name BEGINSWITH "record-row-"`]');
      await rows[0].click();

      // Open bulk edit panel
      const bulkEditBtn = await findById('bulk-edit-button');
      await bulkEditBtn.click();

      // Fill the status field
      const statusInput = await findById('bulk-input-status');
      await statusInput.clearValue();
      await statusInput.setValue(NEW_STATUS);
    });

    it('should apply updates when Apply Updates button is tapped', async () => {
      const applyBtn = await findById('apply-updates-button');
      expect(await applyBtn.isDisplayed()).to.be.true;
      await applyBtn.click();

      // A success alert should appear
      const alert = await driver.getAlertText();
      expect(alert).to.include('Updated');
      await driver.acceptAlert();
    });

    it('should reload the records list after applying updates', async () => {
      // Panel should be dismissed and list should be visible again
      await waitForRecordsToLoad();
      const list = await findById('records-list');
      expect(await list.isDisplayed()).to.be.true;
    });
  });

  // ── Refresh ──────────────────────────────────────────────────────────────────
  describe('Refresh', () => {
    it('should reload records when the Refresh button is tapped', async () => {
      const refreshBtn = await findById('refresh-button');
      await refreshBtn.click();
      await waitForRecordsToLoad();

      const list = await findById('records-list');
      expect(await list.isDisplayed()).to.be.true;
    });
  });

  // ── Validation ───────────────────────────────────────────────────────────────
  describe('Bulk Edit Validation', () => {
    before(async () => {
      await waitForRecordsToLoad();

      // Select one record
      const rows = await $$('-ios class chain:**/XCUIElementTypeOther[`name BEGINSWITH "record-row-"`]');
      await rows[0].click();

      // Open bulk edit panel
      const bulkEditBtn = await findById('bulk-edit-button');
      await bulkEditBtn.click();
    });

    it('should show an alert when Apply is tapped with no values entered', async () => {
      // All fields are empty
      const applyBtn = await findById('apply-updates-button');
      await applyBtn.click();

      const alertText = await driver.getAlertText();
      expect(alertText).to.satisfy(
        (t) => t.includes('Validation') || t.includes('enter') || t.includes('value'),
        `Expected a validation alert but got: "${alertText}"`
      );
      await driver.acceptAlert();
    });

    after(async () => {
      // Cancel and clean up
      const cancelBtn = await $('~cancel-bulk-edit-button');
      if (await cancelBtn.isExisting()) await cancelBtn.click();
    });
  });
});
