'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { zonesApi, recordsApi, HostedZone, DNSRecord } from '@/lib/api';
import CreateRecordModal from '@/components/CreateRecordModal';
import EditRecordModal from '@/components/EditRecordModal';
import DeleteRecordModal from '@/components/DeleteRecordModal';

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'SOA', 'PTR', 'SRV', 'CAA'];

export default function ZoneDetailPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const zoneId = params.zoneId as string;

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [records, setRecords] = useState<DNSRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [recordType, setRecordType] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [editRecord, setEditRecord] = useState<DNSRecord | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user && zoneId) {
      zonesApi.get(zoneId).then(setZone).catch(() => router.push('/route53/hosted-zones'));
    }
  }, [user, zoneId]);

  const fetchRecords = useCallback(async () => {
    if (!user || !zoneId) return;
    setLoading(true);
    setError('');
    try {
      const data = await recordsApi.list(zoneId, {
        page, page_size: pageSize,
        search: search || undefined,
        record_type: recordType || undefined
      });
      setRecords(data.records);
      setTotal(data.total);
    } catch (e: any) {
      setError(e.message || 'Failed to load records');
    } finally {
      setLoading(false);
    }
  }, [user, zoneId, page, search, recordType]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);

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
    if (selected.size === selectableRecords.length) setSelected(new Set());
    else setSelected(new Set(selectableRecords.map(r => r.id)));
  };

  const handleDelete = async () => {
    try {
      await Promise.all(Array.from(selected).map(id => recordsApi.delete(zoneId, id)));
      setSelected(new Set());
      setShowDelete(false);
      showNotif('success', `${selected.size} record(s) deleted successfully`);
      fetchRecords();
    } catch (e: any) {
      showNotif('error', e.message || 'Delete failed');
    }
  };

  const formatValue = (value: string) => {
    try {
      const arr = JSON.parse(value);
      if (Array.isArray(arr)) return arr.join(', ');
    } catch {}
    return value;
  };

  const totalPages = Math.ceil(total / pageSize);
  const selectableRecords = records.filter(record => record.type !== 'SOA');

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="aws-breadcrumb mb-4 flex items-center space-x-1">
        <Link href="/route53" className="aws-link">Route 53</Link>
        <span>&rsaquo;</span>
        <Link href="/route53/hosted-zones" className="aws-link">Hosted zones</Link>
        <span>&rsaquo;</span>
        <span>{zone?.name || zoneId}</span>
      </nav>

      {/* Notification */}
      {notification && (
        <div className={`mb-4 ${notification.type === 'success' ? 'aws-alert-success' : 'aws-alert-error'}`}>
          <span>{notification.msg}</span>
          <button onClick={() => setNotification(null)} className="ml-auto text-lg leading-none">&times;</button>
        </div>
      )}

      {/* Zone header */}
      {zone && (
        <div className="aws-panel p-4 mb-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-medium mb-1">{zone.name}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>
                  Type: <span className={`ml-1 ${zone.type === 'Public' ? 'badge-public' : 'badge-private'}`}>{zone.type}</span>
                </span>
                <span>Records: <strong>{total}</strong></span>
                <span className="font-mono text-xs">ID: {zone.id}</span>
              </div>
              {zone.comment && <div className="mt-1 text-xs text-gray-400">{zone.comment}</div>}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowCreate(true)}
                className="btn-aws-primary"
              >
                Create record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Records table panel */}
      <div className="aws-panel">
        {/* Toolbar */}
        <div className="px-4 py-3 border-b flex items-center space-x-3 flex-wrap gap-y-2" style={{ borderColor: '#d5d9d9' }}>
          <div className="text-sm font-medium" style={{ color: '#16191f' }}>Records</div>
          <div className="flex-1"></div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">🔍</span>
              <input
                type="text"
                className="aws-input pl-7 text-xs"
                style={{ width: 200 }}
                placeholder="Search records"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <select
              className="aws-select text-xs"
              value={recordType}
              onChange={e => { setRecordType(e.target.value); setPage(1); }}
            >
              <option value="">All types</option>
              {RECORD_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={fetchRecords} className="btn-aws-secondary text-xs">↻</button>
          </div>

          <button
            onClick={() => {
              if (selected.size === 1) {
                setEditRecord(records.find(r => r.id === Array.from(selected)[0]) || null);
                setShowEdit(true);
              }
            }}
            disabled={selected.size !== 1}
            className="btn-aws-secondary text-xs"
            style={{ opacity: selected.size !== 1 ? 0.5 : 1 }}
          >
            Edit record
          </button>
          <button
            onClick={() => setShowDelete(true)}
            disabled={selected.size === 0}
            className="btn-aws-danger text-xs"
            style={{ opacity: selected.size === 0 ? 0.5 : 1 }}
          >
            Delete record{selected.size > 1 ? 's' : ''}
          </button>
        </div>

        {/* Pagination strip */}
        <div className="px-4 py-1.5 text-xs flex items-center justify-between" style={{ backgroundColor: '#f8f8f8', borderBottom: '1px solid #eaeded', color: '#545b64' }}>
          <span>
            {selected.size > 0 ? `${selected.size} selected · ` : ''}
            {total} record{total !== 1 ? 's' : ''}
          </span>
          <div className="flex items-center space-x-1">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="aws-pagination-btn" style={{ padding: '1px 8px', fontSize: 11, opacity: page <= 1 ? 0.4 : 1 }}>
              ‹
            </button>
            <span className="px-2">{page} / {Math.max(1, totalPages)}</span>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
              className="aws-pagination-btn" style={{ padding: '1px 8px', fontSize: 11, opacity: page >= totalPages ? 0.4 : 1 }}>
              ›
            </button>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="spinner"></div>
            <span className="ml-3 text-sm text-gray-500">Loading records...</span>
          </div>
        ) : error ? (
          <div className="aws-alert-error m-4">{error}</div>
        ) : records.length === 0 ? (
          <div className="empty-state">
            <div className="text-4xl mb-4">📋</div>
            <div className="text-lg font-medium mb-2">No records found</div>
            {!search && !recordType && (
              <button onClick={() => setShowCreate(true)} className="btn-aws-primary">Create record</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="aws-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input type="checkbox" className="aws-checkbox"
                      checked={selectableRecords.length > 0 && selectableRecords.every(record => selected.has(record.id))}
                      disabled={selectableRecords.length === 0}
                      onChange={toggleAll}
                    />
                  </th>
                  <th>Record name</th>
                  <th>Type</th>
                  <th>Routing policy</th>
                  <th>Alias</th>
                  <th>TTL (seconds)</th>
                  <th>Value/Route traffic to</th>
                </tr>
              </thead>
              <tbody>
                {records.map(record => (
                  <tr key={record.id} className={selected.has(record.id) ? 'bg-blue-50' : ''}>
                    <td>
                      <input type="checkbox" className="aws-checkbox"
                        checked={selected.has(record.id)}
                        disabled={record.type === 'SOA'}
                        onChange={() => toggleSelect(record.id)}
                      />
                    </td>
                    <td>
                      <button
                        onClick={() => { setEditRecord(record); setSelected(new Set([record.id])); setShowEdit(true); }}
                        disabled={record.type === 'SOA'}
                        title={record.type === 'SOA' ? 'The default SOA record cannot be edited' : undefined}
                        className="aws-link font-medium text-left"
                      >
                        {record.name}
                      </button>
                    </td>
                    <td>
                      <span className="inline-flex items-center px-2 py-0.5 text-xs rounded font-mono"
                        style={{ backgroundColor: '#f2f3f3', color: '#16191f', border: '1px solid #d5d9d9' }}>
                        {record.type}
                      </span>
                    </td>
                    <td className="text-sm">{record.routing_policy}</td>
                    <td className="text-sm">{record.alias ? 'Yes' : 'No'}</td>
                    <td className="text-sm">{record.alias ? '—' : record.ttl}</td>
                    <td className="text-sm text-gray-600 max-w-xs truncate font-mono text-xs">
                      {formatValue(record.value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && zone && (
        <CreateRecordModal
          zone={zone}
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            setShowCreate(false);
            showNotif('success', 'Record created successfully');
            fetchRecords();
          }}
        />
      )}
      {showEdit && editRecord && zone && (
        <EditRecordModal
          zone={zone}
          record={editRecord}
          onClose={() => { setShowEdit(false); setEditRecord(null); setSelected(new Set()); }}
          onSuccess={() => {
            setShowEdit(false);
            setEditRecord(null);
            setSelected(new Set());
            showNotif('success', 'Record updated successfully');
            fetchRecords();
          }}
        />
      )}
      {showDelete && (
        <DeleteRecordModal
          count={selected.size}
          onClose={() => setShowDelete(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
