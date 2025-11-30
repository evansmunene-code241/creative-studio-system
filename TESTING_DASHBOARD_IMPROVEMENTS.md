# Testing Dashboard Improvements - Quick Guide

## Prerequisites
1. Backend running on http://localhost:3000
2. Frontend running or accessed via browser
3. Test account ready (or use admin account: liza@gmail.com / 123456)

---

## Test Scenario 1: Overview Tab ✅

### Steps:
1. Login to dashboard
2. You should land on the **Overview tab** (not Files tab)
3. Look for these elements:

### Verify:
- [ ] "📊 Quick Stats" card is visible
- [ ] Shows **Total Files** (should be 0 for new user)
- [ ] Shows **Total Backups** (should be 0 for new user)
- [ ] Shows **Storage Used** as percentage (e.g., 0%)
- [ ] Shows **Last Activity** (should be "-" for new user)
- [ ] "📈 Storage Overview" chart is visible
- [ ] Doughnut chart displays with blue (used) and gray (available)

**Expected Result:** 
```
Quick Stats:
- Total Files: 0
- Total Backups: 0
- Storage Used: 0%
- Last Activity: -
```

---

## Test Scenario 2: File Upload and Overview Update ✅

### Steps:
1. Click **Files** tab
2. Upload a test file (or drag & drop)
3. Go back to **Overview** tab

### Verify:
- [ ] File appears in Files tab
- [ ] Overview updates automatically
- [ ] **Total Files** increased to 1
- [ ] **Storage Used** shows updated percentage

**Expected Result:**
```
After upload:
- Total Files: 1
- Storage Used: X.XX% (depends on file size)
```

---

## Test Scenario 3: File Search & Filter ✅

### Steps:
1. Upload 3-4 test files with different names:
   - "document.pdf"
   - "image.jpg"
   - "data.xlsx"
   - "report.docx"
2. Stay in **Files** tab
3. Use the search box to search for "image"

### Verify:
- [ ] Only "image.jpg" appears in list
- [ ] Other files disappear
- [ ] File count displays correctly
- [ ] Search is real-time (updates as you type)

**Test Sorting:**
1. Click **Sort Dropdown** and select "Name A-Z"
2. Verify files are sorted alphabetically
3. Click **Sort Dropdown** and select "Size"
4. Verify files are sorted by size (largest first)
5. Click **Sort Dropdown** and select "Recent"
6. Verify files are sorted by upload date (newest first)

**Expected Result:**
```
Search "image": 
- Only image.jpg shows

Sort by Name A-Z:
1. data.xlsx
2. document.pdf
3. image.jpg
4. report.docx

Sort by Size:
(Files ordered by size largest → smallest)

Sort by Recent:
(Files ordered by upload time newest → oldest)
```

---

## Test Scenario 4: Backup and Enhanced Display ✅

### Steps:
1. Click **Files** tab
2. Click "💾 Backup" button on one of the files
3. Go to **Backup History** tab
4. Verify backup appears

### Verify Backup Display:
- [ ] Table shows **File Name** with icon (📄)
- [ ] **File Size** displays correctly
- [ ] **Status** shows "completed" in green badge
- [ ] **Created At** shows exact timestamp (MM/DD/YYYY HH:MM:SS AM/PM)
- [ ] All info is readable and well-formatted

**Expected Result:**
```
Backup History Table:
┌─────────────────────┬──────────┬───────────┬─────────────────────────┐
│ File Name           │ Size     │ Status    │ Created At              │
├─────────────────────┼──────────┼───────────┼─────────────────────────┤
│ document.pdf        │ 1.23 MB  │ completed │ 01/15/2024 02:45:30 PM │
└─────────────────────┴──────────┴───────────┴─────────────────────────┘
```

### Test Backup Filters:
1. Create 2-3 backups to have multiple entries
2. Click **Status Filter** dropdown
3. Select "Completed" → only completed backups show
4. Select "All Status" → all backups show again
5. Type in search box → filters by filename

**Expected Result:**
```
Filter "Completed":
- Shows only completed backups (green badge)

Search "document":
- Shows only backups with "document" in filename
```

---

## Test Scenario 5: Role Badge Display ✅

### Steps:
1. Look at the sidebar (left side)
2. Find your username and email
3. Look below the email for the role badge

### Verify for Different Users:

