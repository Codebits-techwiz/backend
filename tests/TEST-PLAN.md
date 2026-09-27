# TEST-PLAN.md (WORKING DRAFT for the team)

## Strategy
This test plan aims to validate the functional, security, boundary, and regression requirements of the Campus Coin API backend against the official SRS (TechWiz 7). We will use a combination of automated testing (Jest + Supertest for critical security/isolation boundaries) and comprehensive manual testing via Postman. 

## Execution Order
1. **Automated Suite**: Execute `npm run test` against the `_test` database.
2. **Postman - Setup & Auth**: Run Auth requests to generate tokens for John, Jane, and Admin.
3. **Postman - Security & Boundaries**: Test isolation, ownership, rate limits, and NoSQL injection.
4. **Postman - Functional Endpoints**: Budget alerts, CSV limits, Tip generation, Anomaly detection, and Recurring rules.
5. **Postman - Admin**: Stats, Announcements, Category CRUD.

## Environment
- **Development Database**: `mongodb://127.0.0.1:27017/campus_coin` (Used for manual/Postman testing and seeded data).
- **Test Database**: `mongodb://127.0.0.1:27017/campus_coin_test` (Strictly used for the Jest automated suite. The suite will refuse to run on any other DB).
- **Postman Variables**: Requires a configured environment containing base URL, JWT tokens, and captured entity IDs (e.g., `{{categoryId}}`).

## Entry and Exit Criteria
- **Entry**: API must compile, start, and respond to `/api/health`. Mongoose connection must be `connected`. Seed script must complete successfully.
- **Exit**: 100% of the mandatory functional and security test cases pass. No Critical or High severity defects remain open in `defects.md`. Code coverage for critical auth and ownership paths should be >80%.

## Severity Levels
- **Critical**: System crash, data loss, total security bypass (e.g., student accessing admin routes, cross-user data modification).
- **High**: Major functional requirement broken without workaround (e.g., budget alerts not firing, CSV import crashing).
- **Medium**: Functional requirement broken with workaround, or cosmetic issue affecting usability (e.g., pagination bug, anomaly detection false positives).
- **Low**: Minor cosmetic issue, typo in response, or minor edge case not affecting core flow.

## Defect Log Template
For `defects.md`:
**ID**: DEF-XXX
**Severity**: [Critical/High/Medium/Low]
**Description**: ...
**Steps to Reproduce**: ...
**Expected vs Actual**: ...
**File Evidence**: ...
