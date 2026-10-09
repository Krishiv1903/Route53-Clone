'use client';
import { useState } from 'react';
import { recordsApi, HostedZone, DNSRecord } from '@/lib/api';

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'PTR', 'SRV', 'CAA'];
const ROUTING_POLICIES = ['Simple', 'Weighted', 'Latency', 'Failover', 'Geolocation', 'Multivalue'];

interface Props {
  zone: HostedZone;
  record: DNSRecord;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditRecordModal({ zone, record, onClose, onSuccess }: Props) {
  const parseValue = (v: string) => {
    try {
      const arr = JSON.parse(v);
      if (Array.isArray(arr)) return arr.join('\n');
    } catch {}
    return v;
  };

  const [form, setForm] = useState({
    name: record.name,
    type: record.type,
    ttl: record.ttl,
    value: parseValue(record.value),
    routing_policy: record.routing_policy,
    alias: record.alias,
    comment: record.comment,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const lines = form.value.split('\n').map(l => l.trim()).filter(Boolean);
      await recordsApi.update(zone.id, record.id, {
        ...form,
        value: JSON.stringify(lines),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded border shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto" style={{ borderColor: '#d5d9d9' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#d5d9d9', backgroundColor: '#f2f3f3' }}>
          <h2 className="text-lg font-medium">Edit record</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">
            {error && <div className="aws-alert-error">{error}</div>}

            <div className="aws-alert-info text-xs">
              Editing record in: <strong>{zone.name}</strong>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Record name</label>
              <input type="text" className="aws-input w-full" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Record type</label>
              <select className="aws-select w-full" value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}>
                {RECORD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div>
              <label className="flex items-center cursor-pointer">
                <input type="checkbox" className="aws-checkbox mr-2" checked={form.alias}
                  onChange={e => setForm({ ...form, alias: e.target.checked })} />
                <span className="text-sm font-medium">Alias</span>
              </label>
            </div>

            {!form.alias && (
              <div>
                <label className="block text-sm font-medium mb-1">TTL (seconds)</label>
                <div className="flex items-center space-x-2">
                  <input type="number" className="aws-input w-32" min="0" value={form.ttl}
                    onChange={e => setForm({ ...form, ttl: parseInt(e.target.value) || 300 })} />
                  <div className="flex space-x-1 text-xs">
                    {[60, 300, 900, 3600, 86400].map(v => (
                      <button key={v} type="button" onClick={() => setForm({ ...form, ttl: v })}
                        className="px-2 py-1 border rounded hover:bg-gray-100" style={{ borderColor: '#d5d9d9' }}>
                        {v >= 86400 ? '1d' : v >= 3600 ? '1h' : v >= 900 ? '15m' : v >= 300 ? '5m' : '1m'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">Routing policy</label>
              <select className="aws-select w-full" value={form.routing_policy}
                onChange={e => setForm({ ...form, routing_policy: e.target.value })}>
                {ROUTING_POLICIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Value <span className="text-red-500">*</span></label>
              <textarea className="aws-input w-full font-mono text-sm" rows={4}
                value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} required />
              <p className="text-xs text-gray-500 mt-1">Enter one value per line.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Comment</label>
              <input type="text" className="aws-input w-full" placeholder="Optional comment"
                value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end px-6 py-4 border-t space-x-2" style={{ borderColor: '#d5d9d9', backgroundColor: '#f2f3f3' }}>
            <button type="button" onClick={onClose} className="btn-aws-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-aws-primary">
              {loading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
