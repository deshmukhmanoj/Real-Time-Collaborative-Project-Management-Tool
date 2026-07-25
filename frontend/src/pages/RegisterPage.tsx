import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiArrowRight } from 'react-icons/fi';
import { useRegisterMutation, useLoginMutation } from '@/api/authApi';
import { useAppDispatch } from '@/app/hooks';
import { setCredentials } from '@/features/auth/authSlice';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AuthLayout, mapError } from './LoginPage';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [register, { isLoading: registering }] = useRegisterMutation();
  const [login, { isLoading: loggingIn }] = useLoginMutation();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    try {
      await register({ name, email, password }).unwrap();
      const loginRes = await login({ email, password }).unwrap();
      dispatch(setCredentials(loginRes.data));
      toast.success(`Welcome to Boardline, ${name.split(' ')[0]}!`);
      navigate('/', { replace: true });
    } catch (err: any) {
      toast.error(mapError(err?.data?.error));
    }
  };

  return (
    <AuthLayout>
      <h1 className="font-display text-2xl font-semibold">Create your account</h1>
      <p className="mt-1 text-sm text-ink-soft">Start organizing your team's work.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Input
          label="Full name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Doe"
          autoComplete="name"
        />
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
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
          autoComplete="new-password"
        />
        <Input
          label="Confirm password"
          type="password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
        />
        <Button
          type="submit"
          isLoading={registering || loggingIn}
          className="mt-2 justify-center"
          size="lg"
        >
          Create account <FiArrowRight className="ml-1" />
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{' '}
        <Link to="/login" className="font-medium text-blueprint hover:underline">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
