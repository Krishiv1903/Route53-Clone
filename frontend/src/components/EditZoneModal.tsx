'use client';
import { useState } from 'react';
import { zonesApi, HostedZone } from '@/lib/api';

interface Props {
  zone: HostedZone;
  onClose: () => void;
  onSuccess: (zone: HostedZone) => void;
}

export default function EditZoneModal({ zone, onClose, onSuccess }: Props) {
  const [comment, setComment] = useState(zone.comment || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const updated = await zonesApi.update(zone.id, { comment });
      onSuccess(updated);
    } catch (err: any) {
      setError(err.message || 'Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded border shadow-xl w-full max-w-md" style={{ borderColor: '#d5d9d9' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#d5d9d9', backgroundColor: '#f2f3f3' }}>
          <h2 className="text-lg font-medium">Edit hosted zone</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-4">
            {error && <div className="aws-alert-error">{error}</div>}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Domain name</label>
              <div className="text-sm font-medium">{zone.name}</div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
              <span className={zone.type === 'Public' ? 'badge-public' : 'badge-private'}>{zone.type}</span>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Comment</label>
              <textarea
                className="aws-input w-full"
                rows={3}
                placeholder="Optional comment"
                value={comment}
                onChange={e => setComment(e.target.value)}
              />
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
