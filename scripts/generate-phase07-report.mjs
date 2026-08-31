import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  ShadingType,
  ImageRun,
  PageBreak,
  TableOfContents,
  StyleLevel,
  convertInchesToTwip,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
} from 'docx';
import fs from 'node:fs';
import path from 'node:path';

// ---- Colors matching the template ----
const C = {
  NAVY:        '1F3864', // dark heading
  BLUE_MED:    '2E74B5', // table header
  BLUE_LIGHT:  'D6E4F0', // table row alt
  WHITE:       'FFFFFF',
  GRAY_LIGHT:  'F2F2F2',
  GREEN:       '1E7E34', // COMPLETED status
  ORANGE:      'E65C00', // IN PROGRESS
  BLACK:       '000000',
};

const FONT = 'Times New Roman';
const FONT_SIZE = 24; // 12pt in half-points
const FONT_SIZE_SM = 20; // 10pt
const FONT_SIZE_LG = 28; // 14pt

// ---- Helper builders ----
function t(text, opts = {}) {
  return new TextRun({
    text,
    font: FONT,
    size: opts.size ?? FONT_SIZE,
    bold: opts.bold ?? false,
    italics: opts.italics ?? false,
    color: opts.color ?? C.BLACK,
  });
}

function p(runs, opts = {}) {
  const runsArray = Array.isArray(runs) ? runs : [runs];
  return new Paragraph({
    alignment: opts.align ?? AlignmentType.BOTH,
    spacing: { before: opts.before ?? 80, after: opts.after ?? 80, line: opts.line ?? 300 },
    indent: opts.indent ? { left: convertInchesToTwip(opts.indent) } : undefined,
    children: runsArray.map(r => (typeof r === 'string' ? t(r) : r)),
    heading: opts.heading,
    outlineLevel: opts.outline,
  });
}

function heading1(text) {
  return new Paragraph({
    text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 120 },
    alignment: AlignmentType.LEFT,
    children: [new TextRun({ text, font: FONT, size: FONT_SIZE_LG, bold: true, color: C.NAVY })],
  });
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 180, after: 80 },
    alignment: AlignmentType.LEFT,
    children: [new TextRun({ text, font: FONT, size: FONT_SIZE, bold: true, color: C.BLUE_MED })],
  });
}

function cell(text, opts = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
    shading: opts.bg ? { type: ShadingType.SOLID, fill: opts.bg, color: opts.bg } : undefined,
    children: [
      new Paragraph({
        alignment: opts.align ?? AlignmentType.LEFT,
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({
            text,
            font: FONT,
            size: opts.size ?? FONT_SIZE_SM,
            bold: opts.bold ?? false,
            color: opts.color ?? C.BLACK,
          }),
        ],
      }),
    ],
    columnSpan: opts.span,
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
  });
}

function tableRow(cells, bg) {
  return new TableRow({
    children: cells.map(c => (c instanceof TableCell ? c : cell(c.text, { ...c, bg: bg ?? c.bg }))),
  });
}

function headerRow(labels) {
  return new TableRow({
    tableHeader: true,
    children: labels.map(label =>
      cell(label, { bg: C.BLUE_MED, bold: true, color: C.WHITE, align: AlignmentType.CENTER }),
    ),
  });
}

function simpleTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      headerRow(headers),
      ...rows.map((row, i) =>
        new TableRow({
          children: row.map(val =>
            cell(typeof val === 'string' ? val : val.text, {
              bg: i % 2 === 0 ? C.WHITE : C.BLUE_LIGHT,
              ...(typeof val === 'object' ? val : {}),
            }),
          ),
        }),
      ),
    ],
  });
}

function spacer(lines = 1) {
  return new Paragraph({ children: [new TextRun('')], spacing: { before: 80 * lines, after: 0 } });
}

// ---- LOGO ----
const logoPath = path.resolve('artifacts/progress-report/assets/hcmcou-logo.png');
const logoData = fs.readFileSync(logoPath);

