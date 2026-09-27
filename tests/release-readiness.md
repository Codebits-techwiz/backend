# release-readiness.md (WORKING DRAFT for the team)

## Scoreboard

| Metric | Status / Value | Target |
|---|---|---|
| Mandatory SRS Items Implemented | 100% | 100% |
| Automated Test Coverage (Auth/Isolation) | Passing | Passing |
| Functional Test Cases Passed (Postman) | 100/100 | 100% |
| Open Critical Defects | 0 | 0 |
| Open High Defects | 0 | 0 |
| Open Medium/Low Defects | 0 | Acceptable if documented |

## Rules for "Ready"
The release is considered "Ready" ONLY when:
1. Every mandatory backend SRS item (A1-A6, C1-C4, D1-D3, L1-L3, AC1-AC4, R1-R5, I1-I4, T1-T3, B1-B3, K1-K2, M1-M4, S1-S3) is fully implemented.
2. `npm run test` executes against the `_test` DB and reports 0 failures.
3. No Critical or High severity defects remain open in `defects.md`.
