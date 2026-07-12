# Bối Cảnh Nghiệp Vụ

## Mục Đích

Tài liệu này mô tả bối cảnh hình thành dự án **Microlearning Classroom LMS Platform**, lý do nghiệp vụ cần xây dựng hệ thống, nhóm người dùng chính, giá trị kỳ vọng và cách Google Classroom được dùng làm nguồn tham khảo chức năng.

## Executive Summary

**Microlearning Classroom LMS Platform** là hệ thống hỗ trợ giảng dạy nội bộ dành cho **Teacher** và **Student**. Hệ thống cho phép Teacher tạo **Classroom**, mời Student tham gia bằng **Class Code**, **Invite Link**, tổ chức nội dung học theo microlearning, giao bài, nhận bài nộp, chấm điểm, phản hồi và theo dõi tiến độ học.

Dự án tham khảo nghiệp vụ từ Google Classroom ở các workflow cốt lõi như Classroom, Stream, Classwork, Assignment, Material, Submission, Grade và Feedback. Tuy nhiên, sản phẩm không phải bản sao Google Classroom. Hệ thống được định hướng riêng theo mô hình microlearning, có RESTful API, Swagger/OpenAPI, Docker, CI/CD và khả năng triển khai Cloud.

## Bối Cảnh Hiện Tại

Trong nhiều lớp học, trung tâm đào tạo hoặc môi trường đào tạo nội bộ, hoạt động giảng dạy thường gặp các vấn đề sau:

- Tài liệu học tập phân tán ở nhiều kênh như chat, email, file drive hoặc tài liệu offline.
- Teacher khó kiểm soát Student nào đã tham gia lớp, đã xem bài, đã làm quiz hoặc đã nộp bài.
- Student khó theo dõi bài nào cần học, bài nào cần nộp và deadline nào sắp đến.
- Việc giao bài, nhận bài, chấm điểm và phản hồi thường chưa được tập trung trong một hệ thống rõ ràng.
- Nội dung học dài làm Student khó duy trì sự tập trung và khó hoàn thành đều đặn.
- Admin thiếu dashboard để quản lý users, roles, classrooms, reports và trạng thái vận hành.

Vì vậy, cần một hệ thống Classroom LMS nội bộ, gọn hơn enterprise LMS truyền thống nhưng đủ chức năng cốt lõi để hỗ trợ dạy, học, giao bài, theo dõi và đánh giá.

## Đối Tượng Chính

| Đối tượng | Vai trò trong hệ thống | Nhu cầu chính |
| --- | --- | --- |
| Teacher | Người tạo và quản lý Classroom | Tạo lớp, mời Student, đăng thông báo, tạo Classwork, giao bài, chấm điểm, theo dõi tiến độ |
| Student | Người tham gia Classroom và học nội dung được giao | Join Classroom, xem bài học, làm quiz, nộp assignment, xem feedback và progress |
| Admin | Người vận hành hệ thống | Quản lý users, roles, classrooms, reports, monitoring và cấu hình hệ thống |

## Định Hướng Tham Khảo Google Classroom

Google Classroom được dùng làm nguồn tham khảo về nghiệp vụ và chức năng. Các điểm tham khảo chính gồm:

- Classroom là không gian lớp học trung tâm.
- Stream là nơi hiển thị thông báo và hoạt động lớp học.
- Classwork là nơi Teacher đăng assignments, questions, quiz assignments và materials.
- Student có thể theo dõi classwork, grades và các hoạt động liên quan đến lớp.
- Teacher có thể tạo và quản lý classes, assignments, grades và feedback.

Các nguồn tham khảo chính thức:

- Google for Education Classroom: https://edu.google.com/intl/ALL_us/workspace-for-education/products/classroom/
- About Classroom - Google Help: https://support.google.com/edu/classroom/answer/6020279
- Get started with Classroom for students - Google Help: https://support.google.com/edu/classroom/answer/9582544

## Định Hướng Sản Phẩm Của Dự Án

Dự án không sao chép Google Classroom mà chọn lọc các nghiệp vụ phù hợp để xây dựng một hệ thống riêng:

- Tập trung vào Teacher và Student trong môi trường nội bộ.
- Tối ưu nội dung học theo microlearning: ngắn, rõ, dễ hoàn thành.
- Hỗ trợ Classroom private, chỉ tham gia bằng Class Code hoặc Invite Link hợp lệ.
- Hỗ trợ Class Stream để Teacher đăng thông báo và Student theo dõi hoạt động lớp.
- Hỗ trợ Classwork để tổ chức Micro Lesson, Quiz, Assignment và Material.
- Hỗ trợ Submission, Grade và Feedback để hoàn thiện vòng đời giao bài - nộp bài - đánh giá.
- Hỗ trợ dashboard và reports để Teacher/Admin theo dõi hiệu quả học tập.
- Xây dựng backend theo RESTful API, có Swagger/OpenAPI để dễ tích hợp và kiểm thử.
- Containerize bằng Docker và triển khai thông qua CI/CD lên Cloud.

## Giá Trị Kỳ Vọng

| Nhóm giá trị | Mô tả |
| --- | --- |
| Giá trị cho Teacher | Giảm thời gian tổ chức lớp, giao bài, theo dõi bài nộp và đánh giá kết quả học tập |
| Giá trị cho Student | Có một nơi rõ ràng để tham gia lớp, học bài, làm quiz, nộp bài và xem feedback |
| Giá trị cho Admin | Quản lý tập trung users, roles, classrooms và reports |
| Giá trị kỹ thuật | Có kiến trúc rõ ràng, API có tài liệu, dễ deploy, dễ mở rộng và dễ vận hành |

## Giả Định Bối Cảnh

- Hệ thống phục vụ chủ yếu cho lớp học nội bộ, trung tâm đào tạo hoặc môi trường giáo dục/đào tạo quy mô vừa.
- Teacher là người chịu trách nhiệm chính trong việc tạo và vận hành Classroom.
- Student chỉ truy cập nội dung của Classroom đã tham gia.
- MVP ưu tiên web application trước, chưa bao gồm native mobile app.
- Google Classroom chỉ dùng làm reference nghiệp vụ; sản phẩm có tên, trải nghiệm và thiết kế riêng.
