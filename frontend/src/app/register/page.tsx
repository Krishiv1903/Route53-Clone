'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(form.username, form.email, form.password);
      router.push('/route53');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#232f3e' }}>
      <div className="h-10 flex items-center px-6" style={{ backgroundColor: '#232f3e', borderBottom: '1px solid #3a4553' }}>
        <span className="text-white font-bold text-xl" style={{ color: '#ff9900' }}>aws</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-white text-2xl font-light mb-1">Amazon Web Services</div>
            <div style={{ color: '#ff9900', fontSize: 13 }}>Create a new AWS account</div>
          </div>

          <div className="bg-white rounded border p-8" style={{ borderColor: '#d5d9d9' }}>
            <h1 className="text-xl font-medium mb-6" style={{ color: '#16191f' }}>Create Account</h1>

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
                <label className="block text-sm font-medium mb-1">Username</label>
                <input type="text" className="aws-input w-full" placeholder="Choose a username"
                  value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email address</label>
                <input type="email" className="aws-input w-full" placeholder="Enter email"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input type="password" className="aws-input w-full" placeholder="Min 6 characters"
                  value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm password</label>
                <input type="password" className="aws-input w-full" placeholder="Re-enter password"
                  value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2 text-sm font-medium rounded text-white"
                style={{ backgroundColor: loading ? '#879596' : '#ec7211', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}>
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t text-center text-sm" style={{ borderColor: '#d5d9d9' }}>
              <span style={{ color: '#545b64' }}>Already have an account? </span>
              <Link href="/login" className="aws-link font-medium">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
