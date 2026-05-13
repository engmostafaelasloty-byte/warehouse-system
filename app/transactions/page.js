'use client';
import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import WarehouseSelector from '@/components/WarehouseSelector';
import { useWarehouse } from '@/components/WarehouseProvider';
import { useLanguage } from '@/components/LanguageProvider';

export default function TransactionsPage() {
  const { activeWarehouse } = useWarehouse();
  const { t, lang } = useLanguage();
  const [records, setRecords] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ type: '', product: '', from: '', to: '' });

  const fetchProducts = useCallback(async () => {
    if (!activeWarehouse) return;
    const res = await fetch(`/api/products?warehouse=${activeWarehouse._id}`);
    const d = await res.json();
    setProducts(Array.isArray(d) ? d : []);
  }, [activeWarehouse]);

  const fetchRecords = useCallback(async (pg = 1) => {
    if (!activeWarehouse) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: pg, limit: 20, warehouse: activeWarehouse._id });
      if (filters.type) params.set('type', filters.type);
      if (filters.product) params.set('product', filters.product);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      const res = await fetch(`/api/transactions?${params}`);
      const d = await res.json();
      setRecords(d.records || []);
      setPages(d.pages || 1);
      setTotal(d.total || 0);
      setPage(pg);
    } finally {
      setLoading(false);
    }
  }, [filters, activeWarehouse]);

  useEffect(() => { fetchProducts(); }, [fetchProducts, activeWarehouse]);
  useEffect(() => { fetchRecords(1); }, [filters, fetchRecords, activeWarehouse]);

  const formatDate = (d) => new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const exportCSV = () => {
    const headers = t.csvHeaders;
    const rows = records.map(r => [
      r.type,
      new Date(r.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US'),
      r.productName,
      r.quantity,
      r.supplier || r.recipient || '',
      r.invoiceRef || r.reference || '',
      r.notes || ''
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${t.csvFilename}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasFilter = filters.type || filters.product || filters.from || filters.to;

  return (
    <div className="app-wrapper">
      <Sidebar />
      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="topbar-title">{t.transactionsTitle}</div>
            <div className="topbar-sub">{t.transactionsSub}</div>
          </div>
          <div className="topbar-spacer" />
          <WarehouseSelector />
          <button className="btn btn-ghost" onClick={exportCSV} disabled={records.length === 0 || !activeWarehouse} style={{marginLeft: 16}}>
            {t.exportCSV}
          </button>
        </header>

        <div className="page-content">
          {!activeWarehouse ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏢</div>
              <div className="empty-state-text">{t.selectWarehouseFirst}</div>
            </div>
          ) : (
            <div className="card">
            {/* Filters */}
            <div className="filter-bar">
              <select
                className="form-control"
                value={filters.type}
                onChange={e => setFilters({ ...filters, type: e.target.value })}
              >
                <option value="">{t.allMovements}</option>
                <option value="incoming">{t.incomingOnly}</option>
                <option value="outgoing">{t.outgoingOnly}</option>
              </select>
              <select
                className="form-control"
                value={filters.product}
                onChange={e => setFilters({ ...filters, product: e.target.value })}
              >
                <option value="">{t.allProducts}</option>
                {products.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
              </select>
              <input
                type="date"
                className="form-control"
                value={filters.from}
                onChange={e => setFilters({ ...filters, from: e.target.value })}
                title={lang === 'ar' ? 'من تاريخ' : 'From date'}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{t.to}</span>
              <input
                type="date"
                className="form-control"
                value={filters.to}
                onChange={e => setFilters({ ...filters, to: e.target.value })}
                title={lang === 'ar' ? 'إلى تاريخ' : 'To date'}
              />
              {hasFilter && (
                <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ type: '', product: '', from: '', to: '' })}>
                  {t.clear}
                </button>
              )}
              <span style={{ marginRight: 'auto', color: 'var(--text-muted)', fontSize: 13 }}>
                {t.total}: <strong style={{ color: 'var(--text-primary)' }}>{total}</strong> {t.totalMovements}
              </span>
            </div>

            {/* Summary badges */}
            {!loading && records.length > 0 && (
              <div style={{ display: 'flex', gap: 12, padding: '12px 22px', borderBottom: '1px solid var(--border-color)' }}>
                <span className="badge badge-green">
                  {t.incomingSum} {records.filter(r => r.type === 'وارد').reduce((s, r) => s + r.quantity, 0)}
                </span>
                <span className="badge badge-red">
                  {t.outgoingSum} {records.filter(r => r.type === 'صادر').reduce((s, r) => s + r.quantity, 0)}
                </span>
              </div>
            )}

            {loading ? (
              <div className="loading-wrap"><div className="spinner" />{t.loading}</div>
            ) : records.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text">
                  {hasFilter ? t.noFilterResults : t.noMovementsYet}
                </div>
              </div>
            ) : (
              <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>{t.type}</th>
                        <th>{t.date}</th>
                        <th>{t.product}</th>
                        <th>{t.quantity}</th>
                        <th>{t.party}</th>
                        <th>{t.reference}</th>
                        <th>{t.notes}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r, i) => (
                        <tr key={r._id || i}>
                          <td>
                            <span className={`badge ${r.type === 'وارد' ? 'badge-green' : 'badge-red'}`}>
                              {r.type === 'وارد' ? '📥' : '📤'} {r.type === 'وارد' ? t.incomingBadge : t.outgoingBadge}
                            </span>
                          </td>
                          <td className="td-muted" style={{ fontSize: 13 }}>{formatDate(r.date)}</td>
                          <td className="td-bold">{r.productName}</td>
                          <td>
                            <span style={{
                              color: r.type === 'وارد' ? 'var(--accent-green-light)' : 'var(--accent-red-light)',
                              fontWeight: 700
                            }}>
                              {r.type === 'وارد' ? '+' : '-'}{r.quantity}
                            </span>
                            <span className="td-muted" style={{ marginRight: 4, fontSize: 12 }}>
                              {r.product?.unit || ''}
                            </span>
                          </td>
                          <td className="td-muted">{r.supplier || r.recipient || '—'}</td>
                          <td className="td-muted">{r.invoiceRef || r.reference || '—'}</td>
                          <td className="td-muted" style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {pages > 1 && (
                  <div className="pagination">
                    <button className="page-btn" disabled={page <= 1} onClick={() => fetchRecords(page - 1)}>‹</button>
                    {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                      const p = page <= 4 ? i + 1 : page - 3 + i;
                      return p <= pages ? p : null;
                    }).filter(Boolean).map(p => (
                      <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => fetchRecords(p)}>{p}</button>
                    ))}
                    <button className="page-btn" disabled={page >= pages} onClick={() => fetchRecords(page + 1)}>›</button>
                  </div>
                )}
              </>
            )}
          </div>
          )}
        </div>
      </main>
    </div>
  );
}