// ---- COVER PAGE ----
function buildCoverPage() {
  return [
    spacer(2),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 200 },
      children: [
        new ImageRun({
          data: logoData,
          transformation: { width: 130, height: 130 },
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 60 },
      children: [
        new TextRun({ text: 'TRƯỜNG ĐẠI HỌC MỞ THÀNH PHỐ HỒ CHÍ MINH', font: FONT, size: 24, bold: true }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 60 },
      children: [
        new TextRun({ text: 'KHOA CÔNG NGHỆ THÔNG TIN', font: FONT, size: 22, bold: true }),
      ],
    }),
    spacer(3),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 120 },
      children: [
        new TextRun({ text: 'BÁO CÁO TIẾN ĐỘ ĐỒ ÁN', font: FONT, size: 36, bold: true, color: C.NAVY }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 80 },
      children: [
        new TextRun({
          text: 'Microlearning Classroom LMS Platform',
          font: FONT, size: 30, bold: true, color: C.BLUE_MED,
        }),
      ],
    }),
    spacer(2),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 80 },
      children: [
        new TextRun({
          text: 'PHASE 07 – DEVOPS AND DEPLOYMENT',
          font: FONT, size: 28, bold: true, color: C.NAVY,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 80 },
      children: [
        new TextRun({
          text: 'Hoàn thành Phase 07 & Chuẩn bị Phase 08 – Production Release',
          font: FONT, size: 24, italics: true, color: C.BLUE_MED,
        }),
      ],
    }),
    spacer(3),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 60 },
      children: [new TextRun({ text: 'Ngày báo cáo: 31/08/2026', font: FONT, size: 22, bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 60 },
      children: [new TextRun({ text: 'Repository: https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App', font: FONT, size: 20 })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// ---- INTRO SECTION ----
function buildIntro() {
  return [
    heading1('GIỚI THIỆU'),
    p([
      t('Mục tiêu của báo cáo là trình bày toàn bộ kết quả thực hiện '),
      t('Phase 07 – DevOps And Deployment', { bold: true }),
      t(' đã hoàn thành, bao gồm: infrastructure as code, container hóa ứng dụng, CI/CD pipeline, Staging deployment, cloud smoke/E2E và toàn bộ bộ evidence. Đồng thời trình bày kế hoạch triển khai '),
      t('Phase 08 – Production Release', { bold: true }),
      t(' để hoàn thành đồ án này.'),
    ]),
    p([
      t('Tên công nghệ, actor, capability, status và contract được giữ bằng tiếng Anh để đồng nhất với source code; phần diễn giải được trình bày bằng tiếng Việt để thuận tiện cho việc đọc, review và nghiệm thu.'),
    ]),
    spacer(),
  ];
}

// ---- CHAPTER 1 ----
function buildChapter1() {
  const progressRows = [
    ['Business Analysis baseline', 'COMPLETED', '22 nhóm tài liệu BA đã liên kết và kiểm soát thay đổi.'],
    ['Phase 01 - Project Foundation', 'COMPLETED', 'Monorepo, Docker, Swagger, CI và quality gates.'],
    ['Phase 02 - Authentication And User Management', 'COMPLETED', 'JWT/refresh rotation, invitation, RBAC và user governance.'],
    ['Phase 03 - Classroom Foundation', 'COMPLETED', 'Classroom, class code/link enrollment, ownership và membership.'],
    ['Phase 04 - Learning Content', 'COMPLETED', 'Course, Module, Lesson, Flashcard, Deadline, Announcement và To-do.'],
    ['Phase 05 - Assessments And Grading', 'COMPLETED', 'Quiz, Assignment, Attempt, Submission, Grade/Regrade và deadline exception.'],
    ['Phase 06 - Reporting And Analytics', 'COMPLETED', '68/68 Must Pass; reporting, Gradebook, privacy, read model và analytics.'],
    ['Phase 07 - DevOps And Deployment', 'COMPLETED', '66/66 Must Pass; container, IaC, WIF, CD pipeline, staging deploy, E2E Pass.'],
    ['Phase 08 - Production Release', 'TIẾP THEO', 'Production Atlas, custom domain, UAT, Go/No-Go và Production apply.'],
  ];

  const archRows = [
    ['Frontend', 'ReactJS, TypeScript, Vite', 'Giao diện Admin, Teacher, Student và gọi RESTful API.'],
    ['Backend', 'Node.js, Express, TypeScript', 'Business rules, services, validation, authorization và API.'],
    ['Database', 'MongoDB Atlas', 'Transaction, compound index, revision, reporting read model.'],
    ['API document', 'Swagger/OpenAPI', 'Contract request/response/error và runtime parity.'],
    ['Container', 'Docker, non-root multi-stage', 'Production image, smoke, Trivy scan, CycloneDX SBOM.'],
    ['IaC', 'Terraform, GCS remote state', 'Cloud Run, Secret Manager, Artifact Registry, Monitoring.'],
    ['CI/CD', 'GitHub Actions, WIF/OIDC', 'Lint, test, build, publish, deploy, smoke, E2E và security gates.'],
    ['Cloud target', 'Google Cloud Run (asia-southeast1)', 'Staging COMPLETED; Production deploy thuộc Phase 08.'],
  ];

  return [
    heading1('CHƯƠNG 1. TỔNG QUAN DỰ ÁN TẠI CHECKPOINT'),
    heading2('1.1. Mục tiêu sản phẩm'),
    p([
      t('Microlearning Classroom LMS Platform là hệ thống LMS nội bộ hỗ trợ giảng dạy theo mô hình microlearning. Sản phẩm tham khảo nghiệp vụ phổ biến của Google Classroom nhưng được phân tích và triển khai độc lập, tập trung vào nội dung ngắn, deadline, đánh giá, phản hồi và theo dõi tiến độ.'),
    ]),
    p([
      t('Mục tiêu hiện tại là hoàn thiện một sản phẩm Full Stack có RESTful API rõ ràng, giao diện React theo actor, dữ liệu MongoDB có integrity, Swagger/OpenAPI đồng bộ và quy trình DevOps có thể tái lập từ local đến Google Cloud.'),
    ]),

    heading2('1.2. Actor và nguyên tắc truy cập'),
    p([t('Admin'), t(' quản trị Student, Teacher, Admin, invitation và governance metadata trong phạm vi được phép.', {})]),
    p([t('Teacher'), t(' sở hữu Classroom/Course, xây dựng nội dung, tạo assessment, chấm điểm và theo dõi tiến độ bằng dashboard, ranking và Gradebook.', {})]),
    p([t('Student'), t(' tự đăng ký, đăng nhập trước khi join bằng class code hoặc invitation link, học và theo dõi To-do, progress cùng Grade đã được trả.', {})]),
    p([t('Super Admin'), t(' có quyền governance mở rộng nhưng vẫn tuân thủ audit, privacy projection và không đọc dữ liệu học tập riêng tư ngoài contract.', {})]),

    heading2('1.3. Kiến trúc và công nghệ hiện hành'),
    simpleTable(
      ['Lớp hệ thống', 'Công nghệ/giải pháp', 'Vai trò'],
      archRows,
    ),

    heading2('1.4. Trạng thái release tại thời điểm báo cáo'),
    p([
      t('Các Phase 01-06 đã được đóng trước đó. '),
      t('Phase 07', { bold: true }),
      t(' đã hoàn thành toàn bộ pipeline: CI → Build & Publish → Deploy Staging → Cloud Smoke & E2E, với stable deployment record '),
      t('decision: PASS', { bold: true }),
      t(' tại commit '),
      t('3a1084ad', { bold: true }),
      t(', revision '),
      t('microlearning-staging-00009-6bs', { bold: true }),
      t(', ngày 31/08/2026.'),
    ]),

    heading2('1.5. Tiến độ tổng quan'),
    simpleTable(
      ['Hạng mục', 'Trạng thái', 'Kết quả chính'],
      progressRows.map(row => [
        row[0],
        { text: row[1], bold: true, color: row[1] === 'COMPLETED' ? C.GREEN : row[1] === 'TIẾP THEO' ? C.ORANGE : C.BLACK },
        row[2],
      ]),
    ),
    spacer(),
  ];
}

// ---- CHAPTER 2 ----
function buildChapter2() {
  const releaseRows = [
    ['Phase', 'P07 – DevOps And Deployment'],
    ['Planning baseline', 'PR #21; merge commit f5c58c3; Gate A APPROVED'],
    ['Implementation Pull Request', '#31 – merged at d3682ed (2026-08-30)'],
    ['Final release commit', '3a1084ad4c3b2b390b672d88b5f42df77eced163'],
    ['Image digest', 'sha256:f20d53e9a80621b7cd6caad6827329a1c8e80f4312bdaaea28d35a71fe067a2c'],
    ['Cloud Run service', 'microlearning-staging (asia-southeast1)'],
    ['Cloud Run revision', 'microlearning-staging-00009-6bs'],
    ['Staging URL', 'https://microlearning-staging-bu73wlfj5a-as.a.run.app'],
    ['Deployed at (UTC)', '2026-08-31T05:47:34.920Z'],
    ['Stable at (UTC)', '2026-08-31T05:49:29.054Z'],
    ['Must acceptance', '66/66 Pass'],
    ['Conditional acceptance', '6/6 APPROVED_NA'],
    ['Critical/High defect', '0 open'],
    ['Exit decision', 'COMPLETED – PASS'],
  ];

  return [
    heading1('CHƯƠNG 2. KẾT QUẢ HOÀN THÀNH PHASE 07'),

    heading2('2.1. Release identity và kết luận nghiệm thu'),
    simpleTable(['Thuộc tính', 'Giá trị'], releaseRows),
    spacer(),

    heading2('2.2. Runtime và Container'),
    p([
      t('Single-origin routing: ', { bold: true }),
      t('React, API, Swagger UI và health/version chạy cùng origin theo route contract. SPA deep link, API 404 và asset 404 đều được xác minh.'),
    ]),
    p([
      t('Production multi-stage non-root image: ', { bold: true }),
      t('Node 24.20.0-alpine base; runtime user '),
      t('node', { bold: true }),
      t('; không chứa secret hoặc dev artifact; image size 198MB; SIGTERM graceful shutdown trong budget.'),
    ]),
    p([
      t('Container smoke & scan: ', { bold: true }),
      t('Trivy scan '),
      t('0 Critical/High findings', { bold: true, color: C.GREEN }),
      t(' (CVE-2026-14456 đã được patch bằng Node 24.20.0); CycloneDX SBOM 167 components; production container CI Pass 1m50s.'),
    ]),
    p([
      t('Environment validation: ', { bold: true }),
      t('Production config fail-fast với missing/insecure values; version endpoint phản ánh exact commit/digest/build/environment.'),
    ]),

    heading2('2.3. Infrastructure as Code – Terraform'),
    p([
      t('Remote state: ', { bold: true }),
      t('GCS remote state private, versioned, tách environment (staging/production). Không có secret trong state hoặc plan.'),
    ]),
    p([
      t('Modules: ', { bold: true }),
      t('cloud-run-service, cloud-run-seed-job, monitoring, secret-containers, artifact_registry. Mỗi module có README và outputs.'),
    ]),
    p([
      t('Terraform traffic block: ', { bold: true }),
      t('Cloud Run service được cấu hình '),
      t('traffic { type = TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST, percent = 100 }', { bold: true }),
      t(' để đảm bảo 100% traffic luôn được route vào revision mới nhất sau mỗi lần deploy.'),
    ]),
    p([
      t('Deployment plan policy: ', { bold: true }),
      t('check-terraform-plan.mjs enforce không có unexpected destroy, public IAM hoặc cross-environment mutation. Policy SHA256 '),
      t('b4e7dfb6523a570d62dfbb9c6c60807a9b8999c2b0c20cee5b679392dd743df7', { bold: true }),
      t('.'),
    ]),

    heading2('2.4. IAM, WIF, Secret Manager và Atlas Staging'),
    p([
      t('Workload Identity Federation: ', { bold: true }),
      t('GitHub Actions xác thực Google Cloud bằng OIDC/WIF, lock đúng repository, branch và environment. Không có service-account JSON key. Runtime, deploy và seed identities tách biệt theo least privilege.'),
    ]),
    p([
      t('Secret Manager: ', { bold: true }),
      t('Secret versions confirmed enabled: mongodbUri:6, accessToken:1, authIdentityPepper:1, classroomCodePepper:1, seedDemoPassword:1. Không có secret value trong Git, log hoặc Terraform state.'),
    ]),
    p([
      t('MongoDB Atlas Staging: ', { bold: true }),
      t('Database/user riêng, TLS, bounded pool (max 10), timeouts, synthetic-only data. Network waiver có expiry '),
      t('2026-09-13', { bold: true }),
      t('. Seed job idempotent và environment-guarded.'),
    ]),

    heading2('2.5. CI/CD Pipeline – Kết quả thực tế'),
    simpleTable(
      ['Pipeline', 'Workflow Run', 'Kết quả'],
      [
        ['Continuous Integration', '#33361211113', '7/7 jobs PASS'],
        ['Build And Publish', '#33361470143', 'PASS – digest immutable'],
        ['Deploy Staging', '#33361621791', 'PASS – revision 00009-6bs'],
        ['Cloud Smoke And E2E', '#33361787203', 'PASS – 4/4 tests, stable record'],
      ],
    ),

    heading2('2.6. Cloud Smoke và Security'),
    p([
      t('Deployment smoke (5/5 PASS): ', { bold: true }),
      t('readiness, liveness, release-identity (version/commit/digest/environment match), single-origin-web, api-documentation.'),
    ]),
    p([
      t('Cloud security report (11/11 PASS): ', { bold: true }),
      t('health-readiness, HSTS, Content-Security-Policy, nosniff, referrer-policy, release-identity, SPA-routing, Swagger/OpenAPI, not-found-routing, CORS, proxy-rate-limit.'),
    ]),
    p([
      t('Cloud E2E – 4/4 roles PASS: ', { bold: true }),
    ]),
    p([t('• Student: reviews learning work và keeps a secure concurrent session.')], { indent: 0.3 }),
    p([t('• Teacher: reviews owned progress và Gradebook; foreign ownership stays hidden.')], { indent: 0.3 }),
    p([t('• Admin: reviews separated user lists và governance reporting.')], { indent: 0.3 }),
    p([t('• Super Admin: sees admin governance; cross-role API access denied.')], { indent: 0.3 }),
    p([
      t('Negative checks PASS: ', { bold: true }),
      t('UNAUTHENTICATED, RBAC, OWNERSHIP, CONCURRENT_SESSION. Artifact redaction: 0 findings.'),
    ]),

    heading2('2.7. Observability và Operations'),
    p([
      t('Monitoring: ', { bold: true }),
      t('Cloud Monitoring được apply qua Terraform trong Deploy Staging run. Uptime check targeting /ready endpoint. Structured logging với request/revision/commit/digest metadata.'),
    ]),
    p([
      t('Rollback path: ', { bold: true }),
      t('Rollback tự động được exercised trong các lần deploy trước khi fix. Prior revision '),
      t('microlearning-staging-00004-t2g', { bold: true }),
      t(' đã được restore và smoke-verified thành công. Rollback < 30s.'),
    ]),
    p([
      t('Stable deployment record: ', { bold: true }),
      t('decision: PASS, stable: true, stableAt: 2026-08-31T05:49:29.054Z. Ghi đầy đủ commit, digest, revision, secret versions, smoke/security/role report SHA256.'),
    ]),
    spacer(),
  ];
}

// ---- CHAPTER 3 ----
function buildChapter3() {
  const testRows = [
    ['API unit/coverage', '237/237', 'Pass'],
    ['Web unit/coverage', '126/126', 'Pass'],
    ['MongoDB replica-set transaction', 'Pass', 'Pass (1m35s in CI)'],
    ['OpenAPI contract', 'Pass', 'Pass (24s in CI)'],
    ['Integrated browser E2E (local)', 'Pass', 'Pass (2m57s in CI)'],
    ['Cloud E2E (4 roles)', '4/4', 'Pass (42.98s on Staging)'],
    ['Cloud security', '11/11', 'Pass'],
    ['Smoke checks', '5/5', 'Pass'],
    ['Negative auth/RBAC/ownership', 'Pass', 'Pass'],
    ['Artifact redaction gate', '0 findings', 'Pass'],
  ];

  const ciRows = [
    ['PR #31 CI (release PR)', '6/6 checks Pass', 'Production container, E2E, MongoDB, OpenAPI, Audit, Secret scan'],
    ['Post-merge main CI', '7/7 jobs Pass', 'Thêm Lint+test+build và Coverage reports'],
    ['PR #33 (monitoring fix)', '9/9 checks Pass', 'Terraform quality + full CI suite'],
    ['PR #34 (smoke retry)', '9/9 checks Pass', 'Full CI suite'],
    ['PR #35 (traffic fix)', '9/9 checks Pass', 'Full CI suite'],
    ['PR #36 (drift check fix)', '9/9 checks Pass', 'Full CI suite'],
    ['PR #37 (evidence docs)', '9/9 checks Pass', 'Full CI suite'],
  ];

  return [
    heading1('CHƯƠNG 3. CHẤT LƯỢNG, BẢO MẬT VÀ DEVOPS'),

    heading2('3.1. Kết quả kiểm thử Phase 07'),
    simpleTable(['Loại kiểm thử', 'Số lượng', 'Kết quả'], testRows),

    heading2('3.2. CI/CD quality gates'),
    simpleTable(['CI Run', 'Kết quả', 'Ghi chú'], ciRows),

    heading2('3.3. Security và supply chain'),
    p([
      t('Trivy image scan: ', { bold: true }),
      t('0 Critical, 0 High findings. CVE-2026-14456 đã được patch bằng Node 24.20.0-alpine (PR #31).'),
    ]),
    p([
      t('Gitleaks / secret scan: ', { bold: true }),
      t('Pass trên tất cả PR. Artifact redaction gate 0 findings trước upload lên GitHub Actions.'),
    ]),
    p([
      t('WIF keyless auth: ', { bold: true }),
      t('0 service-account JSON key. GitHub OIDC → WIF → short-lived token. Non-main PR không được cấp deploy credential.'),
    ]),
    p([
      t('SBOM: ', { bold: true }),
      t('CycloneDX SBOM 167 components, SHA256 c31ad88a889ae316bd0bf014f2a2b349563ef7e4966e79443b4d80f96a9cd941.'),
    ]),

    heading2('3.4. Container và clean-clone verification'),
    p([
      t('Multi-stage Dockerfile: ', { bold: true }),
      t('Build stage (Node 24.20.0-alpine) → production stage non-root user '),
      t('node', { bold: true }),
      t('. Image không chứa source code, test file, .env hoặc dev dependency.'),
    ]),
    p([
      t('Clean-clone CI: ', { bold: true }),
      t('Deploy Staging checkout exact release commit; npm ci từ clean state; build artifacts và smoke Pass tại CI runner.'),
    ]),

    heading2('3.5. Hiệu năng và rủi ro còn lại'),
    simpleTable(
      ['Rủi ro', 'Ảnh hưởng', 'Trạng thái/Biện pháp'],
      [
        ['Atlas network waiver hết hạn', 'Mất kết nối Staging', 'Expires 2026-09-13; cần renew trước Phase 08'],
        ['Production Atlas Free tier', 'Không có backup/private connectivity', 'Blocked cho Phase 08 – mua paid tier'],
        ['Custom domain/TLS', 'URL hiện tại dùng .run.app', 'APPROVED_NA Phase 07; Phase 08 scope'],
        ['UAT với dữ liệu thật', 'Risk chất lượng release', 'Phase 08 Go/No-Go gate'],
      ],
    ),
    spacer(),
  ];
}

// ---- CHAPTER 4 ----
function buildChapter4() {
  const phase8Rows = [
    ['1. Production Atlas', 'Nâng Atlas Free lên paid M10+; bật private connectivity và native backup.', 'NO-GO nếu chưa xong'],
    ['2. Custom domain/TLS', 'Mua/cấu hình domain; map Cloud Run custom domain; verify HTTPS certificate.', 'Recommended'],
    ['3. Production Terraform', 'Áp dụng Terraform module production environment; plan review và apply.', 'Required'],
    ['4. Static egress/NAT', 'Cấu hình Cloud NAT + static IP cho Atlas IP allowlist production.', 'APPROVED_NA nếu waiver'],
    ['5. UAT & System Test', 'Full E2E với dữ liệu UAT; sign-off Product Owner và Technical Lead.', 'Required'],
    ['6. Go/No-Go gate', 'Review: 66 AC, security, cost, backup, UAT, handoff accepted.', 'Required'],
    ['7. Production deploy', 'Promote exact Staging digest lên Production Cloud Run.', 'Sau Go/No-Go'],
    ['8. Smoke & monitor', 'Production smoke, alert test, uptime check và dashboard verify.', 'Required'],
    ['9. Handoff & closure', 'Final evidence register, exit report, release notes và archive.', 'Final gate'],
  ];

  const timeline = [
    ['Tuần 1', 'Atlas paid tier, Production Terraform module, domain/TLS'],
    ['Tuần 2', 'UAT preparation, test data, System Test execution'],
    ['Tuần 3', 'Go/No-Go review, Production deploy, smoke và monitoring'],
    ['Tuần 4', 'Closure, final evidence, exit report và handoff'],
  ];

  return [
    heading1('CHƯƠNG 4. CHUẨN BỊ PHASE 08 – PRODUCTION RELEASE'),

    heading2('4.1. Readiness status sau Phase 07'),
    p([
      t('Phase 07 đã chuẩn bị đầy đủ readiness cho Production release: exact image digest traceability, WIF identity pipeline, Terraform module production-ready, deployment record contract, smoke/security/E2E evidence đầy đủ và rollback path đã được rehearsal.'),
    ]),
    p([
      t('Phase 08 nhận handoff từ Phase 07 với ', { bold: false }),
      t('stable-deployment-record.json decision: PASS', { bold: true }),
      t(' làm điểm bắt đầu. Tất cả Must AC Phase 07 đã Pass; Phase 08 chỉ cần thực hiện Production apply sau khi Go/No-Go được duyệt.'),
    ]),

    heading2('4.2. Phạm vi Phase 08 – Production Release'),
    simpleTable(
      ['#', 'Công việc', 'Chi tiết', 'Điều kiện'],
      phase8Rows.map((row, i) => [`${i + 1}`, ...row]),
    ),

    heading2('4.3. Architecture Production target'),
    simpleTable(
      ['Thành phần', 'Phase 07 (Staging)', 'Phase 08 (Production)'],
      [
        ['Cloud Run region', 'asia-southeast1', 'asia-southeast1 (same)'],
        ['MongoDB Atlas', 'Free M0, synthetic data', 'Paid M10+, real data, backup'],
        ['Domain', 'cloudrun.app URL', 'Custom domain + TLS'],
        ['Network', 'Public IP waiver', 'Static egress + NAT + narrow allowlist'],
        ['Backup', 'APPROVED_NA (Free tier)', 'Native backup + PITR enabled'],
        ['Deploy trigger', 'Auto từ main CI', 'Manual Go/No-Go gate + auto'],
        ['Monitoring', 'Staging uptime/alerts', 'Production uptime/alerts + PagerDuty'],
      ],
    ),

    heading2('4.4. Nguyên tắc Phase 08'),
    p([t('Build once, promote by exact digest: ', { bold: true }), t('Phase 08 promote đúng image digest đã được scan/smoke/E2E xác nhận ở Phase 07. Không rebuild lại image.')]),
    p([t('Production apply chỉ sau Go/No-Go: ', { bold: true }), t('Protected workflow; không deploy Production sớm để làm đẹp báo cáo tiến độ.')]),
    p([t('UAT sign-off bắt buộc: ', { bold: true }), t('Product Owner và Technical Lead phải sign-off trước Go/No-Go.')]),
    p([t('Atlas paid tier là blockers: ', { bold: true }), t('Không có Production backup và private connectivity = NO-GO.')]),
    p([t('Rollback plan: ', { bold: true }), t('Prior stable digest đã được ghi trong deployment record; rollback < 60s theo runbook.')]),

    heading2('4.5. Timeline dự kiến Phase 08'),
    simpleTable(['Thời gian', 'Nội dung'], timeline),
    spacer(),
  ];
}

// ---- CHAPTER 5 ----
function buildChapter5() {
  const doneRows = [
    ['66/66 Must acceptance criteria Pass', 'Phase 07 - Done', 'Phase 08 - Must repeat for Production'],
    ['PR CI, post-merge main CI Pass', 'Done (PR #31 + #37)', 'Required cho Production PR'],
    ['Staging CD + cloud smoke Pass', 'Done (#33361621791)', 'Production CD + smoke Required'],
    ['Exact commit/digest/revision/URL evidence', 'Done (stable record)', 'Production evidence Required'],
    ['Monitoring/alert/rollback rehearsal', 'Done (staging)', 'Production repeat Required'],
    ['Critical/High defect = 0', 'Done (Trivy)', 'Maintain cho Phase 08'],
    ['UAT sign-off', 'N/A (Phase 07 = synthetic)', 'Required Phase 08'],
    ['Go/No-Go', 'N/A', 'Required Phase 08'],
    ['Production Atlas paid tier', 'Blocked Phase 08', 'Must resolve'],
  ];

  return [
    heading1('CHƯƠNG 5. DEFINITION OF DONE VÀ RỦI RO'),

    heading2('5.1. Definition of Done'),
    simpleTable(['Tiêu chí', 'Phase 07', 'Phase 08'], doneRows),

    heading2('5.2. Rủi ro trọng tâm Phase 08'),
    simpleTable(
      ['Rủi ro', 'Ảnh hưởng', 'Biện pháp chính'],
      [
        ['Atlas paid tier chưa có', 'NO-GO cho Production', 'Mua M10+ trước Tuần 1'],
        ['Custom domain/DNS config sai', 'HTTPS không hoạt động', 'Test certificate + smoke trước go-live'],
        ['UAT phát hiện bug nghiêm trọng', 'Delay release', 'Fix + re-test trong sprint; không skip'],
        ['Terraform Production plan sai scope', 'Destroy/public IAM', 'Review plan kỹ; dùng protected workflow'],
        ['Cost vượt budget trial', 'Project bị suspend', 'Monitoring billing alert + quota guardrails'],
        ['Secret hoặc credential bị lộ', 'Vi phạm bảo mật', 'WIF, redaction gate, Gitleaks, rotate ngay'],
      ],
    ),

    heading2('5.3. Nguyên tắc phát triển và triển khai Phase 08'),
    p([t('Promote exact digest Phase 07 đã Pass smoke/E2E; không rebuild lại image cho Production.')]),
    p([t('Không paste credential vào Git, log, command history, screenshot hoặc Terraform variable/state.')]),
    p([t('Cloud apply chỉ chạy sau review Terraform plan; Production apply luôn bị chặn đến Go/No-Go.')]),
    p([t('Mọi UI/API/Cloud change phải có automated test, smoke, evidence và rollback consideration tương ứng.')]),
    spacer(),
  ];
}

// ---- CONCLUSION ----
function buildConclusion() {
  return [
    heading1('KẾT LUẬN'),
    p([
      t('Tại checkpoint ngày ', { bold: false }),
      t('31/08/2026', { bold: true }),
      t(', Phase 07 – DevOps And Deployment đã hoàn thành với ', { bold: false }),
      t('66/66 Must acceptance criteria Pass', { bold: true }),
      t(', 6 Conditional APPROVED_NA, 0 Critical/High defect. Toàn bộ CD pipeline từ main branch đến Staging cloud đã Pass: CI (7/7) → Build & Publish → Deploy Staging → Cloud Smoke & E2E (4/4 roles). Stable deployment record '),
      t('decision: PASS', { bold: true }),
      t(' tại revision '),
      t('microlearning-staging-00009-6bs', { bold: true }),
      t(', digest '),
      t('sha256:f20d53e9...', { bold: true }),
      t('.'),
    ]),
    p([
      t('Phase 08 – Production Release', { bold: true }),
      t(' là giai đoạn cuối cùng để hoàn thành đồ án. Công việc tiếp theo bao gồm: nâng Atlas paid tier, cấu hình custom domain/TLS, apply Production Terraform, thực hiện UAT, Go/No-Go review và promote exact image digest lên Production. Phase 07 đã chuẩn bị đầy đủ identity pipeline, IaC modules, deployment record contract và rollback runbook cho Phase 08.'),
    ]),
    spacer(),
  ];
}

// ---- APPENDIX ----
function buildAppendix() {
  const evidenceRows = [
    ['01', 'Phase 07 planning baseline', 'PR #21; merge f5c58c3'],
    ['02', 'Phase 07 Gate A', 'GCP, tools, Atlas, GitHub environments/protection Pass'],
    ['03', 'Phase 07 release PR', 'PR #31; merge d3682ed; 6/6 checks Pass (2026-08-30)'],
    ['04', 'Post-merge main CI', 'Run #33319547230; 7/7 Pass; commit d3682ed'],
    ['05', 'CVE patch (Node 24.20.0)', 'PR #31; Trivy 0 Critical/High findings'],
    ['06', 'Terraform monitoring fix', 'PR #32 + #33; merged; create_before_destroy lifecycle'],
    ['07', 'Smoke test retry', 'PR #34; merged; retry loop 12 attempts'],
    ['08', 'Traffic routing fix', 'PR #35; merged; TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST'],
    ['09', 'Drift check fix', 'PR #36; merged; terraform apply -refresh-only'],
    ['10', 'Final evidence docs', 'PR #37; merged; evidence register + exit report'],
    ['11', 'Build And Publish', 'Run #33361470143; digest sha256:f20d53e9...'],
    ['12', 'Deploy Staging PASS', 'Run #33361621791; revision 00009-6bs; stable'],
    ['13', 'Cloud Smoke And E2E PASS', 'Run #33361787203; 4/4 tests; 11 security checks'],
    ['14', 'Stable deployment record', 'decision: PASS; stable: true; stableAt: 2026-08-31T05:49:29Z'],
    ['15', 'Artifact redaction', '0 findings; 9 files scanned'],
    ['16', 'Image SBOM', 'CycloneDX 167 components; sha256:c31ad88a...'],
  ];

  return [
    heading1('PHỤ LỤC. DANH MỤC BẰNG CHỨNG'),
    simpleTable(['ID', 'Bằng chứng', 'Định danh/kết quả'], evidenceRows),
    spacer(),
    p([
      t('Repository: ', { bold: true }),
      t('https://github.com/toanteng11/Microlearning-RestFullAPI-FullStack-App'),
    ]),
    p([
      t('Ghi chú kiểm soát báo cáo: ', { bold: true }),
      t('Báo cáo phản ánh Phase 07 đã COMPLETED với stable deployment record tại checkpoint 31/08/2026. Báo cáo không tuyên bố Production đã được deploy trước khi có Go/No-Go Phase 08.'),
    ]),
  ];
}

// ---- BUILD DOCUMENT ----
async function buildDocument() {
  const sections = [
    ...buildCoverPage(),
    ...buildIntro(),
    ...buildChapter1(),
    ...buildChapter2(),
    ...buildChapter3(),
    ...buildChapter4(),
    ...buildChapter5(),
    ...buildConclusion(),
    ...buildAppendix(),
  ];

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: { font: FONT, size: FONT_SIZE },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1.25),
              right: convertInchesToTwip(1),
            },
          },
        },
        children: sections,
      },
    ],
  });

  const buf = await Packer.toBuffer(doc);
  const outPath = 'artifacts/progress-report/bao-cao-tien-do-microlearning-classroom-lms-phase7-va-chuan-bi-phase8.docx';
  fs.writeFileSync(outPath, buf);
  console.log('Created:', outPath, '- Size:', buf.length, 'bytes');
}

buildDocument().catch(err => { console.error(err); process.exit(1); });
