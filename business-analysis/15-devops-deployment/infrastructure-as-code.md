# Infrastructure As Code

## Mục Đích

Infrastructure as Code (IaC) là cách mô tả hạ tầng bằng file code/config có version control, review và có thể áp dụng lặp lại, thay vì chỉ tạo bằng click thủ công trên Cloud console. IaC không bắt buộc phải dùng ngay trong đồ án MVP, nhưng là hướng chuyên nghiệp khi Staging/Production có nhiều resource hoặc cần học DevOps sâu hơn.

## Giá Trị Của IaC

| Vấn đề thao tác thủ công | IaC giúp gì |
| --- | --- |
| Không biết ai đã đổi firewall/runtime/secret policy | Có source history, review và audit deployment. |
| Staging khác Production vì click thiếu bước | Dùng module/template, biến environment và plan review. |
| Khó tái tạo hạ tầng khi hỏng hoặc đổi provider/account | Có blueprint cho resource/network/policy. |
| Thay đổi hạ tầng rủi ro không review | Pull request/plan/approval trước apply. |

IaC không chứa secret value. IaC chỉ tham chiếu secret ID/secret store/runtime identity hoặc nhận input an toàn từ protected CI environment.

## Scope IaC Gợi Ý

| Resource | Nên đưa IaC? | Ghi chú |
| --- | --- | --- |
| Cloud Run application service/DNS routing | Should, tiến tới Must cho Production | `microlearning-app` digest, config, scale, health path và custom domain mapping phải trace được. |
| Artifact Registry/IAM/Workload Identity | Should | Repository, deploy/runtime identity và least-privilege binding; không đưa credential value vào state. |
| Network/security group/firewall | Must | Ngăn public database/management port sai. |
| Storage bucket/policy/lifecycle | Should | Private-by-default, prefix/lifecycle/versioning. |
| Monitoring alert/dashboard | Should | Có thể versioned qua provider integration nếu hỗ trợ. |
| MongoDB Atlas | Should | Có thể quản lý project/cluster/network/backup policy khi tier/tool hỗ trợ; không hard-code database credential. |
| Secret values | No | Chỉ tạo/reference policy, không commit value. |
| Backup data | No | Backup là artifact vận hành, không phải IaC state. |

## Repository Structure Gợi Ý

```text
infrastructure/
  README.md                         # provider, bootstrap, ownership, apply safety
  modules/                          # reusable network/runtime/storage/monitoring modules
  environments/
    staging/                        # Staging variables/references, no real secret
    production/                     # Production variables/references, protected apply
  policies/                         # optional policy/security rules
  scripts/                          # non-secret validation/helper script
```

Tên tool có thể là Terraform, Pulumi, CloudFormation/Bicep hoặc provider-native configuration. Team chọn một tool phù hợp kỹ năng/provider, không cần dùng nhiều tool cho cùng resource.

## IaC Workflow

```text
Change proposal
  -> edit IaC source + documentation
  -> pull request review (security/cost/impact)
  -> lint/validate/plan in CI
  -> review plan output
  -> protected apply to Staging
  -> verify health/cost/security
  -> approved protected apply to Production
  -> record state/version/change
```

| Step | Requirement |
| --- | --- |
| Validate | Syntax, provider/module version, policy/lint check. |
| Plan | Show create/change/delete impact; plan file/log must not leak secret. |
| Review | DevOps + Technical Lead review network, public exposure, data loss/cost impact. |
| Apply | Protected environment/CI identity; no apply from ad-hoc personal machine for Production. |
| State | Remote encrypted/locked state if tool requires state; access restricted and backup/recovery considered. |
| Verify | Check DNS/TLS, health, monitoring, resource tag/cost and least privilege after apply. |

## Safe Change Rules

- Destructive action (delete/recreate database, bucket, domain, production runtime) cần explicit change review, backup/rollback/forward plan.
- `plan` có resource destroy/replace phải được xem là high-risk, không auto apply chỉ vì CI pass.
- Provider account/project/region và resource naming phải biến environment riêng, không copy/paste Production ID sang Staging.
- IaC provider/plugin/module version phải pin/lock để plan/apply reproducible.
- Remote state, plan artifact và CI log có thể nhạy cảm; không public/commit file state chứa output secret.
- Manual emergency change phải được ghi lại và reconciled về IaC sau incident, tránh drift kéo dài.

## IaC Adoption Path Cho Đồ Án

1. Giai đoạn 1: Document architecture, environment matrix, Cloud resource checklist; triển khai Staging manual có record.
2. Giai đoạn 2: IaC tạo network/runtime/storage/monitoring Staging, còn database/service vendor setup được document rõ.
3. Giai đoạn 3: Tách `staging`/`production`, protected CI plan/apply, remote state và policy check.
4. Giai đoạn 4: Drift detection/cost tag/automated policy nếu dự án tiếp tục sau đồ án.

## Acceptance Checklist

- Có owner/tool/provider/version, repository path và protected apply policy.
- IaC validate/plan chạy trong CI trước apply; plan destructive phải được review.
- Không có secret value, database dump hoặc state nhạy cảm commit repository.
- Staging/Production resource naming, account/project, region, state và access tách biệt.
- Thay đổi hạ tầng có link tới change/release record và được verify sau apply.
