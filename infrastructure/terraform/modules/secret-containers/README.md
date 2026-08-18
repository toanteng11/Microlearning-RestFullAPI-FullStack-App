# Secret Containers Module

Module tạo Secret Manager containers và `roles/secretmanager.secretAccessor` theo từng secret/identity.
Module cố ý không nhận `secret_value`, không tạo `google_secret_manager_secret_version` và không output
payload. `provision=false` giữ contract Production mà không tạo tài nguyên trước approval Phase 08.
