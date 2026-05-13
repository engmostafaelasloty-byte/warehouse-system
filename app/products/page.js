'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from '@/components/Sidebar';
import WarehouseSelector from '@/components/WarehouseSelector';
import { useWarehouse } from '@/components/WarehouseProvider';
import { useLanguage } from '@/components/LanguageProvider';

const UNITS_AR = ['قطعة', 'كرتون', 'كيلو', 'لتر', 'متر', 'صندوق', 'طرد', 'رول', 'دزينة'];
const UNITS_EN = ['Piece', 'Carton', 'Kg', 'Liter', 'Meter', 'Box', 'Package', 'Roll', 'Dozen'];
const CATEGORIES_AR = ['أجهزة كهربائية', 'أثاث', 'مواد غذائية', 'مواد تنظيف', 'أدوات', 'معدات', 'مواد خام', 'قطع غيار', 'مستلزمات مكتبية', 'أخرى'];
const CATEGORIES_EN = ['Electronics', 'Furniture', 'Food & Beverage', 'Cleaning Supplies', 'Tools', 'Equipment', 'Raw Materials', 'Spare Parts', 'Office Supplies', 'Other'];

const EMPTY_FORM = (lang) => ({ name: '', category: '', unit: lang === 'ar' ? 'قطعة' : 'Piece', currentStock: '', minStock: '', description: '' });

