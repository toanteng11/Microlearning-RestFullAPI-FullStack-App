# Phase 04 Risk And Issues

## 1. Rating

- Probability: `Low`, `Medium`, `High`.
- Impact: `Low`, `Medium`, `High`, `Critical`.
- Risk status: `Open`, `Monitoring`, `Mitigated`, `Accepted`, `Closed`.
- Issue là điều đã xảy ra; risk là điều có thể xảy ra. Không chuyển risk thành issue nếu chưa có trigger.

## 2. Risk Register

| ID | Risk | P | I | Trigger | Mitigation | Contingency | Owner | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| P04-R001 | Scope tràn sang Quiz/Assignment/Reporting | High | High | API/UI xuất hiện field/workflow P05/06 | Scope/traceability/PR review | Remove/defer trước merge | PO/TL | Open |
| P04-R002 | Dashboard v1 bị hiểu là grade | Medium | High | UI/API gọi processScore là điểm | Metric version + label Lesson completion | Rename/migration docs | BA/FE | Open |
| P04-R003 | Visibility logic phân tán gây draft leak | Medium | Critical | Route tự query bỏ ancestor check | Central resolver + IDOR matrix | Disable affected route, patch + audit | BE/Security | Open |
| P04-R004 | Stored XSS từ Markdown | Medium | Critical | Raw HTML/unsafe renderer | Proven renderer + sanitizer + corpus | Unpublish content, security fix | FE/Security | Open |
| P04-R005 | Reorder concurrent làm corrupt order | Medium | High | Duplicate/gap/partial order | Exact-set + revision + transaction | Rebuild canonical order script | BE | Open |
| P04-R006 | Deadline race/history lệch | Medium | High | Lesson update không có history/audit | Dedicated revision + transaction | Reconcile from audit, block mutation | BE/QA | Open |
| P04-R007 | Completion duplicate khi double click/retry | Medium | High | Multiple progress records/timestamps | Unique natural key + idempotent upsert | Deduplicate migration, patch | BE | Open |
| P04-R008 | Scheduled publish phụ thuộc process timer | Medium | High | Cloud Run scale-to-zero bỏ transition | Read-time effective status | Add Scheduler reconciliation P07 | BE/DevOps | Open |
| P04-R009 | Dashboard aggregation chậm | Medium | High | p95 > 2s baseline | Index/batch/match early/perf test | Limit scope or ADR materialization P06 | BE | Open |
| P04-R010 | To-do sai sau deadline/content change | Medium | High | Derived state stale | On-demand source query + one asOf | Rebuild query/fix index | BE/QA | Open |
| P04-R011 | Cross-module model coupling | Medium | Medium | P04/P03 direct model imports | Reader ports + review | Refactor adapter before P05 | TL | Open |
| P04-R012 | GCS upload làm chặn Must | High | Medium | IAM/CORS/malware unresolved | Conditional gate, URL-first | Defer upload to P07 | PO/DevOps | Open |
| P04-R013 | Public bucket/signed URL leak | Low | Critical | Object accessible without auth | Private bucket/re-authorize/short TTL | Disable uploads, revoke access/rotate | Security/DevOps | Open |
| P04-R014 | Timezone làm Teacher đặt sai hạn | Medium | High | UI/server date lệch | UTC contract + timezone confirmation | Correct deadline with audited reason | FE/BE | Open |
| P04-R015 | Published edit làm Student thấy nội dung dở | Medium | High | Direct edit while published | Body lock, unpublish-to-edit | Roll back status/content | BE/FE | Open |
| P04-R016 | Archive vô tình xóa progress | Low | Critical | Cascade delete/hard delete code | Soft archive invariant/tests | Restore backup, disable archive route | BE/DBA | Open |
| P04-R017 | OpenAPI lệch route | Medium | Medium | Swagger sample fail/runtime missing | Route parity CI | Block merge until synchronized | BE/QA | Open |
| P04-R018 | Seed phụ thuộc wall clock/flaky CI | Medium | Medium | Deadline test pass/fail theo giờ | Fixed/injected seed base time | Regenerate deterministic fixtures | QA/DevOps | Open |
| P04-R019 | Branch required check đổi tên mất protection | Low | High | Ruleset không còn matching job | Plan workflow name migration | Restore check before merge | DevOps | Open |
| P04-R020 | Dữ liệu riêng tư xuất hiện trong logs/artifacts | Medium | Critical | Body/reason/token/signed URL captured | Field allowlist/redaction tests | Remove artifact, rotate/revoke, incident review | Security | Open |
| P04-R021 | WBS quá lớn cho solo schedule | High | Medium | Must critical path trễ | Vertical PR + defer Conditional | Rebaseline date, giữ Must quality | PO/TL | Open |
| P04-R022 | Frontend drag/drop không accessible | Medium | Medium | Keyboard user không reorder | Button/keyboard fallback | Disable drag-only UI | FE/QA | Open |
| P04-R023 | Long content/title phá mobile layout | Medium | Medium | Overflow/overlap screenshot | Stable constraints/wrap/visual QA | Patch CSS before exit | FE | Open |
| P04-R024 | Student denominator đổi gây hiểu nhầm progress | Medium | Medium | Publish/unpublish làm percentage đổi | metricVersion/asOf/counts/docs | Explain history; P06 snapshot policy | BA/BE | Open |

## 3. Current Issues

| ID | Issue | Impact | Owner | Resolution condition | Status |
| --- | --- | --- | --- | --- | --- |
| P04-I001 | Planning Gate A chưa review/merge | Chưa được bắt đầu implementation | PO/TL | Planning PR CI xanh và merge | Open |
| P04-I002 | Conditional Resource/GCS execution chưa quyết định | Không chặn Must; ảnh hưởng FR-032 Should | PO/DevOps | Decision tại T073 | Open |

Không có implementation defect vì code P04 chưa bắt đầu.

## 4. Risk Review Cadence

- Review khi mở/merge mỗi P04 PR.
- Review bắt buộc tại Gate B, C, D, E.
- Risk Critical trigger phải dừng affected release path và tạo issue ngay.
- High risk không có mitigation evidence không được đóng phase.
- Accepted risk cần owner, rationale, expiry/review date.

## 5. Escalation Rules

| Severity | Response |
| --- | --- |
| Critical security/data loss | Stop affected feature, preserve evidence, rotate/revoke nếu cần, fix trước tiếp tục |
| High correctness/authorization | Block merge/release, add regression test |
| Medium | Owner và target PR/phase rõ |
| Low | Track backlog; không giả là đã xử lý |

## 6. Contingency Priority

Khi capacity thiếu, defer theo thứ tự:

1. GCS upload.
2. External URL resources.
3. Autosave/recovery nâng cao.
4. Background scheduled reconciliation.
5. Content reuse.

Không defer object authorization, XSS protection, transaction/concurrency, OpenAPI parity, critical navigation, completion idempotency hoặc Must evidence.
