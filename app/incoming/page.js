'use client';
import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import WarehouseSelector from '@/components/WarehouseSelector';
import { useWarehouse } from '@/components/WarehouseProvider';
import { useLanguage } from '@/components/LanguageProvider';

const getEmptyForm = () => ({
  product: '',
  quantity: '',
  supplier: '',
  invoiceRef: '',
  date: new Date().toISOString().split('T')[0],
  notes: '',
  unitPrice: '',
});

export default function IncomingPage() {
  const { activeWarehouse } = useWarehouse();
  const { t, lang } = useLanguage();
  const [records, setRecords] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(getEmptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ product: '', from: '', to: '' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

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
      if (filters.product) params.set('product', filters.product);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);
      const res = await fetch(`/api/incoming?${params}`);
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

  const handleSubmit = async () => {
    if (!form.product || !form.quantity || !form.date) return showToast(t.fieldsRequired, 'error');
    if (!activeWarehouse) return showToast(t.warehouseRequired, 'error');
    setSaving(true);
    try {
      const res = await fetch('/api/incoming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, quantity: +form.quantity, unitPrice: +form.unitPrice || 0, warehouse: activeWarehouse._id }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      showToast(t.incomingRegistered);
      setModalOpen(false);
      setForm(getEmptyForm());
      fetchRecords(1);
      fetchProducts();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectedProduct = products.find(p => p._id === form.product);

  const formatDate = (d) => new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  return (
    <div className="app-wrapper">
      <Sidebar />
      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="topbar-title">{t.incomingTitle}</div>
            <div className="topbar-sub">{t.incomingSub}</div>
          </div>
          <div className="topbar-spacer" />
          <WarehouseSelector />
          <button className="btn btn-success" onClick={() => setModalOpen(true)} disabled={!activeWarehouse} style={{marginLeft: 16}}>{t.recordIncoming}</button>
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
              {(filters.product || filters.from || filters.to) && (
                <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ product: '', from: '', to: '' })}>
                  {t.clearFilter}
                </button>
              )}
              <span style={{ marginRight: 'auto', color: 'var(--text-muted)', fontSize: 13 }}>
                {total} {t.records}
              </span>
            </div>

            {loading ? (
              <div className="loading-wrap"><div className="spinner" />{t.loading}</div>
            ) : records.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📥</div>
                <div className="empty-state-text">{t.noIncomingRecords}</div>
              </div>
            ) : (
              <>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>{t.incomingDate}</th>
                        <th>{t.product}</th>
                        <th>{t.quantity}</th>
                        <th>{t.supplier}</th>
                        <th>{t.invoiceRef}</th>
                        <th>{t.unitPrice}</th>
                        <th>{t.notes}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map(r => (
                        <tr key={r._id}>
                          <td>
                            <span className="badge badge-green">📅 {formatDate(r.date)}</span>
                          </td>
                          <td className="td-bold">{r.productName}</td>
                          <td>
                            <span style={{ color: 'var(--accent-green-light)', fontWeight: 700, fontSize: 15 }}>
                              +{r.quantity}
                            </span>
                            <span className="td-muted" style={{ marginRight: 4, fontSize: 12 }}>
                              {r.product?.unit || ''}
                            </span>
                          </td>
                          <td className="td-muted">{r.supplier || '—'}</td>
                          <td className="td-muted">{r.invoiceRef || '—'}</td>
                          <td className="td-muted">{r.unitPrice ? `${r.unitPrice} ${t.egp}` : '—'}</td>
                          <td className="td-muted">{r.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {pages > 1 && (
                  <div className="pagination">
                    <button className="page-btn" disabled={page <= 1} onClick={() => fetchRecords(page - 1)}>‹</button>
                    {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
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

        {/* Modal */}
        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span style={{ fontSize: 22 }}>📥</span>
                <div className="modal-title">{t.addIncomingModal}</div>
                <button className="btn btn-ghost btn-icon" onClick={() => setModalOpen(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full">
                    <label className="form-label">{t.productLabel}</label>
                    <select className="form-control" value={form.product} onChange={e => setForm({ ...form, product: e.target.value })}>
                      <option value="">{t.productPlaceholder}</option>
                      {products.map(p => (
                        <option key={p._id} value={p._id}>{p.name} — {t.currentStockInfo} {p.currentStock} {p.unit}</option>
                      ))}
                    </select>
                    {selectedProduct && (
                      <div className="alert alert-success mt-2" style={{ padding: '8px 12px', fontSize: 13 }}>
                        {t.currentStockInfo} <strong>{selectedProduct.currentStock} {selectedProduct.unit}</strong>
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.incomingQtyLabel}</label>
                    <input type="number" className="form-control" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} min="1" placeholder="0" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.receiveDateLabel}</label>
                    <input type="date" className="form-control" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.supplierLabel}</label>
                    <input className="form-control" value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} placeholder={t.supplierPlaceholder} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.invoiceRefLabel}</label>
                    <input className="form-control" value={form.invoiceRef} onChange={e => setForm({ ...form, invoiceRef: e.target.value })} placeholder="INV-001" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.unitPriceLabel}</label>
                    <input type="number" className="form-control" value={form.unitPrice} onChange={e => setForm({ ...form, unitPrice: e.target.value })} min="0" placeholder="0.00" />
                  </div>
                  <div className="form-group full">
                    <label className="form-label">{t.notesLabel}</label>
                    <textarea className="form-control" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder={t.notesPlaceholder} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>{t.cancel}</button>
                <button className="btn btn-success" onClick={handleSubmit} disabled={saving}>
                  {saving ? '...' : t.recordBtn}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div className="toast-container">
            <div className={`toast toast-${toast.type}`}>
              {toast.type === 'success' ? '✅' : '❌'} {toast.msg}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
