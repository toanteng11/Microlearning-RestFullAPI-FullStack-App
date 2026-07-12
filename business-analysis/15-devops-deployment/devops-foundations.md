# DevOps Foundations

## Mục Đích

Tài liệu này giải thích các khái niệm DevOps bằng chính ngữ cảnh của Microlearning Classroom LMS Platform. Nó giúp người mới học DevOps hiểu **vì sao** mỗi công cụ/quy trình tồn tại, trước khi đi vào command hoặc provider cụ thể.

## Các Khái Niệm Cốt Lõi

| Khái niệm | Giải thích đơn giản | Áp dụng trong dự án |
| --- | --- | --- |
| Source code repository | Nơi lưu code, document, lịch sử thay đổi và review | ReactJS/Node.js code và BA/infra code được version control. |
| Build | Biến source code thành output có thể chạy | React build tạo static files; Node.js build/prepare runtime; Docker build tạo image. |
| Artifact | Kết quả build đã đóng gói/versioned | Frontend static bundle và Backend Docker image mang version/commit. |
| Docker image | “Bản đóng gói” immutable gồm app + runtime dependency cần chạy | `frontend:<tag>`, `backend:<tag>` được build một lần rồi promote. |
| Container | Một instance chạy từ Docker image | API container chạy Node.js service; container có thể restart/scale. |
| Docker Compose | File mô tả nhiều container chạy cùng nhau, chủ yếu Local | Chạy frontend, backend, MongoDB local bằng một cấu hình chung. |
| CI | Tự động kiểm tra code mỗi khi push/merge | Lint, test, build, scan; fail sớm nếu code có lỗi. |
| CD | Tự động hoặc có kiểm soát đưa artifact đã pass lên environment | Deploy image lên Staging, chạy smoke; Production cần approval policy. |
| Image registry | Kho lưu Docker image | CI push image versioned; runtime pull đúng tag/digest để deploy. |
| Environment | Bối cảnh chạy riêng với data/config/access riêng | Local, CI/Test, Staging, Production. |
| Secret | Giá trị không được lộ ra source/UI/log | MongoDB URI, JWT secret, storage credential, deploy token. |
| Infrastructure as Code (IaC) | Khai báo hạ tầng bằng file versioned/review được | Network, runtime/service, storage policy, monitoring/secret reference khi team chốt dùng IaC. |
| Monitoring | Theo dõi số đo hệ thống theo thời gian | Uptime, health, latency, 5xx, MongoDB/CPU/memory, backup status. |
| Alert | Thông báo khi metric/health vượt ngưỡng | API down, 5xx tăng, database down, backup fail. |
| Rollback | Quay application artifact về bản ổn định trước | Không đồng nghĩa “quay ngược database” một cách tùy tiện. |
| Restore | Khôi phục dữ liệu từ backup | Chỉ theo runbook, xác nhận environment, test sau restore. |

## Ví Dụ Một Thay Đổi Đi Qua DevOps

Ví dụ: Backend bổ sung API reset Lesson Deadline.

```text
1. Developer code + cập nhật Swagger/test.
2. Developer chạy Local quality gate và Docker Compose.
3. Pull request được review/merge.
4. CI chạy lint, test, build, dependency/image scan.
5. CI tạo backend image: backend:1.0.0-<commit> và push registry.
6. CD deploy đúng image đó lên Staging với Staging secret/config.
7. Health, version, API smoke test deadline reset và audit log chạy.
8. QA/UAT xác nhận Student To-do/Calendar được cập nhật đúng.
9. Release được approve, cùng artifact được promote/deploy Production.
10. Monitoring theo dõi 5xx/latency/log; có rollback plan nếu phát hiện lỗi.
```

Điểm quan trọng: **Code không tự trở thành Production chỉ vì chạy được trên máy Developer**. Nó cần qua build, test, config, security, deploy và quan sát sau deploy.

## Phân Biệt Các Khái Niệm Dễ Nhầm

| Dễ nhầm | Phân biệt đúng |
| --- | --- |
| Docker và Cloud | Docker là cách đóng gói/chạy ứng dụng; Cloud là nơi có thể chạy container/static hosting/database. Có thể dùng Docker Local mà chưa deploy Cloud. |
| CI và CD | CI kiểm tra/tạo artifact; CD dùng artifact đã pass để deploy. CI pass không tự chứng minh Staging/Production config đúng. |
| Deploy và Release | Deploy là đưa version lên runtime; Release là cho phép người dùng sử dụng version đó, thường có approval/communication/monitoring. |
| Rollback và Restore | Rollback quay application version; Restore khôi phục data backup. Rollback code không luôn xử lý được data migration sai. |
| Config và Secret | Config có thể công khai như API base URL; secret phải được bảo vệ như DB URI/JWT key. Frontend public env không phải nơi để secret. |
| Log và AuditLog | Log kỹ thuật dùng debug/vận hành; AuditLog ghi action nghiệp vụ quan trọng như reset deadline/grade/invitation. |
| Health check và Monitoring | Health check trả tình trạng tại thời điểm gọi; monitoring thu thập xu hướng/alert qua thời gian. |

## Nguyên Tắc Học Và Thực Hành

1. Bắt đầu Local: chạy ReactJS, Node.js API, MongoDB bằng Docker Compose; hiểu port, volume, network và env file mẫu.
2. Học build artifact: build image, đặt tag bằng version/commit, chạy lại image trên máy khác hoặc clean environment.
3. Học CI: tự động lint/test/build/scan trên pull request; đọc log khi pipeline fail.
4. Học Staging: deploy artifact đã pass, cấu hình secret/environment, kiểm tra health/API/UI smoke test.
5. Học vận hành: xem structured log, requestId, latency/5xx, trigger cảnh báo giả lập.
6. Học recovery: rehearsal rollback app và restore backup vào isolated Staging/test environment.

Không cần nhảy ngay vào Kubernetes hoặc nhiều Cloud service. Nền tảng tốt nhất cho đồ án này là Docker + CI/CD + managed Cloud + quan sát/rollback có bằng chứng.

## Checklist Hiểu Đúng DevOps

- Tôi biết source commit nào tạo ra image/artifact đang chạy.
- Tôi phân biệt được secret với public frontend configuration.
- Tôi biết vì sao Staging không dùng Production data/credential.
- Tôi biết `/health`, version endpoint, smoke test và monitoring dùng ở thời điểm nào.
- Tôi biết rollback application khác restore MongoDB backup.
- Tôi biết deploy lỗi cần dừng rollout, kiểm tra impact, rollback/forward-fix, ghi incident và phòng ngừa tái diễn.
