import { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { NumberInput, SliderInput, Card, SectionTitle, Stat } from '@/components/ui';
import { formatINR } from '@/lib/format';

type Mode = 'sip' | 'lumpsum';

export default function SIP() {
  const [mode, setMode] = useState<Mode>('sip');
  const [monthly, setMonthly] = useState(25000);
  const [lumpsum, setLumpsum] = useState(1000000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(15);
  const [inflationRate, setInflationRate] = useState(6);
  const [adjustInflation, setAdjustInflation] = useState(false);

  const months = years * 12;
  const i = rate / 12 / 100;

  const invested = mode === 'sip' ? monthly * months : lumpsum;

  const fv = useMemo(() => {
    if (mode === 'sip') {
      if (i === 0) return monthly * months;
      return monthly * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
    }
    return lumpsum * Math.pow(1 + rate / 100, years);
  }, [mode, monthly, lumpsum, rate, years, months, i]);

  const realFv = adjustInflation
    ? fv / Math.pow(1 + inflationRate / 100, years)
    : fv;

  const gain = fv - invested;

  const yearlyData = useMemo(() => {
    const arr: { year: number; invested: number; value: number; realValue: number }[] = [];
    for (let y = 1; y <= years; y++) {
      const m = y * 12;
      let value: number;
      let inv: number;
      if (mode === 'sip') {
        inv = monthly * m;
        value = i === 0 ? inv : monthly * ((Math.pow(1 + i, m) - 1) / i) * (1 + i);
      } else {
        inv = lumpsum;
        value = lumpsum * Math.pow(1 + rate / 100, y);
      }
      const realValue = value / Math.pow(1 + inflationRate / 100, y);
      arr.push({ year: y, invested: inv, value, realValue });
    }
    return arr;
  }, [mode, monthly, lumpsum, rate, years, i, inflationRate]);

  return (
    <div>
      <SectionTitle
        title="SIP / Mutual Fund Calculator"
        subtitle="Project your investment growth with inflation-adjusted real returns"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5 h-fit">
          <div className="flex gap-2 mb-4 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setMode('sip')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                mode === 'sip' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Monthly SIP
            </button>
            <button
              onClick={() => setMode('lumpsum')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                mode === 'lumpsum' ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              Lumpsum
            </button>
          </div>

          <div className="space-y-4">
            {mode === 'sip' ? (
              <NumberInput label="Monthly Investment" value={monthly} onChange={setMonthly} prefix="₹" max={10000000} />
            ) : (
              <NumberInput label="Lumpsum Amount" value={lumpsum} onChange={setLumpsum} prefix="₹" max={100000000} />
            )}
            <SliderInput
              label="Expected Return Rate (p.a.)"
              value={rate}
              onChange={setRate}
              min={1}
              max={30}
              step={0.1}
              format={(v) => `${v.toFixed(1)}%`}
            />
            <SliderInput
              label="Time Period"
              value={years}
              onChange={setYears}
              min={1}
              max={40}
              format={(v) => `${v} years`}
            />
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Adjust for inflation</label>
              <button
                onClick={() => setAdjustInflation(!adjustInflation)}
                className={`relative w-11 h-6 rounded-full transition ${
                  adjustInflation ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition ${
                    adjustInflation ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
            {adjustInflation && (
              <SliderInput
                label="Inflation Rate"
                value={inflationRate}
                onChange={setInflationRate}
                min={1}
                max={15}
                step={0.5}
                format={(v) => `${v.toFixed(1)}%`}
              />
            )}
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <Stat label="Amount Invested" value={formatINR(invested)} />
            <Stat label="Estimated Returns" value={formatINR(gain)} />
            <Stat
              label={adjustInflation ? 'Real Value (today)' : 'Total Value'}
              value={formatINR(adjustInflation ? realFv : fv)}
              highlight
            />
          </div>

          {adjustInflation && (
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4 text-sm text-amber-800 dark:text-amber-300">
              Inflation eats into your returns. After {years} years at {inflationRate}% inflation,
              your {formatINR(fv)} future value is worth {formatINR(realFv)} in today's money.
            </div>
          )}

          <Card className="p-5">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Year-wise Growth</h3>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={yearlyData} margin={{ left: -10, right: 8 }}>
                <defs>
                  <linearGradient id="gradValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradInvested" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-30" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} unit="Y" />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
                <Tooltip formatter={(v: number) => formatINR(v)} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="invested"
                  stroke="#94a3b8"
                  fill="url(#gradInvested)"
                  name="Invested"
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  fill="url(#gradValue)"
                  name="Value"
                />
                {adjustInflation && (
                  <Area
                    type="monotone"
                    dataKey="realValue"
                    stroke="#f59e0b"
                    fillOpacity={0}
                    strokeDasharray="5 4"
                    name="Real Value"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>
    </div>
  );
}
