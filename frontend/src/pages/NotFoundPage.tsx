import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

export default function NotFoundPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center gap-3 text-center px-4">
      <span className="font-mono text-sm text-ink-faint">ERR-404</span>
      <h1 className="font-display text-3xl font-semibold">Page not found</h1>
      <p className="text-sm text-ink-soft">The page you're looking for doesn't exist.</p>
      <Link to="/">
        <Button className="mt-2">Back to dashboard</Button>
      </Link>
    </div>
  );
}
