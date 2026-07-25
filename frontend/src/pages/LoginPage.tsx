import { FormEvent, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowRight } from 'react-icons/fi';
import { useLoginMutation } from '@/api/authApi';
import { useAppDispatch } from '@/app/hooks';
import { setCredentials } from '@/features/auth/authSlice';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [login, { isLoading }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const res = await login({ email, password }).unwrap();
      dispatch(setCredentials(res.data));
      toast.success(`Welcome back, ${res.data.user.name.split(' ')[0]}`);
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      toast.error(mapError(err?.data?.error));
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-display text-2xl font-semibold">Welcome back</h1>
      <p className="mt-1 text-sm text-ink-soft">Sign in to your workspace.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          autoComplete="email"
        />
        <Input
          label="Password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />
        <Button type="submit" isLoading={isLoading} className="mt-2 justify-center" size="lg">
          Sign in <FiArrowRight className="ml-1" />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Don't have an account?{' '}
        <Link to="/register" className="font-medium text-blueprint hover:underline">
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      {/* corner crop marks — the blueprint/drafting motif */}
      <CropMarks />
      <div className="w-full max-w-sm rounded-md border border-line bg-white p-8 shadow-panel animate-slide-up">
        {children}
      </div>
    </div>
  );
}

function CropMarks() {
  const mark = 'absolute w-4 h-4 border-ink-faint/40';
  return (
    <>
      <div className={`${mark} top-6 left-6 border-l-2 border-t-2`} />
      <div className={`${mark} top-6 right-6 border-r-2 border-t-2`} />
      <div className={`${mark} bottom-6 left-6 border-l-2 border-b-2`} />
      <div className={`${mark} bottom-6 right-6 border-r-2 border-b-2`} />
    </>
  );
}

export function mapError(code?: string): string {
  const messages: Record<string, string> = {
    INVALID_CREDENTIALS: 'Incorrect email or password.',
    EMAIL_ALREADY_EXISTS: 'An account with that email already exists.',
    ACCOUNT_DISABLED: 'This account has been disabled.',
    PASSWORD_TOO_SHORT: 'Password must be at least 6 characters.',
    NAME_EMAIL_PASSWORD_REQUIRED: 'Please fill in all fields.',
  };
  return messages[code || ''] || 'Something went wrong. Please try again.';
}