**Admin (Liza):**
- [ ] Badge shows "⭐ Admin"
- [ ] Badge background is RED (#dc2626)
- [ ] Badge text is WHITE

**Manager (if available):**
- [ ] Badge shows "👨‍💼 Manager"
- [ ] Badge background is AMBER (#f59e0b)
- [ ] Badge text is WHITE

**Team Member (regular user):**
- [ ] Badge shows "👤 Team Member"
- [ ] Badge background is BLUE (#3b82f6)
- [ ] Badge text is WHITE

**Expected Result:**
```
Sidebar:
┌──────────────────────┐
│        👤            │
│     John Smith       │
│   john@example.com   │
│   👤 Team Member     │
└──────────────────────┘
```

---

## Test Scenario 6: Storage Warning System ✅

### Steps:
1. Go to **Overview** tab
2. Check storage percentage
3. Look at storage bar color in sidebar

### Verify Storage Colors:

**For 0-75% usage (Green):**
- [ ] Storage bar is GREEN (#10b981)
- [ ] No warning appears

**For 75-90% usage (Yellow):**
- [ ] Storage bar is YELLOW (#f59e0b)
- [ ] Yellow warning appears: "⚠️ Storage at..." (if close)

**For >90% usage (Red):**
- [ ] Storage bar is RED (#ef4444)
- [ ] Red alert appears: "⚠️ Storage almost full!"

**Expected Result:**
```
Low usage (< 75%):
Storage bar: GREEN ████░░░░░░ 45%

Medium usage (75-90%):
Storage bar: YELLOW ████████░░ 82%
⚠️ Warning appears

High usage (> 90%):
Storage bar: RED █████████░ 95%
⚠️ Alert appears
```

---

## Test Scenario 7: Overview Stats Auto-Update ✅

### Steps:
1. Open Overview tab
2. Note the "Last Activity" time
3. Create another backup
4. Return to Overview tab (within 30 seconds)

### Verify:
- [ ] "Last Activity" updates to "Just now"
- [ ] File/backup counts update automatically
- [ ] Storage percentage updates if size changed

**Expected Result:**
```
Before backup: Last Activity = 2 hours ago
After backup:  Last Activity = Just now
```

---

## Test Scenario 8: Tab Navigation ✅

### Steps:
1. Click **Overview** tab
2. Click **Files** tab
3. Click **Backup History** tab
4. Click **Profile Settings** tab
5. Click back to **Overview**

### Verify:
- [ ] Tab switching is smooth and instant
- [ ] Active tab button stays highlighted
- [ ] Content updates correctly for each tab
- [ ] Data persists when returning to tabs

**Expected Result:**
All tabs switch smoothly with proper highlighting.

---

## Test Scenario 9: Mobile Responsiveness ✅

### Steps:
1. Open dashboard in browser DevTools
2. Toggle device toolbar (F12 → Toggle device toolbar)
3. Select "iPhone 12" or similar mobile size

### Verify on Mobile:
- [ ] Sidebar is still accessible (may be hidden/drawer)
- [ ] Stat cards stack vertically (1 per row)
- [ ] Search boxes are readable
- [ ] Table (backups) scrolls horizontally or stacks
- [ ] All buttons are touch-friendly (large enough)
- [ ] Text is readable (no overflow)

**Expected Result:**
Dashboard should be fully usable on mobile without zoom.

---

## Test Scenario 10: Data Persistence ✅

### Steps:
1. Create 3 files and 2 backups
2. Close the browser tab
3. Reopen dashboard (login again)

### Verify:
- [ ] All files still appear in Files tab
- [ ] All backups still appear in Backup History
- [ ] Overview stats are accurate
- [ ] Search functionality works on loaded data

**Expected Result:**
All data persists and loads correctly from backend.

---

## Performance Checks

### Load Time:
- [ ] Overview tab loads in < 2 seconds
- [ ] Files list loads in < 2 seconds
- [ ] Backups list loads in < 2 seconds

### Update Speed:
- [ ] Search filtering is instant (no lag)
- [ ] Sorting is instant (no lag)
- [ ] Page refresh every 30 seconds (silent, no flicker)

### Memory Usage:
- [ ] No browser console errors
- [ ] Dashboard remains responsive after 10+ minutes

---

## Browser Console Check

### Steps:
1. Press F12 to open DevTools
2. Click **Console** tab
3. Perform all actions above
4. Look for any red errors

### Verify:
- [ ] No red errors in console
- [ ] No 404 errors for resources
- [ ] No authentication warnings

---

## Bug Report Template

If you find any issues, document them:

```
Bug Title: [Brief description]
Severity: [Critical/High/Medium/Low]
Steps to Reproduce:
1. ...
2. ...
3. ...
Expected Result: ...
Actual Result: ...
Browser: Chrome/Firefox/Safari/Edge
OS: Windows/Mac/Linux
```

---

## Success Criteria

✅ **All tests should pass:**
- [ ] Overview tab loads and shows stats
- [ ] File search & filter works
- [ ] Backup filters work
- [ ] Role badge displays correctly
- [ ] Storage warning colors work
- [ ] All tabs switch smoothly
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Data persists correctly
- [ ] Performance is acceptable

---

## Sign-off

Once all tests pass:

```
Date: _______________
Tester: _____________
Status: ✅ PASS / ❌ FAIL
Comments: _____________________________
```

---

## Quick Verification Checklist

Run through this in ~5 minutes:

- [ ] Open Overview tab - shows stats
- [ ] Upload file - stats update
- [ ] Search file - finds it
- [ ] Create backup - appears in history
- [ ] Check role badge - shows correct role
- [ ] Check storage bar - correct color
- [ ] Check mobile - responsive
- [ ] Console - no errors

**All green?** 🎉 Dashboard improvements are working perfectly!
