# Phase 08 — BA Alignment and Decisions

## BA baseline

Nguồn nghiệp vụ chính cần đối chiếu khi execution:

- `business-analysis/18-acceptance-criteria/system-acceptance-criteria.md`
- `business-analysis/18-acceptance-criteria/uat-plan.md`
- `business-analysis/18-acceptance-criteria/uat-execution-and-signoff.md`
- `business-analysis/18-acceptance-criteria/devops-release-acceptance.md`
- `business-analysis/21-release-planning/release-entry-exit-criteria.md`
- `business-analysis/21-release-planning/release-governance-and-approval.md`
- `business-analysis/21-release-planning/release-dependencies-and-assumptions.md`

## Decisions carried forward

| Decision | State | P08 implication |
|---|---|---|
| Cloud provider | `BASELINE` | Google Cloud Run + Artifact Registry + Secret Manager + Monitoring; Firebase excluded. |
| Database | `BASELINE` | MongoDB Atlas; synthetic-only for academic release; database user/name, network, backup/restore and profile-specific tier decision must be evidenced. |
| Invitation | `BASELINE` | `MANUAL_COPY`; no SMTP/Gmail dependency. |
| Conditional resources/media | `BASELINE` | Feature flags in Terraform are false in staging; no P08 Must without CR. |
| Reporting | `BASELINE` | Reporting/read-model/privacy and freshness must be regression-tested. |
| Release authority | `PLANNED` | PO accountable; TL/QA/DevOps provide role-specific recommendations. In a solo project these may be the same named actor and are not independent. |
| Release profile | `PLANNED` | `ACADEMIC_DEMO_RELEASE`, synthetic-only, must be confirmed at G0. |

## P08 decision log template

| ID | Question/decision | Options | Decision | Authority | Date UTC | Evidence | Status |
|---|---|---|---|---|---|---|---|
| `P08-DEC-000` | Release profile and data class | academic synthetic / organization real-data | `PENDING` | PO | `PENDING` | `<link>` | `PENDING` |
| `P08-DEC-001` | Atlas network/database/backup/restore/PITR | academic controls / organization controls | `PENDING` | PO + DevOps | `PENDING` | `<link>` | `PENDING` |
| `P08-DEC-002` | Production apply mode | plan-only through G4 / protected apply after G5 | `PENDING` | TL + DevOps | `PENDING` | `<link>` | `PENDING` |
| `P08-DEC-003` | UAT real vs synthetic data | synthetic / sanitized | `PENDING` | PO + Security | `PENDING` | `<link>` | `PENDING` |
| `P08-DEC-004` | Custom domain/TLS | run.app / approved domain | `PENDING` | PO + DevOps | `PENDING` | `<link>` | `PENDING` |

## Execution history boundary

Các NO_GO/checkpoint đã chạy trước khi baseline này được sửa chỉ là historical artifacts. Không đưa commit, digest, URL hoặc ngày cũ vào planning template. Khi Part 00 bắt đầu, tạo release-scoped folder mới và decision IDs mới; không ghi đè raw history.

## Interpretation rules

- P07 `66/66` là regression baseline, không phải bằng chứng UAT/P08.
- `APPROVED_NA` chỉ dùng cho capability thực sự ngoài scope và phải link decision; không dùng để thay test bắt buộc.
- Managed PITR có thể `APPROVED_NA` cho academic profile, nhưng logical backup và isolated restore vẫn bắt buộc.
- External UAT participant có thể optional; role-based UAT bằng synthetic personas vẫn bắt buộc.
- Nếu BA requirement, code/config và test expected mâu thuẫn, mở decision/CR trước khi đánh dấu Pass.
