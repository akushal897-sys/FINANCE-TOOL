import { useMemo, useState } from 'react';
import { NumberInput, SliderInput, Card, SectionTitle, Stat } from '@/components/ui';
import { formatINR } from '@/lib/format';
import { compute as computeTax } from './IncomeTax';

const PF_WAGE_CEILING = 15000; // monthly statutory wage cap
const PF_RATE = 0.12;
const GRATUITY_FACTOR = 15 / 26; // per year of service, on (Basic + DA)
const FOOD_EXEMPTION_CAP = 26400; // ₹2,200/month meal allowance exemption cap
const NPS_MAX_RATE = 0.1; // Section 80CCD(2): up to 10% of Basic+DA

type CityType = 'metro' | 'non-metro';
type RegimeChoice = 'auto' | 'old' | 'new';

// Professional Tax by state — approximate flat monthly figure used as a
// conservative estimate. Actual PT in most states is income-slab-based and
// varies by salary band (statutory ceiling ₹2,500/year). ₹0 = no PT in that state.
const PT_SLABS: Record<string, { label: string; monthly: number }> = {
  karnataka: { label: 'Karnataka', monthly: 200 },
  maharashtra: { label: 'Maharashtra', monthly: 200 },
  'tamil-nadu': { label: 'Tamil Nadu', monthly: 200 },
  'andhra-pradesh': { label: 'Andhra Pradesh', monthly: 200 },
  telangana: { label: 'Telangana', monthly: 200 },
  gujarat: { label: 'Gujarat', monthly: 200 },
  'west-bengal': { label: 'West Bengal', monthly: 200 },
  odisha: { label: 'Odisha', monthly: 200 },
  assam: { label: 'Assam', monthly: 200 },
  'madhya-pradesh': { label: 'Madhya Pradesh', monthly: 200 },
  chhattisgarh: { label: 'Chhattisgarh', monthly: 200 },
  kerala: { label: 'Kerala', monthly: 200 },
  punjab: { label: 'Punjab', monthly: 200 },
  haryana: { label: 'Haryana', monthly: 200 },
  rajasthan: { label: 'Rajasthan', monthly: 200 },
  bihar: { label: 'Bihar', monthly: 200 },
  jharkhand: { label: 'Jharkhand', monthly: 200 },
  uttarakhand: { label: 'Uttarakhand', monthly: 200 },
  'himachal-pradesh': { label: 'Himachal Pradesh', monthly: 200 },
  manipur: { label: 'Manipur', monthly: 200 },
  tripura: { label: 'Tripura', monthly: 200 },
  meghalaya: { label: 'Meghalaya', monthly: 200 },
  delhi: { label: 'Delhi', monthly: 0 },
  'uttar-pradesh': { label: 'Uttar Pradesh', monthly: 0 },
  jammu: { label: 'Jammu & Kashmir', monthly: 0 },
  ladakh: { label: 'Ladakh', monthly: 0 },
  goa: { label: 'Goa', monthly: 0 },
  sikkim: { label: 'Sikkim', monthly: 0 },
  mizoram: { label: 'Mizoram', monthly: 0 },
  nagaland: { label: 'Nagaland', monthly: 0 },
  arunachal: { label: 'Arunachal Pradesh', monthly: 0 },
  chandigarh: { label: 'Chandigarh', monthly: 0 },
  puducherry: { label: 'Puducherry', monthly: 0 },
  'andaman-nicobar': { label: 'Andaman & Nicobar', monthly: 0 },
  'dadra-nagar': { label: 'Dadra & Nagar Haveli', monthly: 0 },
  daman: { label: 'Daman & Diu', monthly: 0 },
  lakshadweep: { label: 'Lakshadweep', monthly: 0 },
};

