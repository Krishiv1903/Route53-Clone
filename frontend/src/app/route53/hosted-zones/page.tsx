'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { zonesApi, HostedZone } from '@/lib/api';
import CreateZoneModal from '@/components/CreateZoneModal';
import DeleteZoneModal from '@/components/DeleteZoneModal';
import EditZoneModal from '@/components/EditZoneModal';

export default function HostedZonesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [zones, setZones] = useState<HostedZone[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [zoneType, setZoneType] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editZone, setEditZone] = useState<HostedZone | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  const fetchZones = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const data = await zonesApi.list({ page, page_size: pageSize, search: search || undefined, zone_type: zoneType || undefined });
      setZones(data.zones);
      setTotal(data.total);
    } catch (e: any) {
      setError(e.message || 'Failed to load hosted zones');
    } finally {
      setLoading(false);
    }
  }, [user, page, search, zoneType]);

  useEffect(() => { fetchZones(); }, [fetchZones]);

  const showNotif = (type: 'success' | 'error', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 5000);
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === zones.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(zones.map(z => z.id)));
    }
  };

  const handleDelete = async () => {
    try {
      await Promise.all(Array.from(selected).map(id => zonesApi.delete(id)));
      setSelected(new Set());
      setShowDelete(false);
      showNotif('success', `${selected.size} hosted zone(s) deleted successfully`);
      fetchZones();
    } catch (e: any) {
      showNotif('error', e.message || 'Delete failed');
    }
  };

  const handleZoneClick = (zone: HostedZone) => {
    router.push(`/route53/hosted-zones/${zone.id}`);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="aws-breadcrumb mb-4">
        Route 53 &rsaquo; Hosted zones
      </nav>

      {/* Notification */}
      {notification && (
        <div className={`mb-4 ${notification.type === 'success' ? 'aws-alert-success' : 'aws-alert-error'}`}>
          <span>{notification.msg}</span>
          <button onClick={() => setNotification(null)} className="ml-auto text-lg leading-none opacity-70 hover:opacity-100">&times;</button>
        </div>
      )}

      {/* Page header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-normal" style={{ color: '#16191f' }}>Hosted zones</h1>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCreate(true)}
            className="btn-aws-primary"
          >
            Create hosted zone
          </button>
          <button
            onClick={() => { if (selected.size === 1) { setEditZone(zones.find(z => z.id === Array.from(selected)[0]) || null); setShowEdit(true); } }}
            disabled={selected.size !== 1}
            className="btn-aws-secondary"
            style={{ opacity: selected.size !== 1 ? 0.5 : 1 }}
          >
            Edit
          </button>
          <button
            onClick={() => setShowDelete(true)}
            disabled={selected.size === 0}
            className="btn-aws-danger"
            style={{ opacity: selected.size === 0 ? 0.5 : 1 }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Filters row */}
      <div className="aws-panel mb-4">
        <div className="px-4 py-3 border-b flex items-center space-x-3" style={{ borderColor: '#d5d9d9' }}>
          <div className="flex items-center flex-1 max-w-md">
            <div className="relative flex-1">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                className="aws-input pl-8 w-full"
                placeholder="Search hosted zones"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
          </div>
          <select
            className="aws-select"
            value={zoneType}
            onChange={e => { setZoneType(e.target.value); setPage(1); }}
          >
            <option value="">All types</option>
            <option value="Public">Public</option>
            <option value="Private">Private</option>
          </select>
          <button onClick={fetchZones} className="btn-aws-secondary">
            ↻ Refresh
          </button>
        </div>

        {/* Info strip */}
        <div className="px-4 py-2 text-xs flex items-center justify-between" style={{ backgroundColor: '#f8f8f8', color: '#545b64' }}>
          <span>
            {selected.size > 0 ? `${selected.size} selected · ` : ''}
            {total} Hosted zone{total !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="aws-pagination-btn"
              style={{ opacity: page <= 1 ? 0.4 : 1 }}
            >
              ‹ Previous
            </button>
            <span className="text-xs px-2">{page} / {Math.max(1, totalPages)}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
              className="aws-pagination-btn"
              style={{ opacity: page >= totalPages ? 0.4 : 1 }}
            >
              Next ›
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="spinner"></div>
              <span className="ml-3 text-sm text-gray-500">Loading hosted zones...</span>
            </div>
          ) : error ? (
            <div className="aws-alert-error m-4">{error}</div>
          ) : zones.length === 0 ? (
            <div className="empty-state">
              <div className="text-4xl mb-4">🌐</div>
              <div className="text-lg font-medium mb-2">No hosted zones found</div>
              <div className="text-sm mb-4">
                {search ? 'No zones match your search.' : 'Create your first hosted zone to get started.'}
              </div>
              {!search && (
                <button onClick={() => setShowCreate(true)} className="btn-aws-primary">
                  Create hosted zone
                </button>
              )}
            </div>
          ) : (
            <table className="aws-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      className="aws-checkbox"
                      checked={selected.size === zones.length && zones.length > 0}
                      onChange={toggleAll}
                    />
                  </th>
                  <th>Domain name</th>
                  <th>Type</th>
                  <th>Record count</th>
                  <th>Comment</th>
                  <th>Hosted zone ID</th>
                </tr>
              </thead>
              <tbody>
                {zones.map(zone => (
                  <tr key={zone.id} className={selected.has(zone.id) ? 'bg-blue-50' : ''}>
                    <td>
                      <input
                        type="checkbox"
                        className="aws-checkbox"
                        checked={selected.has(zone.id)}
                        onChange={() => toggleSelect(zone.id)}
                        onClick={e => e.stopPropagation()}
                      />
                    </td>
                    <td>
                      <button
                        onClick={() => handleZoneClick(zone)}
                        className="aws-link font-medium text-left"
                      >
                        {zone.name}
                      </button>
                    </td>
                    <td>
                      <span className={zone.type === 'Public' ? 'badge-public' : 'badge-private'}>
                        {zone.type}
                      </span>
                    </td>
                    <td>{zone.record_count}</td>
                    <td className="text-gray-500 text-xs max-w-xs truncate">{zone.comment || '—'}</td>
                    <td className="font-mono text-xs text-gray-500">{zone.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateZoneModal
          onClose={() => setShowCreate(false)}
          onSuccess={(zone) => {
            setShowCreate(false);
            showNotif('success', `Hosted zone "${zone.name}" created successfully`);
            fetchZones();
          }}
        />
      )}
      {showDelete && selected.size > 0 && (
        <DeleteZoneModal
          count={selected.size}
          zones={zones.filter(z => selected.has(z.id))}
          onClose={() => setShowDelete(false)}
          onConfirm={handleDelete}
        />
      )}
      {showEdit && editZone && (
        <EditZoneModal
          zone={editZone}
          onClose={() => { setShowEdit(false); setEditZone(null); }}
          onSuccess={(updated) => {
            setShowEdit(false);
            setEditZone(null);
            setSelected(new Set());
            showNotif('success', `Hosted zone updated successfully`);
            fetchZones();
          }}
        />
      )}
    </div>
  );
}
