'use client';
import { HostedZone } from '@/lib/api';

interface Props {
  count: number;
  zones: HostedZone[];
  onClose: () => void;
  onConfirm: () => void;
}

export default function DeleteZoneModal({ count, zones, onClose, onConfirm }: Props) {
  return (
    <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded border shadow-xl w-full max-w-md" style={{ borderColor: '#d5d9d9' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: '#d5d9d9', backgroundColor: '#f2f3f3' }}>
          <h2 className="text-lg font-medium">Delete hosted zone{count > 1 ? 's' : ''}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>
        <div className="px-6 py-5">
          <div className="aws-alert-error mb-4">
            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
            </svg>
            <span>This action cannot be undone.</span>
          </div>
          <p className="text-sm mb-4">
            Are you sure you want to delete the following hosted zone{count > 1 ? 's' : ''}?
          </p>
          <div className="border rounded overflow-hidden" style={{ borderColor: '#d5d9d9' }}>
            {zones.map(z => (
              <div key={z.id} className="px-4 py-2 text-sm border-b last:border-0 flex justify-between" style={{ borderColor: '#eaeded' }}>
                <span className="font-medium">{z.name}</span>
                <span className={z.type === 'Public' ? 'badge-public' : 'badge-private'}>{z.type}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex justify-end px-6 py-4 border-t space-x-2" style={{ borderColor: '#d5d9d9', backgroundColor: '#f2f3f3' }}>
          <button onClick={onClose} className="btn-aws-secondary">Cancel</button>
          <button onClick={onConfirm} className="btn-aws-danger" style={{ backgroundColor: '#d13212', color: '#fff', borderColor: '#d13212' }}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
