'use client';
import { useState } from 'react';
import { recordsApi, HostedZone, DNSRecord } from '@/lib/api';

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'PTR', 'SRV', 'CAA'];
const ROUTING_POLICIES = ['Simple', 'Weighted', 'Latency', 'Failover', 'Geolocation', 'Multivalue'];

const RECORD_PLACEHOLDERS: Record<string, string> = {
  A: '192.0.2.1\n192.0.2.2',
  AAAA: '2001:db8::1',
  CNAME: 'www.example.com',
  TXT: '"v=spf1 include:example.com ~all"',
  MX: '10 mail.example.com',
  NS: 'ns1.example.com\nns2.example.com',
  PTR: 'example.com',
  SRV: '10 20 5060 sipserver.example.com',
  CAA: '0 issue "letsencrypt.org"',
};

interface Props {
  zone: HostedZone;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateRecordModal({ zone, onClose, onSuccess }: Props) {
  const [form, setForm] = useState({
    name: '',
    type: 'A',
    ttl: 300,
    value: '',
    routing_policy: 'Simple',
    alias: false,
    comment: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.value.trim()) { setError('Value is required'); return; }

    // Convert multi-line value to JSON array
    const lines = form.value.split('\n').map(l => l.trim()).filter(Boolean);
    const valueJson = JSON.stringify(lines);

    setLoading(true);
    try {
      await recordsApi.create(zone.id, {
        ...form,
        name: form.name || zone.name,
        value: valueJson,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded border shadow-xl w-full max-w-2xl max-h-screen overflow-y-auto" style={{ borderColor: '#d5d9d9' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white z-10" style={{ borderColor: '#d5d9d9', backgroundColor: '#f2f3f3' }}>
          <h2 className="text-lg font-medium">Create record</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">
            {error && <div className="aws-alert-error">{error}</div>}

            {/* Zone info */}
            <div className="aws-alert-info text-xs">
              Creating record in: <strong>{zone.name}</strong>
            </div>

            {/* Record name */}
            <div>
              <label className="block text-sm font-medium mb-1">Record name</label>
              <div className="flex items-center">
                <input
                  type="text"
                  className="aws-input"
                  style={{ borderRadius: '4px 0 0 4px', flex: 1 }}
                  placeholder={`subdomain (blank = ${zone.name})`}
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
                <div className="px-3 py-1.5 text-sm border-l-0 border rounded-r"
                  style={{ backgroundColor: '#f2f3f3', borderColor: '#879596', color: '#545b64', whiteSpace: 'nowrap' }}>
                  .{zone.name}
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">Leave blank to create a record for the zone apex.</p>
            </div>

            {/* Record type */}
            <div>
              <label className="block text-sm font-medium mb-1">Record type <span className="text-red-500">*</span></label>
              <select className="aws-select w-full" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                {RECORD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            {/* Alias toggle */}
            <div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="aws-checkbox mr-2"
                  checked={form.alias}
                  onChange={e => setForm({ ...form, alias: e.target.checked })}
                />
                <span className="text-sm font-medium">Alias</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                Route traffic to an AWS resource or another Route 53 record.
              </p>
            </div>

            {/* TTL */}
            {!form.alias && (
              <div>
                <label className="block text-sm font-medium mb-1">TTL (seconds)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    className="aws-input w-32"
                    min="0"
                    max="2147483647"
                    value={form.ttl}
                    onChange={e => setForm({ ...form, ttl: parseInt(e.target.value) || 300 })}
                  />
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

            {/* Routing policy */}
            <div>
              <label className="block text-sm font-medium mb-1">Routing policy</label>
              <select className="aws-select w-full" value={form.routing_policy}
                onChange={e => setForm({ ...form, routing_policy: e.target.value })}>
                {ROUTING_POLICIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Value */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Value <span className="text-red-500">*</span>
              </label>
              <textarea
                className="aws-input w-full font-mono text-sm"
                rows={4}
                placeholder={RECORD_PLACEHOLDERS[form.type] || 'Enter value...'}
                value={form.value}
                onChange={e => setForm({ ...form, value: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Enter one value per line.</p>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium mb-1">Comment <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="text"
                className="aws-input w-full"
                placeholder="Optional comment"
                value={form.comment}
                onChange={e => setForm({ ...form, comment: e.target.value })}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end px-6 py-4 border-t space-x-2 sticky bottom-0 bg-white" style={{ borderColor: '#d5d9d9', backgroundColor: '#f2f3f3' }}>
            <button type="button" onClick={onClose} className="btn-aws-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-aws-primary">
              {loading ? 'Creating...' : 'Create record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
