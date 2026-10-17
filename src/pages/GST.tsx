import { useState } from 'react';
import { NumberInput, Card, SectionTitle, Stat } from '@/components/ui';
import { formatINR, formatNumber } from '@/lib/format';

type Mode = 'add' | 'remove';

const SLABS = [5, 12, 18, 28];

export default function GST() {
  const [mode, setMode] = useState<Mode>('add');
  const [amount, setAmount] = useState(10000);
  const [rate, setRate] = useState(18);

  const result = (() => {
    if (mode === 'add') {
      const base = amount;
      const gst = (base * rate) / 100;
      const total = base + gst;
      return { base, gst, total };
    }
    const total = amount;
    const base = (total * 100) / (100 + rate);
    const gst = total - base;
    return { base, gst, total };
  })();

  const cgst = result.gst / 2;
  const sgst = result.gst / 2;

  return (
    <div>
      <SectionTitle
        title="GST Calculator"
        subtitle="Add or remove GST and split into CGST/SGST for intra-state invoices"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5 h-fit">
          <div className="flex gap-2 mb-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setMode('add')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                mode === 'add' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Add GST
            </button>
            <button
              onClick={() => setMode('remove')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                mode === 'remove' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Remove GST
            </button>
          </div>

          <div className="space-y-4">
            <NumberInput
              label={mode === 'add' ? 'Base Price (excl. GST)' : 'Total Price (incl. GST)'}
              value={amount}
              onChange={setAmount}
              prefix="₹"
              max={1000000000}
            />
            <div>
              <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">GST Rate</span>
              <div className="grid grid-cols-4 gap-2">
                {SLABS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setRate(s)}
                    className={`py-2.5 text-sm font-semibold rounded-lg border transition ${
                      rate === s
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                    }`}
                  >
                    {s}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <Stat label="Base Price" value={formatINR(result.base)} />
            <Stat label={`GST (${rate}%)`} value={formatINR(result.gst)} />
            <Stat label="Total Price" value={formatINR(result.total)} highlight />
          </div>

          <Card className="p-5">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-1">Intra-state CGST / SGST Split</h3>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
              For intra-state supplies, GST is split equally between Central GST and State GST.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-4">
                <div className="text-xs font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">CGST</div>
                <div className="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {formatINR(cgst)}
                </div>
                <div className="text-sm text-blue-500 dark:text-blue-500 mt-0.5">{formatNumber(rate / 2, 1)}% of base</div>
              </div>
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 p-4">
                <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">SGST</div>
                <div className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                  {formatINR(sgst)}
                </div>
                <div className="text-sm text-emerald-500 dark:text-emerald-500 mt-0.5">{formatNumber(rate / 2, 1)}% of base</div>
              </div>
            </div>
            <div className="mt-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-3 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex justify-between py-1">
                <span>Base price</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatINR(result.base)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>+ CGST @ {formatNumber(rate / 2, 1)}%</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatINR(cgst)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>+ SGST @ {formatNumber(rate / 2, 1)}%</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">{formatINR(sgst)}</span>
              </div>
              <div className="flex justify-between py-2 mt-1 border-t border-slate-200 dark:border-slate-700 font-bold text-slate-900 dark:text-white">
                <span>Total (incl. GST)</span>
                <span>{formatINR(result.total)}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
