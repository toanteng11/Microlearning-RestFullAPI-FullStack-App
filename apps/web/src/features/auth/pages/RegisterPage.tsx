import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { apiRequest } from '../../../shared/api/api-client';
import { ApiError } from '../../../shared/api/api-error';
import { PasswordField } from '../../../shared/components/PasswordField';

const passwordSchema = z
  .string()
  .min(12, 'Mật khẩu phải có ít nhất 12 ký tự.')
  .max(128, 'Mật khẩu không được vượt quá 128 ký tự.')
  .refine((value) => value.trim() === value, 'Không được có khoảng trắng ở đầu hoặc cuối.');

const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, 'Họ tên phải có ít nhất 2 ký tự.').max(100),
    email: z.email('Email không hợp lệ.'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Mật khẩu xác nhận không khớp.',
  });
type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  const submit = handleSubmit(async (values) => {
    try {
      await apiRequest('/auth/register', { method: 'POST', body: values });
      navigate('/login', {
        replace: true,
        state: { message: 'Đăng ký thành công. Bạn có thể đăng nhập ngay.' },
      });
    } catch (error) {
      const message =
        error instanceof ApiError && error.code === 'DUPLICATE_RESOURCE'
          ? 'Email này đã được sử dụng.'
          : 'Không thể đăng ký tài khoản. Vui lòng kiểm tra lại thông tin.';
      setError('root', { message });
    }
  });

  return (
    <main className="auth-layout">
      <section className="auth-panel" aria-labelledby="register-title">
        <div className="auth-heading">
          <span className="product-mark">Microlearning</span>
          <h1 id="register-title">Đăng ký Student</h1>
          <p>Tạo tài khoản trước khi tham gia lớp học bằng link hoặc class code.</p>
        </div>
        <form onSubmit={(event) => void submit(event)} noValidate>
          <div className="form-field">
            <label htmlFor="fullName">Họ và tên</label>
            <input id="fullName" autoComplete="name" {...register('fullName')} />
            {errors.fullName ? (
              <span className="field-error">{errors.fullName.message}</span>
            ) : null}
          </div>
          <div className="form-field">
            <label htmlFor="registerEmail">Email</label>
            <input id="registerEmail" type="email" autoComplete="email" {...register('email')} />
            {errors.email ? <span className="field-error">{errors.email.message}</span> : null}
          </div>
          <PasswordField
            id="newPassword"
            label="Mật khẩu"
            autoComplete="new-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <PasswordField
            id="confirmPassword"
            label="Xác nhận mật khẩu"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          {errors.root ? <div className="notice notice--error">{errors.root.message}</div> : null}
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            <UserPlus size={18} /> {isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </button>
        </form>
        <p className="auth-alternative">
          Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
        </p>
      </section>
    </main>
  );
}
