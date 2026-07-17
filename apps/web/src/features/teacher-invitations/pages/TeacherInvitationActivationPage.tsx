import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, GraduationCap, UserRoundCheck } from 'lucide-react';
import { useEffect, useLayoutEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { apiRequest } from '../../../shared/api/api-client';
import { ApiError } from '../../../shared/api/api-error';
import { PasswordField } from '../../../shared/components/PasswordField';
import type {
  TeacherActivationEnvelope,
  TeacherInvitationPreview,
} from '../teacher-invitation.types';

const activationSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Họ tên phải có ít nhất 2 ký tự.').max(100),
    password: z
      .string()
      .min(12, 'Mật khẩu phải có ít nhất 12 ký tự.')
      .max(128, 'Mật khẩu không được vượt quá 128 ký tự.')
      .refine((value) => value.trim() === value, 'Không được có khoảng trắng ở đầu hoặc cuối.'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu xác nhận không khớp.',
  });

type ActivationValues = z.infer<typeof activationSchema>;

function invitationErrorMessage(error: unknown) {
  if (!(error instanceof ApiError)) return 'Không thể xác thực lời mời. Vui lòng thử lại.';
  const messages: Record<string, string> = {
    RESOURCE_NOT_FOUND: 'Link mời không hợp lệ hoặc không tồn tại.',
    INVITATION_EXPIRED: 'Link mời đã hết hạn. Hãy liên hệ Admin để nhận link mới.',
    INVITATION_REVOKED: 'Link mời đã bị thu hồi. Hãy liên hệ Admin.',
    INVITATION_ALREADY_ACCEPTED: 'Link mời đã được sử dụng.',
    INVITATION_EMAIL_MISMATCH: 'Email kích hoạt không khớp với lời mời.',
    DUPLICATE_RESOURCE: 'Email này đã thuộc một tài khoản trong hệ thống.',
  };
  return messages[error.code] ?? error.message;
}

function displayDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(
    new Date(value),
  );
}

export function TeacherInvitationActivationPage() {
  const navigate = useNavigate();
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token'));
  const [preview, setPreview] = useState<TeacherInvitationPreview | null>(null);
  const [previewState, setPreviewState] = useState<'loading' | 'ready' | 'error'>(
    token ? 'loading' : 'error',
  );
  const [previewError, setPreviewError] = useState<string | null>(
    token ? null : 'Link mời thiếu token kích hoạt.',
  );
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ActivationValues>({ resolver: zodResolver(activationSchema) });

  useLayoutEffect(() => {
    if (!window.location.search) return;
    window.history.replaceState(
      window.history.state,
      '',
      `${window.location.pathname}${window.location.hash}`,
    );
  }, []);

  useEffect(() => {
    let active = true;
    if (!token) return undefined;
    void apiRequest<{
      success: true;
      data: { invitation: TeacherInvitationPreview };
    }>('/teacher/invitations/preview', { method: 'POST', body: { token } })
      .then((response) => {
        if (!active) return;
        setPreview(response.data.invitation);
        setPreviewState('ready');
      })
      .catch((error) => {
        if (!active) return;
        setPreviewError(invitationErrorMessage(error));
        setPreviewState('error');
      });
    return () => {
      active = false;
    };
  }, [token]);

  const submit = handleSubmit(async (values) => {
    if (!token || !preview) return;
    try {
      const response = await apiRequest<TeacherActivationEnvelope>('/teacher/invitations/accept', {
        method: 'POST',
        body: {
          token,
          email: preview.email,
          fullName: values.fullName,
          password: values.password,
          confirmPassword: values.confirmPassword,
        },
      });
      navigate('/login', {
        replace: true,
        state: {
          message: `Kích hoạt ${response.data.user.email} thành công. Hãy đăng nhập để tiếp tục.`,
        },
      });
    } catch (error) {
      setError('root', { message: invitationErrorMessage(error) });
    }
  });

  return (
    <main className="auth-layout teacher-activation">
      <section className="auth-panel" aria-labelledby="teacher-activation-title">
        <div className="auth-heading">
          <span className="product-mark">
            <GraduationCap size={19} /> Microlearning
          </span>
          <h1 id="teacher-activation-title">Kích hoạt tài khoản Teacher</h1>
          <p>Hoàn tất hồ sơ và tự thiết lập mật khẩu. Admin không thể xem mật khẩu của bạn.</p>
        </div>

        {previewState === 'loading' ? (
          <div className="loading-state" aria-live="polite">
            <div className="spinner" aria-hidden="true" />
            <p>Đang xác thực link mời...</p>
          </div>
        ) : null}

        {previewState === 'error' ? (
          <div className="invitation-invalid" role="alert">
            <UserRoundCheck size={32} />
            <strong>Không thể kích hoạt tài khoản</strong>
            <p>{previewError}</p>
            <Link to="/login">Đi đến đăng nhập</Link>
          </div>
        ) : null}

        {previewState === 'ready' && preview ? (
          <>
            <div className="invitation-preview">
              <CheckCircle2 size={19} />
              <span>
                Link hợp lệ cho <strong>{preview.email}</strong>
                <small>Hết hạn: {displayDate(preview.expiresAt)}</small>
              </span>
            </div>
            <form onSubmit={(event) => void submit(event)} noValidate>
              <div className="form-field">
                <label htmlFor="teacherFullName">Họ và tên</label>
                <input id="teacherFullName" autoComplete="name" {...register('fullName')} />
                {errors.fullName ? (
                  <span className="field-error">{errors.fullName.message}</span>
                ) : null}
              </div>
              <div className="form-field">
                <label htmlFor="invitedTeacherEmail">Email</label>
                <input
                  id="invitedTeacherEmail"
                  type="email"
                  value={preview.email}
                  readOnly
                  aria-readonly="true"
                />
              </div>
              <PasswordField
                id="teacherPassword"
                label="Mật khẩu mới"
                autoComplete="new-password"
                error={errors.password?.message}
                {...register('password')}
              />
              <PasswordField
                id="teacherConfirmPassword"
                label="Xác nhận mật khẩu"
                autoComplete="new-password"
                error={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />
              {errors.root ? (
                <div className="notice notice--error" role="alert">
                  {errors.root.message}
                </div>
              ) : null}
              <button className="primary-button" type="submit" disabled={isSubmitting}>
                <UserRoundCheck size={18} />
                {isSubmitting ? 'Đang kích hoạt...' : 'Kích hoạt tài khoản'}
              </button>
            </form>
          </>
        ) : null}
      </section>
    </main>
  );
}
