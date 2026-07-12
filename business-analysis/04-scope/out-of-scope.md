# Out Of Scope

## Mục Đích

Tài liệu này xác định các hạng mục **không nằm trong phạm vi MVP hoặc phạm vi hiện tại** của dự án **Microlearning Classroom LMS Platform**.

Out of Scope giúp kiểm soát kỳ vọng của stakeholder, giảm scope creep, bảo vệ timeline và giúp đội dự án tập trung vào workflow cốt lõi: Classroom, Classwork, Learning, Submission, Grading, Progress và Admin Governance.

## Nguyên Tắc Xác Định Out Of Scope

| Nguyên tắc | Diễn giải |
| --- | --- |
| Không phục vụ trực tiếp MVP workflow | Feature không hỗ trợ vòng đời học tập chính sẽ được đưa ra ngoài MVP |
| Phụ thuộc hệ thống bên ngoài phức tạp | Tính năng cần SIS, Google Workspace, payment, marketplace hoặc AI provider nên để Post-MVP |
| Tăng độ phức tạp kỹ thuật quá lớn | Feature làm tăng effort data/API/security/deployment vượt MVP |
| Không phù hợp đối tượng chính | MVP tập trung vào Student, Teacher, Admin; các role khác chỉ là tương lai |
| Có thể bổ sung sau mà không phá vỡ core architecture | Feature có giá trị nhưng chưa cần để chứng minh sản phẩm |

## Out Of Scope Cho MVP

| ID | Hạng mục ngoài phạm vi | Lý do | Có thể xem xét lại khi nào |
| --- | --- | --- | --- |
| OOS-001 | Native mobile application | MVP ưu tiên web application responsive bằng ReactJS | Sau khi web workflow ổn định |
| OOS-002 | Offline learning mode | Cần sync, cache, conflict handling phức tạp | Release mobile/PWA tương lai |
| OOS-003 | Payment gateway | Sản phẩm là LMS nội bộ, không phải marketplace bán khóa học | Khi chuyển hướng commercial |
| OOS-004 | Course marketplace | Không phù hợp MVP nội bộ | Khi có multi-tenant/commercial model |
| OOS-005 | Live video classroom tích hợp sâu | Cần meeting provider, realtime, permission phức tạp | Post-MVP, có thể bắt đầu bằng meeting URL |
| OOS-006 | Full Google Workspace integration | Dự án chỉ tham khảo workflow, không phụ thuộc Google services | Khi có nhu cầu tích hợp thật |
| OOS-007 | Gmail API / email provider bắt buộc cho Teacher invitation | Teacher invitation dùng manual copy link | Nếu muốn tự động hóa notification Post-MVP |
| OOS-008 | SIS integration | Cần hệ thống quản lý đào tạo bên ngoài và mapping dữ liệu | Release enterprise/institution |
| OOS-009 | Guardian management | Đối tượng chính là Teacher và Student | Nếu mở rộng sang môi trường phổ thông |
| OOS-010 | AI recommendation | Cần dữ liệu học tập đủ lớn và AI model/provider | Sau khi có learning analytics ổn định |
| OOS-011 | AI grading | Rủi ro chính xác, fairness và explainability | Sau khi có grading workflow ổn định |
| OOS-012 | Plagiarism/originality report đầy đủ | Cần provider hoặc engine kiểm tra đạo văn | Post-MVP hoặc integration release |
| OOS-013 | Co-teacher management đầy đủ | Tăng độ phức tạp RBAC và ownership | Release sau Teacher core workflow |
| OOS-014 | Advanced Gradebook weighted categories | Cần nhiều rule thang điểm và category weighting | Sau Gradebook basic |
| OOS-015 | Certificate engine đầy đủ | Không cần cho workflow học/chấm/progress MVP | Khi cần chứng nhận hoàn thành |
| OOS-016 | Multi-tenant billing | Không phù hợp sản phẩm nội bộ | Khi phát triển SaaS thương mại |
| OOS-017 | Organization hierarchy phức tạp | Khoa/trường/department nhiều cấp làm tăng scope | Có thể làm basic department trước |
| OOS-018 | Advanced BI dashboard | Cần data warehouse/analytics pipeline | Sau khi có usage data |
| OOS-019 | Real-time chat | Không phải core workflow; tăng realtime complexity | Khi cần collaboration nâng cao |
| OOS-020 | Push notification mobile | Không có native mobile app trong MVP | Khi có mobile/PWA |
| OOS-021 | Full text search nâng cao | Có thể dùng search/filter cơ bản | Khi dữ liệu lớn |
| OOS-022 | Public course landing pages | Sản phẩm tập trung Classroom private | Nếu mở public learning |
| OOS-023 | Social login | Auth nội bộ đủ cho MVP | Khi cần giảm friction login |
| OOS-024 | SSO/SAML/OAuth enterprise | Phức tạp enterprise integration | Khi triển khai tổ chức lớn |
| OOS-025 | Advanced backup/DR automation | MVP chỉ cần deployment và rollback cơ bản | Khi production thực tế |
| OOS-026 | QR Code Join | Tăng thêm UI route, QR library, token/data/API/test nhưng không cần thiết khi đã có Class Code và Invite Link | Chỉ xem xét lại qua Change Control sau khi core workflow ổn định |

