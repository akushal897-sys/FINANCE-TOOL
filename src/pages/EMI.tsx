import { useMemo, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { NumberInput, SliderInput, Card, SectionTitle, Stat } from '@/components/ui';
import { formatINR } from '@/lib/format';

type Preset = 'home' | 'car' | 'personal';

const presets: Record<Preset, { rate: number; tenure: number; label: string; amount: number }> = {
  home: { label: 'Home Loan', rate: 8.5, tenure: 20, amount: 5000000 },
  car: { label: 'Car Loan', rate: 9.5, tenure: 7, amount: 800000 },
  personal: { label: 'Personal Loan', rate: 12, tenure: 5, amount: 500000 },
};

function computeEMI(P: number, annualRate: number, months: number) {
  const r = annualRate / 12 / 100;
  if (r === 0) return P / months;
  const factor = Math.pow(1 + r, months);
  return (P * r * factor) / (factor - 1);
}

interface Row {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  balance: number;
}

export default function EMI() {
  const [amount, setAmount] = useState(5000000);
  const [rate, setRate] = useState(8.5);
  const [tenure, setTenure] = useState(20); // years
  const [activePreset, setActivePreset] = useState<Preset>('home');

  const months = tenure * 12;
  const emi = computeEMI(amount, rate, months);

  const schedule = useMemo<Row[]>(() => {
    const r = rate / 12 / 100;
    let balance = amount;
    const rows: Row[] = [];
    for (let m = 1; m <= months; m++) {
      const interest = balance * r;
      const principal = emi - interest;
      balance = Math.max(0, balance - principal);
      rows.push({ month: m, emi, principal, interest, balance });
    }
    return rows;
  }, [amount, rate, months, emi]);

  const totalPayment = emi * months;
  const totalInterest = totalPayment - amount;

  const pieData = [
    { name: 'Principal', value: amount },
    { name: 'Interest', value: totalInterest },
  ];
  const COLORS = ['#2563eb', '#f43f5e'];

  // Yearly aggregation for chart
  const yearly = useMemo(() => {
    const map = new Map<number, { year: number; principal: number; interest: number }>();
    schedule.forEach((row) => {
      const year = Math.ceil(row.month / 12);
      const entry = map.get(year) || { year, principal: 0, interest: 0 };
      entry.principal += row.principal;
      entry.interest += row.interest;
      map.set(year, entry);
    });
    return Array.from(map.values());
  }, [schedule]);

  function applyPreset(p: Preset) {
    setActivePreset(p);
    const cfg = presets[p];
    setAmount(cfg.amount);
    setRate(cfg.rate);
    setTenure(cfg.tenure);
  }

  return (
    <div>
      <SectionTitle
        title="EMI / Loan Calculator"
        subtitle="See your monthly payment, total interest, and full repayment schedule"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5 h-fit">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Loan Details</h2>
          <div className="flex gap-2 mb-4">
            {(Object.keys(presets) as Preset[]).map((p) => (
              <button
                key={p}
                onClick={() => applyPreset(p)}
                className={`flex-1 text-xs font-medium py-2 rounded-lg border transition ${
                  activePreset === p
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-300'
                }`}
              >
                {presets[p].label}
              </button>
            ))}
          </div>
          <div className="space-y-4">
            <NumberInput label="Loan Amount" value={amount} onChange={setAmount} prefix="₹" max={100000000} />
            <SliderInput
              label="Interest Rate (p.a.)"
              value={rate}
              onChange={setRate}
              min={1}
              max={30}
              step={0.05}
              format={(v) => `${v.toFixed(2)}%`}
            />
            <SliderInput
              label="Tenure"
              value={tenure}
              onChange={setTenure}
              min={1}
              max={30}
              format={(v) => `${v} years`}
            />
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <Stat label="Monthly EMI" value={formatINR(emi)} highlight />
            <Stat label="Total Interest" value={formatINR(totalInterest)} />
            <Stat label="Total Payment" value={formatINR(totalPayment)} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Principal vs Interest</h3>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={85}
                    innerRadius={45}
                    paddingAngle={2}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatINR(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">Year-wise Breakdown</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={yearly} margin={{ left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:opacity-30" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} unit="Y" />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
                  <Tooltip formatter={(v: number) => formatINR(v)} />
                  <Legend />
                  <Bar dataKey="principal" stackId="a" fill="#2563eb" name="Principal" />
                  <Bar dataKey="interest" stackId="a" fill="#f43f5e" name="Interest" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <Card className="p-5">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">Amortization Schedule</h3>
            <div className="overflow-x-auto max-h-96 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/80">
                  <tr className="text-left text-slate-500 dark:text-slate-400">
                    <th className="py-2.5 px-3 font-medium">Month</th>
                    <th className="py-2.5 px-3 font-medium">EMI</th>
                    <th className="py-2.5 px-3 font-medium">Principal</th>
                    <th className="py-2.5 px-3 font-medium">Interest</th>
                    <th className="py-2.5 px-3 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {schedule.map((r) => (
                    <tr key={r.month} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{r.month}</td>
                      <td className="py-2 px-3 text-slate-800 dark:text-slate-200">{formatINR(r.emi)}</td>
                      <td className="py-2 px-3 text-blue-700 dark:text-blue-400">{formatINR(r.principal)}</td>
                      <td className="py-2 px-3 text-rose-600 dark:text-rose-400">{formatINR(r.interest)}</td>
                      <td className="py-2 px-3 text-slate-800 dark:text-slate-200">{formatINR(r.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
