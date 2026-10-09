'use client';
import { useState } from 'react';
import { zonesApi, HostedZone } from '@/lib/api';

interface Props {
  onClose: () => void;
  onSuccess: (zone: HostedZone) => void;
}

export default function CreateZoneModal({ onClose, onSuccess }: Props) {
  const [form, setForm] = useState({ name: '', type: 'Public', comment: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Domain name is required'); return; }
    setLoading(true);
    try {
      const zone = await zonesApi.create(form);
      onSuccess(zone);
    } catch (err: any) {
      setError(err.message || 'Failed to create hosted zone');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded border shadow-xl w-full max-w-lg" style={{ borderColor: '#d5d9d9' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#d5d9d9', backgroundColor: '#f2f3f3' }}>
          <h2 className="text-lg font-medium">Create hosted zone</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">
            {error && <div className="aws-alert-error">{error}</div>}

            <div>
              <label className="block text-sm font-medium mb-1">
                Domain name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="aws-input w-full"
                placeholder="example.com"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the name of the domain that you want to route traffic for.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <div className="space-y-2">
                {['Public', 'Private'].map(type => (
                  <label key={type} className="flex items-start cursor-pointer">
                    <input
                      type="radio"
                      name="type"
                      value={type}
                      checked={form.type === type}
                      onChange={e => setForm({ ...form, type: e.target.value })}
                      className="mt-0.5 mr-2"
                    />
                    <div>
                      <div className="text-sm font-medium">{type} hosted zone</div>
                      <div className="text-xs text-gray-500">
                        {type === 'Public'
                          ? 'Routes traffic on the internet for a domain'
                          : 'Routes traffic within an Amazon VPC'}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Comment <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                className="aws-input w-full"
                rows={3}
                placeholder="Optional comment"
                value={form.comment}
                onChange={e => setForm({ ...form, comment: e.target.value })}
              />
            </div>

            <div className="aws-alert-info text-xs">
              When you create a hosted zone, Route 53 automatically creates NS and SOA records.
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end px-6 py-4 border-t space-x-2" style={{ borderColor: '#d5d9d9', backgroundColor: '#f2f3f3' }}>
            <button type="button" onClick={onClose} className="btn-aws-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-aws-primary">
              {loading ? 'Creating...' : 'Create hosted zone'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
