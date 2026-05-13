'use client';
import { useWarehouse } from '@/components/WarehouseProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { memo } from 'react';

const WarehouseSelector = memo(function WarehouseSelector() {
  const { warehouses, activeWarehouse, selectWarehouse, loading } = useWarehouse();
  const { t } = useLanguage();

  if (loading) return <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t.loadingWarehouses}</div>;

  if (warehouses.length === 0) {
    return (
      <div style={{ fontSize: 13, color: 'var(--accent-amber-light)', background: 'rgba(245,158,11,0.1)', padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(245,158,11,0.2)' }}>
        {t.noWarehouseRegistered}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{t.activeWarehouse}</span>
      <select
        className="form-control"
        style={{ width: 200, padding: '6px 10px', fontSize: 14, fontWeight: 600, background: 'var(--bg-card)', border: '1px solid var(--accent-blue-light)' }}
        value={activeWarehouse?._id || ''}
        onChange={(e) => selectWarehouse(e.target.value)}
      >
        {warehouses.map(w => (
          <option key={w._id} value={w._id}>{w.name}</option>
        ))}
      </select>
    </div>
  );
});

export default WarehouseSelector;