## Out Of Scope Theo Role

### Student

| Hạng mục | Lý do |
| --- | --- |
| Student tự tạo Classroom | Student là người học, không phải người tổ chức lớp |
| Student marketplace purchase | Không có payment/marketplace trong MVP |
| Student offline download full course | Không có offline mode |
| Student chat realtime với Teacher | Có thể dùng comment/feedback cơ bản trước |
| Student certificate self-generation | Certificate engine chưa nằm trong MVP |

### Teacher

| Hạng mục | Lý do |
| --- | --- |
| Co-teacher permission nâng cao | Để Post-MVP do tăng complexity |
| AI tạo bài học tự động | Không thuộc MVP |
| AI chấm tự luận | Rủi ro cao, cần provider và validation |
| Originality report đầy đủ | Không tự xây plagiarism engine trong MVP |
| Import toàn bộ lớp từ Google Classroom | Dự án không tích hợp Google Workspace thật |
| Live class management tích hợp video | Chỉ có thể hỗ trợ meeting URL thủ công nếu cần |

### Admin

| Hạng mục | Lý do |
| --- | --- |
| Google Admin Console integration | Không phụ thuộc Google Workspace |
| SIS sync | Cần hệ thống ngoài |
| Guardian policy | Không phù hợp đối tượng chính |
| Advanced security alerting | Cần logging/monitoring nâng cao |
| Temporary class access workflow đầy đủ | Cần policy và audit phức tạp |
| Multi-organization billing | Không có SaaS billing |
| Bắt buộc cấu hình email provider cho Teacher invitation | Teacher invitation dùng manual copy link |

## Out Of Scope Theo Kỹ Thuật

| Technical Area | Out Of Scope | Ghi chú |
| --- | --- | --- |
| Frontend | Native iOS/Android | Chỉ web ReactJS |
| Backend | GraphQL API | Dùng RESTful API |
| Database | SQL migration sang PostgreSQL/MySQL | MongoDB là database chính |
| Realtime | WebSocket realtime chat | Không cần trong MVP |
| AI/ML | Recommendation, auto grading, plagiarism engine | Post-MVP |
| Integration | Full Google Workspace, SIS, payment | Post-MVP |
| DevOps | Multi-region deployment, Kubernetes bắt buộc | Docker/CI-CD/Cloud cơ bản là đủ |
| Analytics | Data warehouse/BI stack | Basic reports trước |
| Email | Auto-send Teacher invitation email | Không bắt buộc vì dùng manual copy link |

## Deferred Features

Các tính năng sau **có giá trị** nhưng được hoãn:

| Feature | Loại | Lý do hoãn |
| --- | --- | --- |
| Gradebook nâng cao | Should/Post-MVP | Cần grading rules rõ hơn |
| Content reuse/template | Should/Post-MVP | Hữu ích nhưng không bắt buộc MVP |
| Organization analytics | Should/Post-MVP | Cần nhiều dữ liệu vận hành |
| Cloud storage integration đầy đủ | Should/Post-MVP | Có thể làm upload/link cơ bản trước |
| Email notification automation | Should/Post-MVP | Không cần cho Teacher invitation MVP |
| Meeting provider integration | Could/Post-MVP | Có thể dùng meeting_url thủ công |
| PWA/mobile optimization sâu | Could/Post-MVP | Web responsive trước |

## Explicit Non-goals

Trong MVP, dự án **không đặt mục tiêu**:

- Thay thế hoàn toàn Google Classroom.
- Sao chép giao diện, thương hiệu hoặc trải nghiệm độc quyền của Google Classroom.
- Xây dựng enterprise LMS đầy đủ như Moodle/Canvas.
- Xây dựng nền tảng thương mại bán khóa học.
- Xây dựng hệ thống quản lý đào tạo toàn trường với SIS đầy đủ.
- Xây dựng app mobile native.
- Tự động gửi email invitation cho Teacher như requirement bắt buộc.
- Tự động chấm bài tự luận bằng AI.

## Out-of-scope Reconsideration Criteria

Một hạng mục ngoài phạm vi chỉ được xem xét đưa vào scope nếu:

1. Product Owner xác nhận giá trị nghiệp vụ đủ cao.
2. Technical Lead xác nhận feasibility và impact.
3. QA Lead xác nhận có thể kiểm thử.
4. DevOps xác nhận không phá vỡ deployment plan.
5. BA cập nhật change request, scope baseline, requirements và traceability.
6. Nếu ảnh hưởng MVP timeline, phải được Product Owner phê duyệt rõ.

## Kết Luận

Out of Scope của dự án giúp bảo vệ trọng tâm MVP. Đội dự án cần tránh kéo các tính năng nâng cao như AI, SIS, Google Workspace integration, marketplace, mobile native hoặc email automation bắt buộc vào giai đoạn đầu.

MVP nên tập trung làm thật chắc:

```text
Teacher invitation manual link -> Classroom -> Join -> Classwork -> Learning -> Submission -> Grading -> Progress -> Admin Governance
```
