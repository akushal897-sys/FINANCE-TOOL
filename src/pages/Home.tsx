import { Link } from 'react-router-dom';
import { Landmark, Calculator, TrendingUp, Receipt, Wallet, ArrowRight, MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui';

const tools = [
  {
    to: '/income-tax',
    title: 'Income Tax',
    desc: 'Compare Old vs New regime and find which saves you more.',
    icon: Landmark,
    color: 'from-blue-500 to-blue-600',
  },
  {
    to: '/emi',
    title: 'EMI / Loan',
    desc: 'Calculate monthly EMI with a full amortization schedule.',
    icon: Calculator,
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    to: '/sip',
    title: 'SIP / Mutual Fund',
    desc: 'Project SIP or lumpsum growth with inflation-adjusted returns.',
    icon: TrendingUp,
    color: 'from-amber-500 to-amber-600',
  },
  {
    to: '/gst',
    title: 'GST',
    desc: 'Add or remove GST and split into CGST/SGST components.',
    icon: Receipt,
    color: 'from-rose-500 to-rose-600',
  },
  {
    to: '/salary',
    title: 'Salary / CTC',
    desc: 'Break down your CTC into components and estimate in-hand pay.',
    icon: Wallet,
    color: 'from-violet-500 to-violet-600',
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero section with photo */}
      <section className="mb-10">
        <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
          <div className="flex-shrink-0">
            <div className="w-40 h-52 sm:w-48 sm:h-64 rounded-2xl overflow-hidden shadow-xl ring-2 ring-slate-200 dark:ring-slate-700">
              <img
                src="/file_0000000059748211b47073ff8095c786 copy copy.png"
                alt="Kushal Agarwal"
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>
          <div className="max-w-2xl text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
              India Finance Tools
            </h1>
            <p className="mt-3 text-slate-600 dark:text-slate-400 text-base sm:text-lg">
              Free, accurate calculators for income tax, loans, investments, GST and salary —
              built for FY 2025-26 (Assessment Year 2026-27).
            </p>
            <div className="mt-4">
              <p className="font-semibold text-slate-800 dark:text-slate-200">Kushal Agarwal</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Finance Expert · CA Consultant</p>
              <div className="mt-3 flex flex-wrap gap-3 justify-center sm:justify-start">
                <a
                  href="https://wa.me/919286835142"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] hover:bg-[#1ebe57] text-white text-sm font-medium transition-colors shadow-sm"
                >
                  <WhatsAppIcon />
                  Chat on WhatsApp
                </a>
                <a
                  href="tel:9286835142"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-medium transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  9286835142
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {tools.map(({ to, title, desc, icon: Icon, color }) => (
          <Link key={to} to={to}>
            <Card className="p-5 h-full hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition group cursor-pointer">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-4`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5">
                {title}
                <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 group-hover:translate-x-0.5 transition" />
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
