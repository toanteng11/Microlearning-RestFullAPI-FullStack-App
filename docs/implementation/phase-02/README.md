# Phase 02 - Authentication and Users

## Trạng thái

`Planned`. Kế hoạch chi tiết được baseline sau khi Phase 01 đạt exit criteria.

## Mục tiêu sơ bộ

Triển khai Student self-registration, login/logout/session, password lifecycle, RBAC, account status, Admin role-specific user lists và manual Teacher Invitation Link. Mọi actor phải đăng nhập trước khi dùng chức năng được bảo vệ; Student phải đăng nhập trước khi join Classroom.

## Capability chính

- Identity and Access module.
- Student registration và validation.
- Teacher invitation create/copy/revoke/accept; Admin tự gửi link qua kênh ngoài hệ thống.
- Student/Teacher/Admin lists tách riêng, có pagination/filter.
- API authorization và frontend protected routes.
- Security/audit tests cho role và object scope.

## Dependency

Phase 01; quyết định token storage; password policy; invitation expiry/one-time rule trong BA.
