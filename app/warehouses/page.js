'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { useWarehouse } from '@/components/WarehouseProvider';
import { useLanguage } from '@/components/LanguageProvider';

const EMPTY_FORM = { name: '', description: '' };

export default function WarehousesPage() {
  const router = useRouter();
  const { warehouses, fetchWarehouses, selectWarehouse } = useWarehouse();
  const { t, lang } = useLanguage();
  const [modalOpen, setModalOpen] = useState(false);
  const [editWarehouse, setEditWarehouse] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const openAdd = () => { setEditWarehouse(null); setForm(EMPTY_FORM); setModalOpen(true); };
  const openEdit = (w) => { setEditWarehouse(w); setForm({ name: w.name, description: w.description || '' }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name) return showToast(t.warehouseNameRequired, 'error');
    setSaving(true);
    try {
      const url = editWarehouse ? `/api/warehouses/${editWarehouse._id}` : '/api/warehouses';
      const method = editWarehouse ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      showToast(editWarehouse ? t.warehouseEdited : t.warehouseAdded);
      setModalOpen(false);
      fetchWarehouses();
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`/api/warehouses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(t.deleteFailed);
      showToast(t.warehouseDeleted);
      setDeleteConfirm(null);
      fetchWarehouses();
    } catch (e) {
      showToast(e.message, 'error');
    }
  };

  return (
    <div className="app-wrapper">
      <Sidebar />
      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="topbar-title">{t.warehousesTitle}</div>
            <div className="topbar-sub">{t.warehousesSub}</div>
          </div>
          <div className="topbar-spacer" />
          <button className="btn btn-primary" onClick={openAdd}>{t.addWarehouse}</button>
        </header>

        <div className="page-content">
          <div className="card">
            {warehouses.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🏢</div>
                <div className="empty-state-text">{t.noWarehousesYet}</div>
              </div>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>{t.serial}</th>
                      <th>{t.warehouseName}</th>
                      <th>{t.warehouseDescription}</th>
                      <th>{t.addedDate}</th>
                      <th>{t.actions}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouses.map((w, i) => (
                      <tr key={w._id}>
                        <td className="td-muted">{i + 1}</td>
                        <td className="td-bold" style={{ fontSize: 16 }}>{w.name}</td>
                        <td className="td-muted">{w.description || '—'}</td>
                        <td className="td-muted">{new Date(w.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US')}</td>
                        <td>
                          <div className="flex gap-2">
                            <button className="btn btn-primary btn-sm" onClick={() => {
                              selectWarehouse(w._id);
                              router.push('/products');
                            }}>{t.contents}</button>
                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(w)}>{t.editWarehouse}</button>
                            <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(w)}>🗑️</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Add/Edit Modal */}
        {modalOpen && (
          <div className="modal-overlay" onClick={() => setModalOpen(false)}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <span style={{ fontSize: 20 }}>{editWarehouse ? '✏️' : '🏢'}</span>
                <div className="modal-title">{editWarehouse ? t.editWarehouseModal : t.addWarehouseModal}</div>
                <button className="btn btn-ghost btn-icon" onClick={() => setModalOpen(false)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group full">
                    <label className="form-label">{t.warehouseNameLabel}</label>
                    <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t.warehouseNamePlaceholder} />
                  </div>
                  <div className="form-group full">
                    <label className="form-label">{t.descriptionLabel}</label>
                    <textarea className="form-control" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder={t.descriptionPlaceholder} />
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setModalOpen(false)}>{t.cancel}</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? '...' : (editWarehouse ? t.saveChanges : t.addWarehouseBtn)}
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
                  {t.deleteWarehouseConfirm} <strong style={{ color: 'var(--text-primary)' }}>{deleteConfirm.name}</strong>؟
                  <br /><span style={{ fontSize: 13, color: 'var(--accent-red-light)' }}>{t.deleteWarehouseWarning}</span>
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
