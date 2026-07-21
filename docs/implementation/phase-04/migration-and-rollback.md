# Phase 04 Migration And Rollback

## 1. Mục Đích

Tài liệu này quy định cách đưa Data Foundation Phase 04 vào từng môi trường mà không làm gián đoạn Phase 02-03 và không xóa nhầm dữ liệu Learning Content. Phase 04 chỉ thêm collection/index mới; không sửa hình dạng document Classroom, Enrollment hoặc User hiện hữu.

## 2. Phạm Vi Thay Đổi

| Collection | Thay đổi | Rollback data |
| --- | --- | --- |
| `courses` | Tạo mới cùng hai query index | Không tự động drop |
| `course_modules` | Tạo mới cùng structure index | Không tự động drop |
| `lessons` | Tạo mới cùng ba structure/deadline index | Không tự động drop |
| `flashcards` | Tạo mới cùng Lesson order index | Không tự động drop |
| `lesson_deadline_changes` | Tạo mới cùng unique revision/history index | Không sửa/xóa history |
| `announcements` | Tạo mới cùng Stream index | Không tự động drop |
| `learning_progress` | Tạo mới cùng natural-key/dashboard indexes | Không sửa/xóa progress |

Không tạo `learning_resources`, `course_progress_summaries` hoặc `student_todo_items` trong Must data foundation này.

## 3. Startup Contract

- `development` và `test`: application được phép tạo index còn thiếu bằng manifest trong Mongoose schema.
- `staging` và `production`: application chỉ kiểm tra compatibility; không tự tạo hoặc sửa index.
- Sai tên, key order, `unique`, partial filter hoặc TTL làm startup fail-fast với message không chứa connection string.
- Phase 03 index verification tiếp tục chạy trước Phase 04 để bảo vệ backward compatibility.

## 4. Trình Tự Triển Khai

1. Chạy `npm run check:ci` và Mongo integration tests trên commit dự kiến phát hành.
2. Tạo toàn bộ Phase 04 indexes ở staging bằng deployment/migration identity đã được cấp quyền.
3. Chạy `initializePhaseFourIndexes('production')` ở chế độ verification trên staging.
4. Deploy code chưa expose public Phase 04 routes.
5. Kiểm tra readiness, startup logs và collection/index manifest.
6. Chạy deterministic seed chỉ ở môi trường demo/test khi task seed được hoàn thành.
7. Chỉ mở route sau khi service, authorization, OpenAPI và API tests tương ứng đã pass.

## 5. Rollback Ứng Dụng

Nếu release data foundation gây lỗi trước khi route được mở:

1. Dừng rollout revision mới và chuyển traffic về revision ứng dụng trước đó.
2. Giữ nguyên bảy collection và indexes; revision cũ không tham chiếu chúng nên không bị ảnh hưởng.
3. Không dùng rollback script để drop collection/index.
4. Thu thập startup error, index diff và commit SHA; sửa manifest/code bằng forward-fix.
5. Chạy lại verification trên staging trước khi redeploy.

## 6. Rollback Index

Chỉ xóa hoặc thay index khi có change record riêng, backup/restore point và reviewer phê duyệt. Với index sai:

1. Chặn writer Phase 04 nếu route đã được mở.
2. Ghi lại `getIndexes()` hiện tại và expected manifest.
3. Tạo replacement index trước nếu MongoDB và quota cho phép.
4. Xác nhận query plan dùng replacement.
5. Chỉ drop index sai sau khi impact review hoàn tất.

Unique index `deadline_history_revision_unique` và `progress_activity_unique` không được bỏ tạm để “chữa” duplicate write; phải tìm và sửa nguồn ghi trước.

## 7. Data Recovery

- `lesson_deadline_changes` là append-only; không backfill bằng update document cũ.
- `learning_progress` là source-of-truth; không rebuild bằng cách xóa collection.
- Archive/unpublish không xóa child, deadline history hoặc progress.
- Nếu seed dở dang, seed phải retry bằng semantic key/idempotent upsert; không chạy cleanup không kiểm soát.
- Backup/restore managed MongoDB Atlas thuộc Phase 07, nhưng mọi production migration phải tương thích với chính sách backup đó.

## 8. Verification Commands

```powershell
$env:MONGODB_INTEGRATION_URI='mongodb://127.0.0.1:27018/microlearning-phase4-integration?replicaSet=rs0&directConnection=true'
npm run test:integration --workspace @microlearning/api
npm run check:ci
```

Không ghi MongoDB URI có credential vào log/evidence. Evidence chỉ lưu command đã redact, kết quả, commit SHA, CI URL và thời gian chạy.

## 9. Exit Criteria

- Bảy collection Must có đúng 13 named indexes.
- Hai unique indexes từ chối duplicate bằng MongoDB thật.
- Production compatibility verification fail khi thiếu/sai index và pass khi manifest đúng.
- Repository trả lean projection; deadline repository không có update/delete API.
- Rollback rehearsal xác nhận revision cũ vẫn chạy khi collection Phase 04 còn tồn tại.
