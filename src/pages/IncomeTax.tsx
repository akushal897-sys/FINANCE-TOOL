import { useMemo, useState } from 'react';
import { NumberInput, Card, SectionTitle, Stat } from '@/components/ui';
import { formatINR } from '@/lib/format';

// FY 2025-26 (AY 2026-27)
const OLD_SLABS = [
  { upTo: 250000, rate: 0 },
  { upTo: 500000, rate: 0.05 },
  { upTo: 1000000, rate: 0.2 },
  { upTo: Infinity, rate: 0.3 },
];

const NEW_SLABS = [
  { upTo: 400000, rate: 0 },
  { upTo: 800000, rate: 0.05 },
  { upTo: 1200000, rate: 0.1 },
  { upTo: 1600000, rate: 0.15 },
  { upTo: 2000000, rate: 0.2 },
  { upTo: 2400000, rate: 0.25 },
  { upTo: Infinity, rate: 0.3 },
];

const CESS = 0.04;

function computeTax(slabs: { upTo: number; rate: number }[], income: number): number {
  let tax = 0;
  let prev = 0;
  for (const slab of slabs) {
    if (income > prev) {
      const taxableInSlab = Math.min(income, slab.upTo) - prev;
      tax += taxableInSlab * slab.rate;
      prev = slab.upTo;
    } else break;
  }
  return tax;
}

// 87A rebate with marginal relief per Finance Act 2025 (Section 87A),
// applicable to resident individuals only. Beyond the rebate threshold,
// marginal relief limits tax to the excess income over the threshold.
function rebate87A(tax: number, taxableIncome: number, regime: 'old' | 'new'): number {
  if (regime === 'new') {
    const threshold = 1200000;
    if (taxableIncome <= threshold) return Math.min(tax, 60000);
    const excessIncome = taxableIncome - threshold;
    if (tax > excessIncome) return Math.max(0, Math.min(tax, tax - excessIncome));
    return 0;
  }
  const threshold = 500000;
  if (taxableIncome <= threshold) return Math.min(tax, 12500);
  const excessIncome = taxableIncome - threshold;
  if (tax > excessIncome) return Math.max(0, Math.min(tax, tax - excessIncome));
  return 0;
}

interface RegimeResult {
  taxableIncome: number;
  taxBeforeCess: number;
  rebate: number;
  cess: number;
  totalTax: number;
  takeHome: number;
}

// 80CCD(2) employer NPS contribution is one of the few deductions still
// allowed under the new regime, so it is applied regardless of regime.
export function compute(
  grossIncome: number,
  deductions: number,
  regime: 'old' | 'new',
  employerNpsDeduction = 0
): RegimeResult {
  const slabs = regime === 'old' ? OLD_SLABS : NEW_SLABS;
  const stdDeduction = regime === 'old' ? 50000 : 75000;
  const totalDeductions =
    (regime === 'old' ? deductions : 0) + stdDeduction + employerNpsDeduction;
  const taxableIncome = Math.max(0, grossIncome - totalDeductions);
  const tax = computeTax(slabs, taxableIncome);
  const rebate = rebate87A(tax, taxableIncome, regime);
  const taxAfterRebate = Math.max(0, tax - rebate);
  const cess = taxAfterRebate * CESS;
  const totalTax = taxAfterRebate + cess;
  return {
    taxableIncome,
    taxBeforeCess: tax,
    rebate,
    cess,
    totalTax,
    takeHome: grossIncome - totalTax,
  };
}

