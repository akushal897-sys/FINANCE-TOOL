import { NavLink, Outlet } from 'react-router-dom';
import { Calculator, Landmark, TrendingUp, Receipt, Wallet, Home, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/useTheme';

function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/919286835142"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#1ebe57] shadow-lg flex items-center justify-center transition-transform hover:scale-110"
    >
      <svg viewBox="0 0 24 24" className="w-7 h-7 fill-white" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    </a>
  );
}

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/income-tax', label: 'Income Tax', icon: Landmark },
  { to: '/emi', label: 'EMI / Loan', icon: Calculator },
  { to: '/sip', label: 'SIP / MF', icon: TrendingUp },
  { to: '/gst', label: 'GST', icon: Receipt },
  { to: '/salary', label: 'Salary / CTC', icon: Wallet },
];

export default function Layout() {
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <NavLink to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-emerald-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">₹</span>
              </div>
              <div className="leading-tight">
                <div className="font-bold text-slate-900 dark:text-white">India Finance Tools</div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 -mt-0.5">FY 2025-26 · AY 2026-27</div>
              </div>
            </NavLink>
            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="p-2 rounded-lg text-slate-500 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
        <nav className="border-t border-slate-100 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-2 sm:px-6 flex gap-1 overflow-x-auto no-scrollbar">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 px-3.5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${
                    isActive
                      ? 'border-blue-600 text-blue-700 dark:text-blue-400'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4" />
                {label}
              </NavLink>
            ))}
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                For estimation purposes only. Consult a CA for actual filing.
              </p>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                Figures based on FY 2025-26 (Assessment Year 2026-27) rules.
              </p>
            </div>
            <div className="text-sm">
              <div className="font-semibold text-slate-700 dark:text-slate-200">Kushal Agarwal</div>
              <div className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                <a href="tel:9286835142" className="hover:text-blue-600 dark:hover:text-blue-400">9286835142</a>
                <span className="mx-1.5">·</span>
                <a href="mailto:kush29681@gmail.com" className="hover:text-blue-600 dark:hover:text-blue-400">kush29681@gmail.com</a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <WhatsAppFloat />
    </div>
  );
}
