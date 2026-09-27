# e2e-runbooks.md (WORKING DRAFT for the team)

## 1. Student Journey (SRS A1, T1, B1, M1)
- **Checkpoint 1:** Register new user John (`POST /auth/register`). Verify JWT cookie is set.
- **Checkpoint 2:** Create a custom category "Groceries" (`POST /categories`).
- **Checkpoint 3:** Set a monthly budget limit of $100 for Groceries (`POST /budgets`).
- **Checkpoint 4:** Log an expense of $85 in Groceries (`POST /transactions`).
- **Checkpoint 5:** Verify Dashboard shows remaining budget and top tip (`GET /dashboard/summary`).
- **Checkpoint 6:** View AI Monthly Insights (`GET /ai/monthly-insights`).

## 2. Admin Journey (SRS AD1, AD2)
- **Checkpoint 1:** Login as Admin (`POST /auth/admin-login`).
- **Checkpoint 2:** View global platform statistics (`GET /admin/stats`). Verify total transactions count.
- **Checkpoint 3:** Disable John's account (`POST /admin/users/:id/disable`).
- **Checkpoint 4:** Verify John can no longer fetch his profile (`GET /users/profile`).

## 3. Forgot-Password Journey (SRS A3)
- **Checkpoint 1:** Request reset for Jane (`POST /auth/forgot-password`).
- **Checkpoint 2:** Extract reset token from local console logs (or mock email service).
- **Checkpoint 3:** Submit new password using token (`POST /auth/reset-password`).
- **Checkpoint 4:** Login successfully with new password (`POST /auth/login`).

## 4. Recurring and Cron Journey (SRS R1, R2)
- **Checkpoint 1:** Create a weekly recurring rule for Spotify $10 (`POST /recurring`).
- **Checkpoint 2:** Wait for or manually invoke the cron job endpoint (`POST /admin/trigger-cron` or let the server run overnight).
- **Checkpoint 3:** Verify a new transaction was generated automatically with `[Auto-Recurring]` in the description.
- **Checkpoint 4:** Verify the rule's `nextRunDate` advanced by exactly 7 days.

## 5. CSV Import Journey (SRS I1, I4)
- **Checkpoint 1:** Upload a CSV with 5 valid rows and 1 unmatched category (`POST /import-csv/preview`).
- **Checkpoint 2:** Verify the AI marks the unmatched row with `needsReview: true` and a suggested category.
- **Checkpoint 3:** Confirm the import array (`POST /import-csv/confirm`).
- **Checkpoint 4:** Verify transactions appear in the ledger and any budget alerts (e.g. 80%) are triggered.
