'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useLanguage } from '@/components/LanguageProvider';
import { memo } from 'react';

function Sidebar() {
  const pathname = usePathname();
  const { t, lang, toggleLang, isRTL } = useLanguage();

  const navItems = [
    { href: '/', label: t.dashboard, icon: '📊', section: t.sectionMain },
    { href: '/warehouses', label: t.warehouses, icon: '🏢', section: t.sectionMain },
    { href: '/products', label: t.products, icon: '📦', section: t.sectionStore },
    { href: '/incoming', label: t.incoming, icon: '📥', section: t.sectionStore },
    { href: '/outgoing', label: t.outgoing, icon: '📤', section: t.sectionStore },
    { href: '/transactions', label: t.transactions, icon: '📋', section: t.sectionReports },
  ];

  const sections = [...new Set(navItems.map(i => i.section))];

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <span style={{ fontSize: 20 }}>🏭</span>
        </div>
        <div className="sidebar-logo-text">
          {t.systemName}
          <span>{t.systemSubtitle}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {sections.map(section => (
          <div key={section}>
            <div className="nav-section-label">{section}</div>
            {navItems.filter(i => i.section === section).map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item ${pathname === item.href ? 'active' : ''}`}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button
          className="lang-toggle-btn"
          onClick={toggleLang}
          title={lang === 'ar' ? 'Switch to English' : 'التبديل للعربية'}
        >
          <span className="lang-toggle-icon">🌐</span>
          <span className="lang-toggle-label">{lang === 'ar' ? 'English' : 'العربية'}</span>
        </button>
        <div className="sidebar-version">{t.version}</div>
      </div>
    </aside>
  );
}

export default memo(Sidebar);
