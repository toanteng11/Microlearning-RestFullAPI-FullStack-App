# Atlas Staging Verification Runbook

## Phạm vi

Atlas Free `Cluster0` chỉ dùng dữ liệu synthetic cho Staging. Database canonical là
`microlearning_staging`; application user canonical là `ml-staging-app` và chỉ có `readWrite` trên database
này. Không lưu hoặc dán URI/password vào tài liệu, terminal history, GitHub variable hay screenshot.

## Contract bắt buộc

- URI dùng `mongodb+srv://` và không được tắt TLS.
- URI chọn rõ database `microlearning_staging`.
- Pool mỗi Cloud Run instance là min `0`, max `10`; Staging tối đa hai instances nên budget là `20`.
- Timeout: server selection `10000ms`, connect `10000ms`, socket `30000ms`.
- Runtime và seed lấy URI từ exact Secret Manager version.
- Atlas Free chưa đáp ứng Production backup/network contract.

## Chuẩn bị credential và network

1. Xác nhận `ml-staging-app` chỉ có `readWrite@microlearning_staging`.
2. Rotate credential từng được chia sẻ và xác minh credential cũ không kết nối được.
3. Network rule rộng chỉ được dùng theo waiver synthetic có owner `project-owner`, expiry `2026-09-13`.
4. Trước expiry phải chọn static egress/narrow allowlist hoặc gia hạn bằng quyết định mới có lý do.
5. Thêm URI mới vào `ml-staging-mongodb-uri` bằng `scripts/add-secret-version.ps1`.

## Diagnostic local có kiểm soát

Đặt URI trong process environment của phiên PowerShell hiện tại, không ghi vào file:

```powershell
$env:APP_ENV = 'staging'
$env:MONGODB_URI = Read-Host 'Paste the protected Atlas URI' -AsSecureString |
  ForEach-Object { [Net.NetworkCredential]::new('', $_).Password }
npm run atlas:verify --workspace @microlearning/api
Remove-Item Env:MONGODB_URI
```

Lệnh mặc định chỉ đọc và kiểm tra topology/index. Lần chuẩn bị đầu tiên được phép tạo index và chạy transaction
synthetic tự dọn bằng:

```powershell
npm run atlas:verify --workspace @microlearning/api -- --prepare-indexes --transaction
```

Chỉ dùng hai cờ ghi dữ liệu sau khi xác nhận đúng database Staging. Không chạy với Production hoặc dữ liệu thật.

## Evidence được phép lưu

- thời điểm, actor và command mode;
- database name, TLS status, pool budget;
- index/transaction `PASS`;
- Atlas user role đã che username nếu screenshot không cần;
- network rule/waiver owner và expiry;
- negative-connect result của credential cũ.

Không lưu host URI đầy đủ, username/password, connection string, token hoặc document payload.

## Stop conditions

- credential cũ còn hoạt động;
- URI không chọn đúng database hoặc TLS bị tắt;
- user có Atlas admin/broad role;
- network mở rộng nhưng không có waiver còn hiệu lực;
- diagnostic tạo dữ liệu không synthetic hoặc không dọn được transaction record.
