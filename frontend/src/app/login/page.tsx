'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.username, form.password);
      router.push('/route53');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#232f3e' }}>
      {/* AWS-style top bar */}
      <div className="h-10 flex items-center px-6" style={{ backgroundColor: '#232f3e', borderBottom: '1px solid #3a4553' }}>
        <span className="text-white font-bold text-xl" style={{ color: '#ff9900' }}>aws</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          {/* AWS Smile logo area */}
          <div className="text-center mb-8">
            <div className="text-white text-2xl font-light mb-1">Amazon Web Services</div>
            <div style={{ color: '#ff9900', fontSize: 13 }}>Sign in to the Console</div>
          </div>

          <div className="bg-white rounded border p-8" style={{ borderColor: '#d5d9d9' }}>
            <h1 className="text-xl font-medium mb-6" style={{ color: '#16191f' }}>Sign in</h1>

            {error && (
              <div className="aws-alert-error mb-4">
                <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#16191f' }}>
                  IAM Username
                </label>
                <input
                  type="text"
                  className="aws-input w-full"
                  placeholder="Enter username"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: '#16191f' }}>
                  Password
                </label>
                <input
                  type="password"
                  className="aws-input w-full"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 text-sm font-medium rounded text-white transition-colors"
                style={{ backgroundColor: loading ? '#879596' : '#ec7211', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t text-center text-sm" style={{ borderColor: '#d5d9d9' }}>
              <span style={{ color: '#545b64' }}>New to AWS? </span>
              <Link href="/register" className="aws-link font-medium">Create a new AWS account</Link>
            </div>
          </div>

          <div className="mt-4 text-center text-xs" style={{ color: '#879596' }}>
            © 2024, Amazon Web Services, Inc. or its affiliates.
          </div>
        </div>
      </div>
    </div>
  );
}
