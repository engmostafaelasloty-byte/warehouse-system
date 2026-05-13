'use client';
import { useState, useEffect, useCallback, memo } from 'react';
import Sidebar from '@/components/Sidebar';
import WarehouseSelector from '@/components/WarehouseSelector';
import { useWarehouse } from '@/components/WarehouseProvider';
import { useLanguage } from '@/components/LanguageProvider';

export default function DashboardPage() {
  const { activeWarehouse } = useWarehouse();
  const { t, lang } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState('');

  const fetchData = useCallback(async () => {
    if (!activeWarehouse) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?warehouse=${activeWarehouse._id}`);
      const d = await res.json();
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [activeWarehouse]);

  useEffect(() => {
    fetchData();
  }, [fetchData, activeWarehouse]);

  useEffect(() => {
    const now = new Date();
    const locale = lang === 'ar' ? 'ar-EG' : 'en-US';
    setToday(now.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
  }, [lang]);

  const formatDate = (d) => new Date(d).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });

  return (
    <div className="app-wrapper">
      <Sidebar />
      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="topbar-title">{t.dashboardTitle}</div>
            <div className="topbar-sub">{t.dashboardSub}</div>
          </div>
          <div className="topbar-spacer" />
          <WarehouseSelector />
          <div className="topbar-date" style={{marginRight: 16}}>📅 {today}</div>
        </header>

        <div className="page-content">
          {!activeWarehouse ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏢</div>
              <div className="empty-state-text">{t.selectWarehouseFirst}</div>
            </div>
          ) : loading ? (
            <div className="loading-wrap"><div className="spinner" />{t.loading}</div>
          ) : (
            <>
              {/* Stats */}
              <div className="stats-grid">
                <div className="stat-card blue">
                  <div className="stat-icon-wrap blue">📦</div>
                  <div className="stat-info">
                    <div className="stat-value text-blue">{data?.totalProducts ?? 0}</div>
                    <div className="stat-label">{t.totalProducts}</div>
                    <div className="stat-sub">{t.activeProducts}</div>
                  </div>
                </div>
                <div className="stat-card green">
                  <div className="stat-icon-wrap green">📥</div>
                  <div className="stat-info">
                    <div className="stat-value text-green">{data?.todayIncoming?.total ?? 0}</div>
                    <div className="stat-label">{t.todayIncoming}</div>
                    <div className="stat-sub">{data?.todayIncoming?.count ?? 0} {t.operations}</div>
                  </div>
                </div>
                <div className="stat-card red">
                  <div className="stat-icon-wrap red">📤</div>
                  <div className="stat-info">
                    <div className="stat-value text-red">{data?.todayOutgoing?.total ?? 0}</div>
                    <div className="stat-label">{t.todayOutgoing}</div>
                    <div className="stat-sub">{data?.todayOutgoing?.count ?? 0} {t.operations}</div>
                  </div>
                </div>
                <div className="stat-card amber">
                  <div className="stat-icon-wrap amber">⚠️</div>
                  <div className="stat-info">
                    <div className="stat-value text-amber">{data?.lowStockProducts?.length ?? 0}</div>
                    <div className="stat-label">{t.lowStock}</div>
                    <div className="stat-sub">{t.needsRefill}</div>
                  </div>
                </div>
              </div>

              {/* Low Stock Alerts */}
              {data?.lowStockProducts?.length > 0 && (
                <div className="card">
                  <div className="card-header">
                    <span>⚠️</span>
                    <div className="card-title">{t.lowStockAlerts}</div>
                  </div>
                  <div className="card-body">
                    <div className="low-stock-grid">
                      {data.lowStockProducts.map(p => (
                        <div key={p._id} className="low-stock-item">
                          <div className="low-stock-name">{p.name}</div>
                          <div className="low-stock-qty">{t.available} {p.currentStock} {p.unit}</div>
                          <div className="low-stock-min">{t.minimum} {p.minStock} {p.unit}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Chart */}
              <div className="card">
                <div className="card-header">
                  <span>📈</span>
                  <div className="card-title">{t.last7Days}</div>
                </div>
                <div className="card-body">
                  <ChartBars data={data?.monthlyData} t={t} lang={lang} />
                </div>
              </div>

              {/* Recent Transactions */}
              <div className="card">
                <div className="card-header">
                  <span>🕐</span>
                  <div className="card-title">{t.recentTransactions}</div>
                </div>
                {data?.recentTransactions?.length > 0 ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>{t.product}</th>
                          <th>{t.type}</th>
                          <th>{t.quantity}</th>
                          <th>{t.date}</th>
                          <th>{t.party}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentTransactions.map((tx, i) => (
                          <tr key={i}>
                            <td className="td-bold">{tx.productName}</td>
                            <td>
                              <span className={`badge ${tx.type === 'وارد' ? 'badge-green' : 'badge-red'}`}>
                                {tx.type === 'وارد' ? '📥' : '📤'} {tx.type === 'وارد' ? t.incomingBadge : t.outgoingBadge}
                              </span>
                            </td>
                            <td className="td-bold">{tx.quantity}</td>
                            <td className="td-muted">{formatDate(tx.date)}</td>
                            <td className="td-muted">{tx.supplier || tx.recipient || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">📋</div>
                    <div className="empty-state-text">{t.noTransactionsYet}</div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

const ChartBars = memo(function ChartBars({ data, t, lang }) {
  if (!data || data.length === 0) {
    return <div className="empty-state"><div className="empty-state-text text-muted">{t.noData}</div></div>;
  }
  const maxVal = Math.max(...data.map(d => Math.max(d.incoming, d.outgoing)), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--accent-green)', display: 'inline-block' }} />
          {t.incomingBadge}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, borderRadius: 3, background: 'var(--accent-red)', display: 'inline-block' }} />
          {t.outgoingBadge}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 160 }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end', width: '100%', justifyContent: 'center', flex: 1, alignSelf: 'flex-end' }}>
              <div
                title={`${t.incomingBadge}: ${d.incoming}`}
                style={{
                  width: '42%',
                  height: `${Math.max((d.incoming / maxVal) * 100, 4)}%`,
                  background: 'linear-gradient(180deg, var(--accent-green-light), var(--accent-green))',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.5s ease',
                  cursor: 'default',
                }}
              />
              <div
                title={`${t.outgoingBadge}: ${d.outgoing}`}
                style={{
                  width: '42%',
                  height: `${Math.max((d.outgoing / maxVal) * 100, 4)}%`,
                  background: 'linear-gradient(180deg, var(--accent-red-light), var(--accent-red))',
                  borderRadius: '4px 4px 0 0',
                  transition: 'height 0.5s ease',
                  cursor: 'default',
                }}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
              {new Date(d.date).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { month: 'numeric', day: 'numeric' })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