// HRA exemption (old regime only): least of
// 1) actual HRA received
// 2) rent paid − 10% of (basic + DA)
// 3) 50% of basic (metro) / 40% of basic (non-metro)
function hraExemption(
  hraReceived: number,
  rentPaid: number,
  basic: number,
  city: CityType
): number {
  const metroRate = city === 'metro' ? 0.5 : 0.4;
  const one = hraReceived;
  const two = Math.max(0, rentPaid - 0.1 * basic);
  const three = basic * metroRate;
  return Math.max(0, Math.min(one, two, three));
}

interface Breakdown {
  annualBasic: number;
  monthlyBasic: number;
  annualHra: number;
  monthlyHra: number;
  annualLta: number;
  annualFoodAllowance: number;
  monthlyFoodAllowance: number;
  annualTelephoneReimbursement: number;
  monthlyTelephoneReimbursement: number;
  annualSpecial: number;
  monthlySpecial: number;
  annualEmployerPf: number;
  monthlyEmployerPf: number;
  annualEmployeePf: number;
  monthlyEmployeePf: number;
  annualGratuityAccrual: number;
  totalGratuityAtExit: number;
  annualHealthInsurance: number;
  annualEmployerNps: number;
  monthlyGross: number;
  annualGross: number;
  monthlyPt: number;
  annualPt: number;
  hraExempt: number;
  ltaExempt: number;
  foodExempt: number;
  telephoneExempt: number;
  employerNpsDeduction: number;
  oldDeductions: number;
  regime: 'old' | 'new';
  oldTax: number;
  newTax: number;
  monthlyTax: number;
  annualTax: number;
  monthlyInHand: number;
  annualInHand: number;
  totalEmployerCost: number;
  ctcWaterfallOk: boolean;
}

