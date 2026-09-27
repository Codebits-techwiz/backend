# viva-prep-questions.md (WORKING DRAFT for the team)

## Security & Auth (Files: `authController.js`, `rateLimiter.js`, `server.js`)
1. How does the system prevent a student from accessing an admin's endpoints?
2. What mechanisms protect the backend from NoSQL injection during login?
3. How is the JWT managed securely on the client side, and why?
4. How do you ensure the system won't start in production with a default or missing JWT secret?
5. How did you implement and tune rate limiting to prevent brute-force attacks?

## Data Integrity & Validation (Files: `transactionValidator.js`, `validate.js`)
1. How are floating-point precision errors handled when storing currency?
2. How does the Zod validation middleware prevent invalid ObjectIds from crashing the server?
3. What happens if a user submits a CSV containing 1005 rows, and where is that limit enforced?
4. How are formula injections (e.g., CSV cells starting with `=`) mitigated?

## AI & Integrations (Files: `aiController.js`, `csvImportService.js`, `aiInsightsService.js`)
1. Describe the fallback mechanism if the Gemini API key is missing or the service is down.
2. How does the system ensure LLM responses are formatted as valid JSON?
3. When parsing a receipt, how do you prevent the AI from fabricating (hallucinating) data?
4. How does the system flag a transaction as an anomaly based on past spending behavior?

## Cron & Background Tasks (Files: `recurringCron.js`, `recurringService.js`)
1. How does the system automatically process recurring transactions daily?
2. What happens to a recurring rule if its `nextRunDate` was missed while the server was down?
3. How does the system differentiate between a manual transaction and an auto-recurring one in the ledger?

## Reports & Aggregation (Files: `reportService.js`)
1. Explain the MongoDB aggregation pipeline used to calculate the 6-month trend.
2. How are boundaries for ISO weeks handled correctly across different timezones?
