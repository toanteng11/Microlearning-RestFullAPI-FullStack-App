import { zodResolver } from '@hookform/resolvers/zod';
import { LogIn } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';

import { dashboardForRole } from '../../../app/route-paths';
import { ApiError } from '../../../shared/api/api-error';
import { useAuth } from '../../../shared/auth/auth-context';
import { PasswordField } from '../../../shared/components/PasswordField';
import { returnUrlForRole } from '../login-return-url';

const loginSchema = z.object({
  email: z.email('Email không hợp lệ.'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu.'),
});
type LoginValues = z.infer<typeof loginSchema>;

interface LoginLocationState {
  message?: string;
  returnUrl?: string;
}

export function LoginPage() {
  const { login, status, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = (location.state ?? {}) as LoginLocationState;
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  useEffect(() => {
    if (status === 'authenticated' && user)
      navigate(
        returnUrlForRole(locationState.returnUrl, user.role) ?? dashboardForRole(user.role),
        {
          replace: true,
        },
      );
  }, [locationState.returnUrl, navigate, status, user]);

  const submit = handleSubmit(async (values) => {
    try {
      const currentUser = await login(values.email, values.password);
      navigate(
        returnUrlForRole(locationState.returnUrl, currentUser.role) ??
          dashboardForRole(currentUser.role),
        { replace: true },
      );
    } catch (error) {
      const message =
        error instanceof ApiError && error.code === 'RATE_LIMITED'
          ? 'Đã thử đăng nhập quá nhiều lần. Vui lòng thử lại sau.'
          : 'Email hoặc mật khẩu không chính xác, hoặc tài khoản chưa sẵn sàng.';
      setError('root', { message });
    }
  });

  return (
    <main className="auth-layout">
      <section className="auth-panel" aria-labelledby="login-title">
        <div className="auth-heading">
          <span className="product-mark">Microlearning</span>
          <h1 id="login-title">Đăng nhập</h1>
          <p>Truy cập lớp học và không gian làm việc của bạn.</p>
        </div>
        {locationState.message ? (
          <div className="notice notice--success">{locationState.message}</div>
        ) : null}
        <form onSubmit={(event) => void submit(event)} noValidate>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              {...register('email')}
            />
            {errors.email ? <span className="field-error">{errors.email.message}</span> : null}
          </div>
          <PasswordField
            id="password"
            label="Mật khẩu"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          {errors.root ? <div className="notice notice--error">{errors.root.message}</div> : null}
          <button className="primary-button" type="submit" disabled={isSubmitting}>
            <LogIn size={18} /> {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
        <p className="auth-alternative">
          Chưa có tài khoản Student? <Link to="/register">Đăng ký</Link>
        </p>
      </section>
    </main>
  );
}
