# demo-video-script.md (WORKING DRAFT for the team)

## Scene 1: Authentication & Onboarding
- **Action:** Open login screen. Submit credentials for `student@campuscoin.com` (`password123`).
- **Narration:** "Welcome to Campus Coin. We begin by logging into a pre-seeded student account. Notice the HttpOnly cookie ensuring session security."
- **Action:** Navigate to [Front-End Profile Page].
- **Narration:** "Students can configure their academic year and currency preferences here."

## Scene 2: Budgeting & Alerts
- **Action:** Create a custom category "Textbooks". Set a $200 limit for the month.
- **Action:** Enter a transaction for $180 manually.
- **Narration:** "Entering a large expense. Because this crosses the 80% threshold, a budget alert is triggered immediately."
- **Action:** Show the top-right notification bell with the new alert.

## Scene 3: AI Innovations & Tips
- **Action:** Navigate to the AI Insights tab.
- **Narration:** "Campus Coin leverages Gemini 2.5 Flash for proactive insights. Here we see the generated monthly summary."
- **Action:** Go to Saving Tips. Pin one tip, dismiss another.
- **Narration:** "Tips are ranked by potential savings. Pinning a tip keeps it at the top of the list."

## Scene 4: CSV Import Orchestration
- **Action:** Click "Import Statement". Upload `bank_export.csv`.
- **Narration:** "Let's import a bank CSV. The backend validates limits and maps unknown merchants to categories using AI."
- **Action:** Show the preview table where one row is flagged "needs review". Fix it and confirm.

## Scene 5: Receipts & Anomaly Detection
- **Action:** Upload a receipt image for a coffee purchase.
- **Narration:** "Our Vision API integration extracts the amount, date, and vendor instantly."
- **Action:** Attempt to upload the exact same receipt again.
- **Narration:** "The anomaly detection engine catches the duplicate and flags it for review."

## Scene 6: Reporting & Trends
- **Action:** Navigate to Reports tab. Select a 6-month trend view.
- **Narration:** "Detailed charting pulls from our robust aggregation pipelines, breaking down expenses by daily and weekly metrics."

## Scene 7: Admin Isolation
- **Action:** Log out. Log in as `admin@campuscoin.com`.
- **Action:** View the Admin Dashboard.
- **Narration:** "Admins have a completely isolated route architecture. They can see global volume metrics but cannot view individual student transactions."
- **Action:** Disable a dummy user account to show administrative controls.
