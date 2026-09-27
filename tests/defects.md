# defects.md (WORKING DRAFT for the team)

## Open Defects

**ID**: DEF-001
**Severity**: Medium
**Description**: Invalid ObjectId in request parameters triggers a 500 Internal Server Error (Mongoose CastError) instead of returning a 400 Bad Request.
**Steps to Reproduce**: 
1. Send a GET request to `/api/transactions/invalid-id`.
2. Observe the 500 status code and stack trace in the server console.
**Expected vs Actual**: Expected 400 Bad Request, but got 500 Internal Server Error.
**File Evidence**: `server/controllers/transactionController.js` and `server/middleware/errorHandler.js`

**ID**: DEF-002
**Severity**: High
**Description**: Budget alert notifications might not be returning correctly or the budget calculation logic fails to trigger the 80% threshold alert properly.
**Steps to Reproduce**: 
1. Create a category and set a budget of $100.
2. Log an expense of $85.
3. Fetch `/api/notifications`.
**Expected vs Actual**: Expected the `/api/notifications` array to contain an 80% budget alert, but either the array was undefined or the notification wasn't generated.
**File Evidence**: `server/services/budgetService.js` and `server/controllers/notificationController.js`

**ID**: DEF-003
**Severity**: High
**Description**: Profile endpoint bypassed the service layer and the money-conversion contract; fixed to match the rest of the API.
**Steps to Reproduce**: 
1. Send PUT `/api/users/profile` with `monthlyAllowanceBaseline` as `500`.
2. Backend stored `500` (which is $5 in cents instead of $500).
**Expected vs Actual**: Expected the controller to convert UI dollars to cents before saving and return UI dollars. Actual behavior bypassed `userService.js` entirely and saved exact raw numbers.
**File Evidence**: `server/controllers/userController.js`, `server/services/userService.js`, and `src/pages/student/Profile.jsx`

## Defect Log Template
**ID**: DEF-XXX
**Severity**: [Critical/High/Medium/Low]
**Description**: 
**Steps to Reproduce**: 
1. 
2. 
**Expected vs Actual**: 
**File Evidence**: 