export default function ProductsPage() {
  const { activeWarehouse } = useWarehouse();
  const { t, lang } = useLanguage();
  const UNITS = lang === 'ar' ? UNITS_AR : UNITS_EN;
  const CATEGORIES = lang === 'ar' ? CATEGORIES_AR : CATEGORIES_EN;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(() => EMPTY_FORM(lang));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchProducts = useCallback(async () => {
    if (!activeWarehouse) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products?warehouse=${activeWarehouse._id}`);
      const d = await res.json();
      setProducts(Array.isArray(d) ? d : []);
    } finally {
      setLoading(false);
    }
  }, [activeWarehouse]);

  useEffect(() => { fetchProducts(); }, [fetchProducts, activeWarehouse]);

  const openAdd = () => { setEditProduct(null); setForm(EMPTY_FORM(lang)); setModalOpen(true); };
  const openEdit = (p) => { setEditProduct(p); setForm({ name: p.name, category: p.category, unit: p.unit, currentStock: p.currentStock, minStock: p.minStock, description: p.description || '' }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.category) return showToast(t.fieldsRequired, 'error');
    setSaving(true);
    try {
      const url = editProduct ? `/api/products/${editProduct._id}` : '/api/products';
      const method = editProduct ? 'PUT' : 'POST';
      const cleanForm = { ...form, currentStock: form.currentStock === '' ? 0 : form.currentStock, minStock: form.minStock === '' ? 0 : form.minStock };
      const payload = editProduct ? cleanForm : { ...cleanForm, warehouse: activeWarehouse._id };
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      showToast(editProduct ? t.productEdited : t.productAdded);
      setModalOpen(false);
      fetchProducts();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(t.deleteFailed);
      showToast(t.productDeleted);
      setDeleteConfirm(null);
      fetchProducts();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  const filtered = useMemo(() => {
    const s = search.toLowerCase();
    return products.filter(p =>
      p.name.toLowerCase().includes(s) ||
      p.category.toLowerCase().includes(s)
    );
  }, [products, search]);

  const stockPercent = (p) => p.minStock > 0 ? Math.min((p.currentStock / (p.minStock * 3)) * 100, 100) : 100;
  const stockColor = (p) => {
    if (p.currentStock <= 0) return 'var(--accent-red)';
    if (p.currentStock <= p.minStock) return 'var(--accent-amber)';
    return 'var(--accent-green)';
  };

  return (
    <div className="app-wrapper">
      <Sidebar />
      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="topbar-title">{t.productsTitle}</div>
            <div className="topbar-sub">{t.productsSub}</div>
          </div>
          <div className="topbar-spacer" />
          <WarehouseSelector />
          <button className="btn btn-primary" onClick={openAdd} disabled={!activeWarehouse} style={{marginLeft: 16}}>{t.addProduct}</button>
        </header>

        <div className="page-content">
          {!activeWarehouse ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏢</div>
              <div className="empty-state-text">{t.selectWarehouseFirst}</div>
            </div>
          ) : (
            <div className="card">
            <div className="filter-bar">
              <input
                className="form-control"
                placeholder={t.searchProductPlaceholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ maxWidth: 280 }}
              />
              <span style={{ color: 'var(--text-muted)', fontSize: 13, marginRight: 'auto' }}>
                {filtered.length} {t.productCount}
              </span>
            </div>

            {loading ? (
              <div className="loading-wrap"><div className="spinner" />{t.loading}</div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📦</div>
                <div className="empty-state-text">{t.noProducts}</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>{t.serial}</th>
                      <th>{t.productName}</th>
                      <th>{t.category}</th>
                      <th>{t.description}</th>
                      <th>{t.unit}</th>
                      <th>{t.currentStock}</th>
                      <th>{t.stockLevel}</th>
                      <th>{t.minStock}</th>
                      <th>{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p, i) => (
                      <tr key={p._id}>
                        <td className="td-muted">{i + 1}</td>
                        <td className="td-bold">{p.name}</td>
                        <td><span className="badge badge-blue">{p.category}</span></td>
                        <td className="td-muted" style={{ maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={p.description}>{p.description || '—'}</td>
                        <td className="td-muted">{p.unit}</td>
                        <td>
                          <span style={{ color: stockColor(p), fontWeight: 700, fontSize: 15 }}>
                            {p.currentStock}
                          </span>
                        </td>
                        <td style={{ minWidth: 120 }}>
                          <div className="stock-bar-wrap">
                            <div className="stock-bar-bg">
                              <div className="stock-bar-fill" style={{ width: `${stockPercent(p)}%`, background: stockColor(p) }} />
                            </div>
                            {p.currentStock <= p.minStock && p.currentStock > 0 && (
                              <span style={{ fontSize: 14 }}>⚠️</span>
                            )}
                            {p.currentStock <= 0 && (
                              <span style={{ fontSize: 14 }}>🔴</span>
                            )}
                          </div>
                        </td>
                        <td className="td-muted">{p.minStock}</td>
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>✏️ {t.edit}</button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(p)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          )}
        </div>

        {/* Add/Edit Modal */}
        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span style={{ fontSize: 20 }}>{editProduct ? '✏️' : '➕'}</span>
                <div className="modal-title">{editProduct ? t.editProductModal : t.addProductModal}</div>
                <button className="btn btn-ghost btn-icon" onClick={() => setModalOpen(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">{t.productNameLabel}</label>
                    <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t.productNamePlaceholder} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.categoryLabel}</label>
                    <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                      <option value="">{t.categoryPlaceholder}</option>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.unitLabel}</label>
                    <select className="form-control" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}>
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.currentStockLabel}</label>
                    <input type="number" className="form-control" value={form.currentStock} onChange={e => setForm({ ...form, currentStock: e.target.value === '' ? '' : +e.target.value })} min="0" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t.minStockLabel}</label>
                    <input type="number" className="form-control" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value === '' ? '' : +e.target.value })} min="0" />
                  </div>
                  <div className="form-group full">
                    <label className="form-label">{t.productDescLabel}</label>
                    <textarea className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder={t.productDescPlaceholder} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>{t.cancel}</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? '...' : (editProduct ? t.saveChanges : t.addProduct)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirm Modal */}
        {deleteConfirm && (
          <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
            <div className="modal-box" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span style={{ fontSize: 20 }}>⚠️</span>
                <div className="modal-title">{t.confirmDelete}</div>
              </div>
              <div className="modal-body">
                <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
                  {t.deleteProductConfirm} <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm.name}</strong>?
                  <br /><span style={{ fontSize: 13 }}>{t.productDeleteNote}</span>
                </p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setDeleteConfirm(null)}>{t.cancel}</button>
                <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm._id)}>{t.confirmDelete}</button>
              </div>
            </div>
          </div>
        )}

        {/* Toast */}
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
