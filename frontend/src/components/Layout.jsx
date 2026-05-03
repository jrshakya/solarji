import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function Layout({ children, module }) {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const onChange = () => { if (mq.matches) setMenuOpen(false); };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f5f6f8', position:'relative' }}>

      {/* Mobile header */}
      <header
        className="lg:hidden fixed top-0 left-0 right-0 z-[60] flex items-center justify-between gap-2 px-3 py-2.5 bg-[#111111] border-b border-white/[0.08] shadow-[0_4px_24px_rgba(0,0,0,.35)]"
        style={{ paddingTop:'max(0.625rem, env(safe-area-inset-top))' }}
      >
        <button
          type="button"
          aria-label="Open menu"
          onClick={() => setMenuOpen(true)}
          className="flex items-center justify-center p-2.5 rounded-xl bg-white/[0.08] text-white border border-white/[0.12] active:scale-[0.97]"
        >
          <Menu size={22} strokeWidth={2.25} />
        </button>
        <span className="font-extrabold text-[0.95rem] text-white tracking-tight truncate capitalize">
          SolarJi · {module}
        </span>
        <span className="w-10 shrink-0" aria-hidden />
      </header>

      {/* Dim overlay */}
      {menuOpen && (
        <button
          type="button"
          aria-label="Close menu"
          className="lg:hidden fixed inset-0 z-[70] bg-black/55 border-0 p-0 cursor-pointer"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Sidebar drawer (mobile) / column (desktop) */}
      <div
        className={`
          fixed lg:static z-[80] lg:z-auto inset-y-0 left-0 h-full
          transition-transform duration-200 ease-out
          ${menuOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
      >
        <Sidebar
          module={module}
          onNavigate={() => setMenuOpen(false)}
          onCloseMobile={() => setMenuOpen(false)}
        />
      </div>

      <main
        className="flex-1 overflow-y-auto min-w-0 w-full max-w-[100vw] pt-14 lg:pt-0"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {children}
      </main>
    </div>
  );
}
