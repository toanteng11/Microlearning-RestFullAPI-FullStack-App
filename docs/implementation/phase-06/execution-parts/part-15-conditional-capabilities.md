# Part 15 - Conditional Capabilities

## Goal

Triển khai riêng từng capability Conditional được Gate A bật; capability không bật phải có
`APPROVED_NA` và không tạo source file rỗng.

## Parent PR

`P06-PR07 - Conditional Reporting`

## Dependencies

- Part 07-14 stable.
- `P06-GA-C01..C06` có disposition.

## Subpart 15A - CSV Export

Chỉ thực hiện khi `P06-GA-C01=Approved`.

- bounded Teacher/Admin CSV;
- same scoped filter as JSON;
- allowlist columns;
- neutralize formula injection;
- stream response, không local disk;
- audit request/result metadata;
- tests `P06-UT-018`, `P06-IT-051..056`, `P06-WEB-012`, `P06-E2E-12`;
- acceptance `P06-AC-069..070`.

## Subpart 15B - Analytics Event Foundation

Chỉ thực hiện khi `P06-GA-C02=Approved`.

- versioned schema, allowlist, actor from auth;
- dedupe/idempotency, TTL và rate limit;
- reject unnecessary PII/unknown properties;
- storage failure không làm fail learning workflow;
- tests `P06-UT-019`, `P06-IT-057..059`;
- acceptance `P06-AC-071`.

## Subpart 15C - Student Trend

Chỉ thực hiện khi `P06-GA-C03=Approved`.

- compatible versioned snapshots;
- insufficient/incompatible data trả `NO_DATA`;
- không nội suy dữ liệu;
- tests `P06-IT-028` và dedicated Web cases;
- acceptance `P06-AC-072`.

## Subpart 15D - Admin Learning Outcome

Chỉ thực hiện khi `P06-GA-C04=Approved`.

- aggregate only;
- minimum group size `5`;
- differencing/privacy review;
- không expose individual Grade;
- acceptance `P06-AC-073`.

## Explicitly Deferred

- Weighted process score V2 nếu `P06-GA-C05=Defer`.
- XLSX/async/private export nếu `P06-GA-C06=Defer`.
- Không tạo local export directory, scheduler hoặc fake Cloud storage.

## Definition Of Done

- Mỗi enabled subpart có flag, permission/allowedAction, tests và evidence riêng.
- Disabled subpart có approval N/A, không có route/file/service mồ côi.
- Một subpart fail không buộc merge các subpart khác.
