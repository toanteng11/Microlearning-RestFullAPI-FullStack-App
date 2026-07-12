# Definition of Done

## 1. Mục đích

Definition of Done quy định bằng chứng tối thiểu để một task, feature, phase hoặc release được công nhận hoàn thành. Việc code chạy trên máy người phát triển chưa đủ để được xem là `Done`.

## 2. Task Done

Một task đạt `Done` khi:

- Acceptance criteria của task đã đạt.
- Code tuân coding standards và đã được review/approve.
- Lint, type check, test và build liên quan đã pass.
- Test mới hoặc regression test đã được bổ sung phù hợp với rủi ro.
- Swagger/OpenAPI, schema, config example hoặc tài liệu được cập nhật nếu bị ảnh hưởng.
- Không chứa secret, debug code, blocker hoặc lỗi Critical/High chưa có quyết định.
- Task có liên kết commit/PR và test evidence.

## 3. Feature Done

Ngoài điều kiện Task Done, một feature phải:

- Hoàn thành cả happy path và error/permission path.
- Tích hợp Web, API và data layer theo phạm vi feature.
- Có loading, empty, error, success và retry behavior phù hợp trên UI.
- Có authorization phía API và kiểm tra object-level access nếu cần.
- Có audit/log/metric cho hành động nhạy cảm theo BA/NFR.
- Pass acceptance criteria và demo được bằng dữ liệu kiểm thử.
- Không làm sai chức năng đã hoàn thành trước đó.

## 4. Phase Done

Một phase chỉ `Completed` khi:

- Tất cả Must task đạt `Done`; task chuyển phase sau có lý do, owner và impact được chấp thuận.
- Phase exit criteria đạt đầy đủ.
- Increment chạy được trong môi trường mục tiêu của phase.
- Test report, issue list, risk và technical debt được cập nhật.
- Traceability từ requirement tới implementation/test evidence được cập nhật.
- Technical Lead, QA và Product Owner/BA xác nhận theo phạm vi trách nhiệm.

## 5. Release Done

Release phải đáp ứng Definition of Done của Phase 08 và các điều kiện trong BA: release scope được xác nhận, UAT pass, không có blocker bảo mật/data integrity, artifact bất biến đã triển khai, smoke test pass, monitoring hoạt động, backup/rollback đã sẵn sàng và release record đầy đủ.

## 6. Trường hợp không được đánh dấu Done

- Chỉ mới code nhưng chưa review hoặc test.
- API chạy nhưng Swagger không đúng contract.
- UI hiển thị được nhưng gọi mock data thay vì API trong phạm vi cần tích hợp.
- Chỉ kiểm tra bằng tài khoản Admin và chưa test quyền Student/Teacher.
- CI đang đỏ hoặc build chỉ chạy được bằng thao tác undocumented.
- Lỗi được giấu bằng cách bỏ test, tắt validation hoặc hard-code config.
