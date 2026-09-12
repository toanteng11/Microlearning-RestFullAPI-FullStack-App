# Phase 08 Execution Parts

## Cách sử dụng

Thực hiện theo thứ tự dependency. Mỗi part chỉ chuyển `DONE` khi code/config, tests, PR/main và evidence của gate tương ứng đều đạt; viết xong tài liệu không phải hoàn thành part.

| Part | Parent PR | Outcome | Gate | Status |
| --- | --- | --- | --- | --- |
| 00 | P08-PR00 | Baseline, release profile và solo governance được chốt | G0 | `DONE` |
| 01 | P08-PR01 | Handoff/identity contract không còn vòng lặp | G0 | `DONE` |
| 02 | P08-PR01 | Evidence contracts và artifact workspace sẵn sàng | G1 | `DONE` |
| 03 | P08-PR02 | System Test automation và release summary | G2 | `DONE` |
| 04 | P08-PR02 | Security/privacy/API/data regression | G2 | `LOCAL_PASS_REMOTE_PENDING` |
| 05 | P08-PR02 | Performance/accessibility/responsive verification | G2 | `LOCAL_PASS_REMOTE_PENDING` |
| 06 | P08-PR03 | UAT personas, data và environment ready | G1/G3 | `NOT_STARTED` |
| 07 | P08-PR03 | UAT 001-032, defect/retest và sign-off | G3/G4 | `NOT_STARTED` |
| 08 | P08-PR04 | Production Terraform/Atlas/recovery plan ready | G4/G5 | `NOT_STARTED` |
| 09 | P08-PR05 | Pre-release acceptance và protected Go/No-Go | G5 | `NOT_STARTED` |
| 10 | P08-PR05 | Immutable Production deployment và smoke | G6 | `NOT_STARTED` |
| 11 | P08-PR06 | Observation, incident/rollback và hypercare | G7 | `NOT_STARTED` |
| 12 | P08-PR06 | Training, support, communication và handover | G7 | `NOT_STARTED` |
| 13 | P08-PR06 | Final acceptance, evidence integrity và project exit | G8 | `NOT_STARTED` |

## Status vocabulary

`NOT_STARTED`, `IN_PROGRESS`, `LOCAL_PASS_REMOTE_PENDING`, `BLOCKED`, `DONE`.

Nhánh triển khai Phase 08 dùng mẫu `phase-08-part-<nn>-<scope>`; không thêm tiền tố `codex/`. Part 03 được triển khai trên `phase-08-part-03-system-test`.

Part 04-05 dùng quality suite riêng nhưng chạy bên trong cùng workflow System Test để giữ nguyên release identity. Local tooling/format/lint/typecheck Pass; trạng thái chỉ đổi thành `DONE` khi workflow trên `main` tạo raw observations, quality summary, validation report và final redaction report cho exact candidate.

## Global stop conditions

- Secret/real PII appears in source, log or evidence.
- Candidate identity differs between tests and promotion.
- System Test/UAT Must is Fail/Blocked/Not Run at G5.
- Critical/High defect or integrity/security/privacy issue remains open.
- Production apply is attempted without exact G5 GO and protected environment.
- Terraform plan has unexpected destroy, cross-environment reference or unauthorized public access.
- Production smoke detects auth/data/version mismatch or alerting cannot observe the release.
