# Cost Budget And Quota

## 1. Mục tiêu

Giữ Staging phù hợp ngân sách học tập nhưng không gọi bất kỳ dịch vụ nào là “miễn phí tuyệt đối”. Pricing,
free tier và quota phải được kiểm tra lại khi provision.

## 2. Cost drivers

- Cloud Run CPU/memory/request duration/egress;
- Artifact Registry storage/egress;
- Cloud Logging/Monitoring ingestion/retention/checks;
- Secret Manager access/storage;
- GCS Terraform state và short-lived synthetic backup artifacts;
- static egress/NAT nếu chọn;
- MongoDB Atlas tier/storage/network/backup;
- GitHub Actions minutes/artifacts.

## 3. Staging guardrails

| Resource | Baseline |
| --- | --- |
| Cloud Run min instances | `0` |
| Cloud Run max instances | `2` |
| CPU/memory | `1 vCPU / 512 MiB` |
| Concurrency | `20` |
| Log level | `info`, không debug dài hạn |
| Artifact retention | giữ active/prior/RC; cleanup có kiểm soát |
| Backup retention | synthetic logical dump lifecycle `14` ngày baseline |
| Atlas | Free synthetic Staging trong Phase 07 |
| Uptime frequency | đủ phát hiện lỗi nhưng trong budget |

## 4. Budget alerts

Nếu quyền billing cho phép, cấu hình ít nhất các ngưỡng 50%, 80%, 100% theo monthly budget đã duyệt. Alert
phải có email owner và runbook giảm cost.

Budget alert không phải hard cap. Owner vẫn phải theo dõi usage/quota.

## 5. Cost response actions

1. xác định resource/metric tăng;
2. kiểm tra traffic loop, log volume, max instances, artifact retention;
3. giảm non-critical Staging activity;
4. không tắt security/backup/monitoring critical chỉ để giảm cost;
5. ghi thay đổi Terraform;
6. verify service và budget sau mitigation.

## 6. Quota review

Trước first deploy kiểm tra:

- Cloud Run service/revision/instance quota;
- Artifact Registry storage/API quota;
- Secret Manager request quota;
- Monitoring checks/alerts;
- Atlas connections/storage;
- GitHub Actions retention/minutes.

Nếu quota gần giới hạn, giảm scope/tune hoặc xin tăng; không phát hiện lần đầu giữa release.

## 7. Production decision

Phase 08 phải ước lượng Production dựa trên expected users/request/data, không nhân tuyến tính mù từ Staging.
Paid Atlas backup/network và minimum availability có thể là cost bắt buộc.

## 8. Evidence

- budget name/amount đã che nếu cần;
- alert thresholds/owner;
- resource baseline và quota snapshot;
- measured Staging cost sau observation period;
- cost deviations và decisions;
- cleanup/retention verification.