export default function IncomeTax() {
  const [grossIncome, setGrossIncome] = useState(1200000);
  const [deduction80C, setDeduction80C] = useState(150000);
  const [deduction80D, setDeduction80D] = useState(25000);
  const [hra, setHra] = useState(0);

  const totalDeductions = deduction80C + deduction80D + hra;

  const old = useMemo(
    () => compute(grossIncome, totalDeductions, 'old'),
    [grossIncome, totalDeductions]
  );
  const neu = useMemo(() => compute(grossIncome, 0, 'new'), [grossIncome]);

  const better = old.totalTax <= neu.totalTax ? 'old' : 'new';
  const savings = Math.abs(old.totalTax - neu.totalTax);

  return (
    <div>
      <SectionTitle
        title="Income Tax Calculator"
        subtitle="Compare Old vs New Regime for FY 2025-26 (AY 2026-27)"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5 lg:col-span-1 h-fit">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Your Details</h2>
          <div className="space-y-4">
            <NumberInput
              label="Gross Annual Income"
              value={grossIncome}
              onChange={setGrossIncome}
              prefix="₹"
              max={100000000}
            />
            <NumberInput
              label="80C Deductions (PF, ELSS, LIC…)"
              value={deduction80C}
              onChange={(v) => setDeduction80C(Math.min(v, 150000))}
              prefix="₹"
              hint="Max ₹1,50,000"
            />
            <NumberInput
              label="80D Health Insurance"
              value={deduction80D}
              onChange={(v) => setDeduction80D(Math.min(v, 100000))}
              prefix="₹"
              hint="Max ₹1,00,000 (senior citizens)"
            />
            <NumberInput
              label="HRA Exemption"
              value={hra}
              onChange={setHra}
              prefix="₹"
              max={10000000}
            />
            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-3 text-sm">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Total deductions (Old regime)</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatINR(totalDeductions)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300 mt-1">
                <span>Standard deduction (New regime)</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">₹75,000</span>
              </div>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid sm:grid-cols-2 gap-4">
            <Card className={`p-5 border-2 ${better === 'old' ? 'border-emerald-400 dark:border-emerald-600' : 'border-transparent'} ${better === 'old' ? 'dark:border-emerald-600' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">Old Regime</h3>
                {better === 'old' && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                    Saves more
                  </span>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <Row label="Taxable income" value={formatINR(old.taxableIncome)} />
                <Row label="Tax before cess" value={formatINR(old.taxBeforeCess)} />
                <Row label="87A rebate" value={`- ${formatINR(old.rebate)}`} />
                <Row label="4% cess" value={formatINR(old.cess)} />
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-semibold text-base">
                  <span>Total tax</span>
                  <span className="text-rose-600 dark:text-rose-400">{formatINR(old.totalTax)}</span>
                </div>
                <div className="flex justify-between font-semibold text-emerald-700 dark:text-emerald-400">
                  <span>Take-home</span>
                  <span>{formatINR(old.takeHome)}</span>
                </div>
              </div>
            </Card>

            <Card className={`p-5 border-2 ${better === 'new' ? 'border-emerald-400 dark:border-emerald-600' : 'border-transparent'}`}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800 dark:text-slate-100">New Regime</h3>
                {better === 'new' && (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                    Saves more
                  </span>
                )}
              </div>
              <div className="space-y-2 text-sm">
                <Row label="Taxable income" value={formatINR(neu.taxableIncome)} />
                <Row label="Tax before cess" value={formatINR(neu.taxBeforeCess)} />
                <Row label="87A rebate" value={`- ${formatINR(neu.rebate)}`} />
                <Row label="4% cess" value={formatINR(neu.cess)} />
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-semibold text-base">
                  <span>Total tax</span>
                  <span className="text-rose-600 dark:text-rose-400">{formatINR(neu.totalTax)}</span>
                </div>
                <div className="flex justify-between font-semibold text-emerald-700 dark:text-emerald-400">
                  <span>Take-home</span>
                  <span>{formatINR(neu.takeHome)}</span>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-slate-500 dark:text-slate-400">Recommended regime</span>
            </div>
            <div className="text-lg font-bold text-slate-900 dark:text-white">
              {better === 'old' ? 'Old Regime' : 'New Regime'} saves you {formatINR(savings)} more
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              The New Regime does not allow 80C/80D/HRA deductions but offers lower slab rates and a ₹75,000 standard deduction.
            </p>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Slab Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-2 pr-4 font-medium">Income Slab</th>
                    <th className="py-2 pr-4 font-medium">Old Rate</th>
                    <th className="py-2 font-medium">New Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <SlabRow slab="₹0 – ₹2,50,000" old="Nil" neu="Nil (up to ₹4L)" />
                  <SlabRow slab="₹2,50,001 – ₹4,00,000" old="5%" neu="Nil" />
                  <SlabRow slab="₹4,00,001 – ₹5,00,000" old="5%" neu="5%" />
                  <SlabRow slab="₹5,00,001 – ₹8,00,000" old="20%" neu="5%" />
                  <SlabRow slab="₹8,00,001 – ₹10,00,000" old="20%" neu="10%" />
                  <SlabRow slab="₹10,00,001 – ₹12,00,000" old="30%" neu="10%" />
                  <SlabRow slab="₹12,00,001 – ₹16,00,000" old="30%" neu="15%" />
                  <SlabRow slab="₹16,00,001 – ₹20,00,000" old="30%" neu="20%" />
                  <SlabRow slab="₹20,00,001 – ₹24,00,000" old="30%" neu="25%" />
                  <SlabRow slab="Above ₹24,00,000" old="30%" neu="30%" />
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-slate-600 dark:text-slate-300">
      <span>{label}</span>
      <span className="font-medium text-slate-900 dark:text-slate-100">{value}</span>
    </div>
  );
}

function SlabRow({ slab, old, neu }: { slab: string; old: string; neu: string }) {
  return (
    <tr>
      <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">{slab}</td>
      <td className="py-2 pr-4 text-slate-600 dark:text-slate-400">{old}</td>
      <td className="py-2 text-slate-600 dark:text-slate-400">{neu}</td>
    </tr>
  );
}