export default function Salary() {
  const [ctc, setCtc] = useState(1500000);
  const [basicPct, setBasicPct] = useState(40);
  const [city, setCity] = useState<CityType>('metro');
  const [pfOnFullBasic, setPfOnFullBasic] = useState(false);
  const [state, setState] = useState('karnataka');
  const [regimeChoice, setRegimeChoice] = useState<RegimeChoice>('auto');
  const [rentPaid, setRentPaid] = useState(0);
  const [yearsOfService, setYearsOfService] = useState(1);

  // Advanced CTC components
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [annualLta, setAnnualLta] = useState(0);
  const [ltaClaimed, setLtaClaimed] = useState(false);
  const [monthlyFoodAllowance, setMonthlyFoodAllowance] = useState(0);
  const [monthlyTelephoneReimbursement, setMonthlyTelephoneReimbursement] = useState(0);
  const [annualHealthInsurance, setAnnualHealthInsurance] = useState(0);
  const [employerNpsOn, setEmployerNpsOn] = useState(false);
  const [employerNpsPct, setEmployerNpsPct] = useState(10);

  const b = useMemo<Breakdown>(() => {
    const annualBasic = (ctc * basicPct) / 100;
    const monthlyBasic = annualBasic / 12;

    // PF wage ceiling unless overridden
    const pfWage = pfOnFullBasic ? monthlyBasic : Math.min(monthlyBasic, PF_WAGE_CEILING);
    const monthlyEmployerPf = pfWage * PF_RATE;
    const monthlyEmployeePf = pfWage * PF_RATE;
    const annualEmployerPf = monthlyEmployerPf * 12;
    const annualEmployeePf = monthlyEmployeePf * 12;

    // HRA: 50% metro, 40% non-metro
    const hraRate = city === 'metro' ? 0.5 : 0.4;
    const annualHra = annualBasic * hraRate;
    const monthlyHra = annualHra / 12;

    // Gratuity: statutory formula is (last drawn MONTHLY Basic+DA) × 15/26 × years.
    // Per-year CTC accrual is constant regardless of tenure; total-at-exit scales with years.
    // DA assumed 0 here; shown as CTC component (estimate, payable on exit after 5+ yrs).
    const annualGratuityAccrual = monthlyBasic * GRATUITY_FACTOR;
    const totalGratuityAtExit = monthlyBasic * GRATUITY_FACTOR * yearsOfService;

    // Advanced cash components (part of Gross)
    const annualFoodAllowance = monthlyFoodAllowance * 12;
    const annualTelephoneReimbursement = monthlyTelephoneReimbursement * 12;

    // Advanced non-cash / CTC-only components
    const annualEmployerNps = employerNpsOn
      ? annualBasic * Math.min(employerNpsPct / 100, NPS_MAX_RATE)
      : 0;

    // Special Allowance = CTC minus every other named CTC line item.
    // Invariant: the sum of all components must equal CTC exactly. Gross (cash
    // components + Special) must never exceed CTC minus employer-side components.
    // A future component added to Gross must also be subtracted here, or Special
    // shrinks to compensate — this structurally prevents the silent-inflation bug.
    const annualSpecial = Math.max(
      0,
      ctc -
        annualBasic -
        annualHra -
        annualLta -
        annualFoodAllowance -
        annualTelephoneReimbursement -
        annualEmployerPf -
        annualGratuityAccrual -
        annualHealthInsurance -
        annualEmployerNps
    );
    const monthlySpecial = annualSpecial / 12;

    // Gross = sum of ONLY cash components (what you earn before deductions)
    const monthlyGross =
      monthlyBasic + monthlyHra + monthlySpecial + monthlyFoodAllowance + monthlyTelephoneReimbursement / 12 + annualLta / 12;
    const annualGross =
      annualBasic + annualHra + annualSpecial + annualFoodAllowance + annualTelephoneReimbursement + annualLta;

    // Runtime invariant: all components must sum back to CTC (within ₹1 rounding).
    const ctcWaterfallOk =
      Math.abs(
        annualBasic +
          annualHra +
          annualLta +
          annualFoodAllowance +
          annualTelephoneReimbursement +
          annualSpecial +
          annualEmployerPf +
          annualGratuityAccrual +
          annualHealthInsurance +
          annualEmployerNps -
          ctc
      ) <= 1;

    // Professional Tax
    const monthlyPt = PT_SLABS[state]?.monthly ?? 0;
    const annualPt = monthlyPt * 12;

    // --- Taxable income computation ---
    // Exemptions applied to Gross to derive taxable income.
    const hraExempt = hraExemption(annualHra, rentPaid, annualBasic, city);
    const ltaExempt = ltaClaimed ? annualLta : 0;
    const foodExempt = Math.min(annualFoodAllowance, FOOD_EXEMPTION_CAP);
    const telephoneExempt = annualTelephoneReimbursement; // fully exempt (reimbursement)

    // 80CCD(2) employer NPS deduction — allowed under BOTH regimes.
    const employerNpsDeduction = annualEmployerNps;

    // 80C = employee PF (capped at ₹1.5L) — old regime only.
    const deduction80C = Math.min(annualEmployeePf, 150000);
    const oldRegimeExemptions = hraExempt + ltaExempt + foodExempt + telephoneExempt;
    const newRegimeExemptions = ltaExempt + foodExempt + telephoneExempt;

    const oldResult = computeTax(
      annualGross,
      deduction80C + oldRegimeExemptions,
      'old',
      employerNpsDeduction
    );
    const newResult = computeTax(
      annualGross,
      newRegimeExemptions,
      'new',
      employerNpsDeduction
    );

    const autoRegime = oldResult.totalTax <= newResult.totalTax ? 'old' : 'new';
    const regime = regimeChoice === 'auto' ? autoRegime : regimeChoice;
    const annualTax = regime === 'old' ? oldResult.totalTax : newResult.totalTax;
    const monthlyTax = annualTax / 12;

    const monthlyInHand = monthlyGross - monthlyEmployeePf - monthlyPt - monthlyTax;
    const annualInHand = monthlyInHand * 12;
    const totalEmployerCost =
      annualEmployerPf + annualGratuityAccrual + annualHealthInsurance + annualEmployerNps;

    return {
      annualBasic,
      monthlyBasic,
      annualHra,
      monthlyHra,
      annualLta,
      annualFoodAllowance,
      monthlyFoodAllowance,
      annualTelephoneReimbursement,
      monthlyTelephoneReimbursement,
      annualSpecial,
      monthlySpecial,
      annualEmployerPf,
      monthlyEmployerPf,
      annualEmployeePf,
      monthlyEmployeePf,
      annualGratuityAccrual,
      totalGratuityAtExit,
      annualHealthInsurance,
      annualEmployerNps,
      monthlyGross,
      annualGross,
      monthlyPt,
      annualPt,
      hraExempt,
      ltaExempt,
      foodExempt,
      telephoneExempt,
      employerNpsDeduction,
      oldDeductions: deduction80C + oldRegimeExemptions + employerNpsDeduction,
      regime,
      oldTax: oldResult.totalTax,
      newTax: newResult.totalTax,
      monthlyTax,
      annualTax,
      monthlyInHand,
      annualInHand,
      totalEmployerCost,
      ctcWaterfallOk,
    };
  }, [
    ctc,
    basicPct,
    city,
    pfOnFullBasic,
    state,
    regimeChoice,
    rentPaid,
    yearsOfService,
    annualLta,
    ltaClaimed,
    monthlyFoodAllowance,
    monthlyTelephoneReimbursement,
    annualHealthInsurance,
    employerNpsOn,
    employerNpsPct,
  ]);

  return (
    <div>
      <SectionTitle
        title="Salary / CTC Breakdown Calculator"
        subtitle="Decode your CTC into components and estimate monthly in-hand salary (FY 2025-26)"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="p-5 h-fit">
          <h2 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">CTC Details</h2>
          <div className="space-y-4">
            <NumberInput label="Annual CTC" value={ctc} onChange={setCtc} prefix="₹" max={100000000} />
            <SliderInput
              label="Basic Salary % of CTC"
              value={basicPct}
              onChange={setBasicPct}
              min={20}
              max={60}
              format={(v) => `${v}%`}
            />

            <div>
              <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                City Type
              </span>
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  onClick={() => setCity('metro')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                    city === 'metro'
                      ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Metro (50% HRA)
                </button>
                <button
                  onClick={() => setCity('non-metro')}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                    city === 'non-metro'
                      ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  Non-metro (40% HRA)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                State (for Professional Tax)
              </label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-2.5 px-3 text-sm font-medium text-slate-900 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/40 focus:outline-none"
              >
                {Object.entries(PT_SLABS).map(([key, val]) => (
                  <option key={key} value={key}>
                    {val.label} {val.monthly === 0 ? '(no PT)' : `— ₹${val.monthly}/mo`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Approximate — actual PT varies by income slab in most states, capped at ₹2,500/year statutory ceiling.
              </p>
            </div>

            <div>
              <span className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Tax Regime
              </span>
              <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                {(['auto', 'old', 'new'] as RegimeChoice[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRegimeChoice(r)}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition capitalize ${
                      regimeChoice === r
                        ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-sm'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {r === 'auto' ? 'Auto' : r}
                  </button>
                ))}
              </div>
              {regimeChoice === 'auto' && (
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                  Auto-selected: <strong className="capitalize">{b.regime}</strong> regime saves{' '}
                  {formatINR(Math.abs(b.oldTax - b.newTax))} more
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  PF on full basic
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  Off = capped at ₹15,000 wage ceiling
                </div>
              </div>
              <button
                onClick={() => setPfOnFullBasic(!pfOnFullBasic)}
                className={`relative w-11 h-6 rounded-full transition ${
                  pfOnFullBasic ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition ${
                    pfOnFullBasic ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            <NumberInput
              label="Years of Service (for gratuity)"
              value={yearsOfService}
              onChange={(v) => setYearsOfService(Math.min(Math.max(v, 0), 40))}
              suffix="yrs"
              hint="Gratuity shown as CTC component; payable after 5+ yrs tenure"
            />

            {regimeChoice !== 'new' && (
              <NumberInput
                label="Annual Rent Paid (for HRA exemption)"
                value={rentPaid}
                onChange={setRentPaid}
                prefix="₹"
                max={10000000}
                hint="HRA exemption applies only under Old regime"
              />
            )}

            {/* Advanced CTC Components */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                <span>Advanced CTC Components</span>
                <span className="text-slate-400 text-xs">{showAdvanced ? 'Hide' : 'Show'}</span>
              </button>

              {showAdvanced && (
                <div className="mt-4 space-y-4">
                  <NumberInput
                    label="Leave Travel Allowance (LTA, annual)"
                    value={annualLta}
                    onChange={setAnnualLta}
                    prefix="₹"
                    max={1000000}
                    hint="Exempt only if claimed with travel proof"
                  />
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      LTA claimed this year?
                    </div>
                    <button
                      onClick={() => setLtaClaimed(!ltaClaimed)}
                      className={`relative w-11 h-6 rounded-full transition ${
                        ltaClaimed ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition ${
                          ltaClaimed ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <NumberInput
                    label="Food / Meal Allowance (monthly)"
                    value={monthlyFoodAllowance}
                    onChange={setMonthlyFoodAllowance}
                    prefix="₹"
                    max={100000}
                    hint="Exempt up to ₹2,200/month (₹26,400/year), rest taxable"
                  />

                  <NumberInput
                    label="Telephone / Internet Reimbursement (monthly)"
                    value={monthlyTelephoneReimbursement}
                    onChange={setMonthlyTelephoneReimbursement}
                    prefix="₹"
                    max={50000}
                    hint="Fully tax-exempt if within actual bill amount"
                  />

                  <NumberInput
                    label="Employer Health Insurance (annual premium)"
                    value={annualHealthInsurance}
                    onChange={setAnnualHealthInsurance}
                    prefix="₹"
                    max={500000}
                    hint="Employer-paid group insurance — not taxable, CTC-only"
                  />

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Employer NPS contribution
                      </div>
                      <div className="text-xs text-slate-400 dark:text-slate-500">
                        Section 80CCD(2) — exempt under both regimes
                      </div>
                    </div>
                    <button
                      onClick={() => setEmployerNpsOn(!employerNpsOn)}
                      className={`relative w-11 h-6 rounded-full transition ${
                        employerNpsOn ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition ${
                          employerNpsOn ? 'translate-x-5' : ''
                        }`}
                      />
                    </button>
                  </div>
                  {employerNpsOn && (
                    <SliderInput
                      label="Employer NPS % of Basic"
                      value={employerNpsPct}
                      onChange={setEmployerNpsPct}
                      min={1}
                      max={10}
                      format={(v) => `${v}%`}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid sm:grid-cols-3 gap-4">
            <Stat label="Monthly In-hand" value={formatINR(b.monthlyInHand)} highlight />
            <Stat label="Annual In-hand" value={formatINR(b.annualInHand)} highlight />
            <Stat label={`Tax (${b.regime} regime)`} value={formatINR(b.annualTax)} />
          </div>

          {!b.ctcWaterfallOk && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-4 text-sm text-red-700 dark:text-red-400">
              <strong>Warning:</strong> CTC components do not sum back to CTC. This indicates a
              calculation error — please check your inputs.
            </div>
          )}

          {/* CTC → Gross → Net flow */}
          <Card className="p-5">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
              CTC → Gross → In-hand (Annual)
            </h3>
            <div className="space-y-2.5 text-sm">
              <Line label="Basic Salary" value={b.annualBasic} />
              <Line label={`HRA (${city === 'metro' ? '50%' : '40%'} of basic)`} value={b.annualHra} />
              {b.annualLta > 0 && <Line label="Leave Travel Allowance" value={b.annualLta} />}
              {b.annualFoodAllowance > 0 && <Line label="Food / Meal Allowance" value={b.annualFoodAllowance} />}
              {b.annualTelephoneReimbursement > 0 && (
                <Line label="Telephone / Internet Reimbursement" value={b.annualTelephoneReimbursement} />
              )}
              <Line label="Special Allowance (balancing)" value={b.annualSpecial} />
              <Line label="Employer PF (12%, in CTC only)" value={b.annualEmployerPf} muted />
              <Line label="Gratuity provision (in CTC only)" value={b.annualGratuityAccrual} muted />
              {b.annualHealthInsurance > 0 && (
                <Line label="Health Insurance (employer, CTC only)" value={b.annualHealthInsurance} muted />
              )}
              {b.annualEmployerNps > 0 && (
                <Line label="Employer NPS (CTC only)" value={b.annualEmployerNps} muted />
              )}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-slate-900 dark:text-white">
                <span>Annual CTC</span>
                <span>{formatINR(ctc)}</span>
              </div>
              <div className="pt-2 mt-1 flex justify-between font-semibold text-slate-700 dark:text-slate-300">
                <span>Less: Employer-side components</span>
                <span className="text-slate-500 dark:text-slate-400">- {formatINR(b.totalEmployerCost)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-slate-900 dark:text-slate-100">
                <span>Gross Salary</span>
                <span>{formatINR(b.annualGross)}</span>
              </div>
            </div>
          </Card>

          {/* Taxable Income Breakdown */}
          <Card className="p-5">
            <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
              Taxable Income Breakdown ({b.regime} regime)
            </h3>
            <div className="space-y-2.5 text-sm">
              <Line label="Gross Salary" value={b.annualGross} />
              {b.hraExempt > 0 && b.regime === 'old' && (
                <Line label="Less: HRA exemption" value={-b.hraExempt} negative />
              )}
              {b.ltaExempt > 0 && (
                <Line label="Less: LTA exemption (claimed)" value={-b.ltaExempt} negative />
              )}
              {b.foodExempt > 0 && (
                <Line label={`Less: Food allowance exemption (cap ₹${FOOD_EXEMPTION_CAP.toLocaleString('en-IN')})`} value={-b.foodExempt} negative />
              )}
              {b.telephoneExempt > 0 && (
                <Line label="Less: Telephone reimbursement" value={-b.telephoneExempt} negative />
              )}
              <Line
                label={`Less: Standard deduction (₹${b.regime === 'old' ? '50,000' : '75,000'})`}
                value={-(b.regime === 'old' ? 50000 : 75000)}
                negative
              />
              {b.regime === 'old' && (
                <Line label="Less: 80C (employee PF, cap ₹1,50,000)" value={-Math.min(b.annualEmployeePf, 150000)} negative />
              )}
              {b.employerNpsDeduction > 0 && (
                <Line label="Less: 80CCD(2) Employer NPS" value={-b.employerNpsDeduction} negative />
              )}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-slate-900 dark:text-slate-100">
                <span>Taxable Income</span>
                <span>
                  {formatINR(
                    Math.max(
                      0,
                      b.annualGross -
                        (b.regime === 'old' ? b.hraExempt : 0) -
                        b.ltaExempt -
                        b.foodExempt -
                        b.telephoneExempt -
                        (b.regime === 'old' ? 50000 : 75000) -
                        (b.regime === 'old' ? Math.min(b.annualEmployeePf, 150000) : 0) -
                        b.employerNpsDeduction
                    )
                  )}
                </span>
              </div>
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-4">
                Deductions → Monthly In-hand
              </h3>
              <div className="space-y-2.5 text-sm">
                <Line label="Gross Monthly" value={b.monthlyGross} />
                <Line label="Employee PF (12%)" value={-b.monthlyEmployeePf} negative />
                <Line label="Professional Tax" value={-b.monthlyPt} negative />
                <Line label={`TDS (${b.regime} regime)`} value={-b.monthlyTax} negative />
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-bold text-emerald-700 dark:text-emerald-400">
                  <span>In-hand Monthly</span>
                  <span>{formatINR(b.monthlyInHand)}</span>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">
                Employer Contributions (in CTC, not in-hand)
              </h3>
              <div className="space-y-2.5 text-sm">
                <Line label="Employer PF (12%)" value={b.annualEmployerPf} />
                <Line label="Gratuity provision (annual accrual)" value={b.annualGratuityAccrual} />
                {b.annualHealthInsurance > 0 && (
                  <Line label="Health Insurance premium" value={b.annualHealthInsurance} />
                )}
                {b.annualEmployerNps > 0 && (
                  <Line label="Employer NPS contribution" value={b.annualEmployerNps} />
                )}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-semibold text-slate-900 dark:text-slate-100">
                  <span>Total (annual)</span>
                  <span>{formatINR(b.totalEmployerCost)}</span>
                </div>
                <div className="mt-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-3 text-xs text-amber-800 dark:text-amber-300">
                  Employer PF, Gratuity, Health Insurance and NPS are part of your CTC but you won't
                  see them in your bank account monthly. If you leave after {yearsOfService} year
                  {yearsOfService === 1 ? '' : 's'}, gratuity payable ≈{' '}
                  {formatINR(b.totalGratuityAtExit)} (payable after 5+ yrs tenure).
                </div>
              </div>
            </Card>
          </div>

          {b.regime === 'old' && b.hraExempt > 0 && (
            <Card className="p-5">
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 mb-3">
                HRA Exemption Breakdown (Old Regime)
              </h3>
              <div className="space-y-2.5 text-sm">
                <Line label="Actual HRA received" value={b.annualHra} />
                <Line label="Rent paid − 10% of basic" value={Math.max(0, rentPaid - 0.1 * b.annualBasic)} />
                <Line
                  label={`${city === 'metro' ? '50%' : '40%'} of basic`}
                  value={b.annualBasic * (city === 'metro' ? 0.5 : 0.4)}
                />
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between font-semibold text-slate-900 dark:text-slate-100">
                  <span>Exempt (least of above)</span>
                  <span>{formatINR(b.hraExempt)}</span>
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Plus 80C (employee PF): {formatINR(Math.min(b.annualEmployeePf, 150000))} · Total
                  old-regime deductions: {formatINR(b.oldDeductions)}
                </p>
              </div>
            </Card>
          )}

          <div className="rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 p-4 text-sm text-blue-800 dark:text-blue-300">
            <strong>How this works:</strong> PF is 12% of basic, capped at the ₹15,000 statutory
            wage ceiling unless "PF on full basic" is on. HRA is {city === 'metro' ? '50%' : '40%'} of
            basic ({city === 'metro' ? 'metro' : 'non-metro'} rate). Special Allowance is the
            balancing figure that fills the gap between CTC and all other components. Professional
            Tax is {PT_SLABS[state]?.label} at {b.monthlyPt === 0 ? 'nil' : `₹${b.monthlyPt}/month`}.
            Tax uses the <span className="capitalize">{b.regime}</span> regime with standard
            deduction (₹{b.regime === 'old' ? '50,000' : '75,000'}).
            {b.employerNpsDeduction > 0 && (
              <> Employer NPS ({formatINR(b.annualEmployerNps)}) is deducted under Section 80CCD(2) in both regimes.</>
            )}
            <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-900 text-xs">
              Actual in-hand may vary by company policy. This is an estimate.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Line({
  label,
  value,
  negative,
  muted,
}: {
  label: string;
  value: number;
  negative?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex justify-between text-slate-600 dark:text-slate-300">
      <span>{label}</span>
      <span
        className={`font-medium ${
          negative
            ? 'text-rose-600 dark:text-rose-400'
            : muted
            ? 'text-slate-400 dark:text-slate-500'
            : 'text-slate-900 dark:text-slate-100'
        }`}
      >
        {formatINR(value)}
      </span>
    </div>
  );
}
