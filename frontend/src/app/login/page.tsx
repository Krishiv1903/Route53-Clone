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
        <svg width="60" height="36" viewBox="0 0 1000 600" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M287.4 199.1L225.6 375h41l14.3-44.4h61.6L356.7 375h42.2l-62.6-175.9h-49zm3.4 97.7l21-65.3 21 65.3h-42zm153.1-97.7h-38.7V375h38.7V199.1zM565.8 288c0-22.2-12-37.4-35.9-43.8l-21.6-6.1c-10.8-3-15.3-8.3-15.3-16.4 0-10.2 7.5-16.8 20.2-16.8 13.3 0 21.2 7.5 22.5 21.1h36.4c-2.3-31.5-24.2-51-59.2-51-34.3 0-57.7 20.2-57.7 49.5 0 21.5 11.2 36.1 34.4 42.4l22.5 6.3c12 3.4 16.5 8.5 16.5 17.4 0 10.8-8.5 17.7-22.5 17.7-15.3 0-24.7-8.3-26.1-23.8h-37c1.8 33.3 25.3 54.4 63.1 54.4 36.7 0 60.2-21.5 60.2-50.9zm100.6-88.9h-82v175.9h82c51 0 84.4-34.4 84.4-88.3 0-53.5-33.4-87.6-84.4-87.6zm-1.4 141.2h-42.2V233.8h42.2c28 0 45.3 20.2 45.3 53.6s-17.3 53.9-45.3 53.9z" fill="#FF9900"/>
        </svg>
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
