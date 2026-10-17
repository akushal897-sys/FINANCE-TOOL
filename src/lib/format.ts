// Indian numbering system formatting helpers

export function formatINR(amount: number, fractionDigits = 0): string {
  if (!isFinite(amount)) return '₹0';
  const sign = amount < 0 ? '-' : '';
  const abs = Math.abs(Math.round(amount * Math.pow(10, fractionDigits)) / Math.pow(10, fractionDigits));
  const [intPart, decPart] = abs.toFixed(fractionDigits).split('.');

  // Indian grouping: last 3 digits, then groups of 2
  let lastThree = intPart.slice(-3);
  const otherNumbers = intPart.slice(0, -3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  const formatted = decPart ? `${formattedInt}.${decPart}` : formattedInt;
  return `${sign}₹${formatted}`;
}

export function formatNumber(value: number, fractionDigits = 0): string {
  if (!isFinite(value)) return '0';
  const abs = Math.abs(Math.round(value * Math.pow(10, fractionDigits)) / Math.pow(10, fractionDigits));
  const [intPart, decPart] = abs.toFixed(fractionDigits).split('.');
  let lastThree = intPart.slice(-3);
  const otherNumbers = intPart.slice(0, -3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  const formattedInt = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
  return decPart ? `${formattedInt}.${decPart}` : formattedInt;
}

export function formatPercent(value: number, fractionDigits = 2): string {
  return `${value.toFixed(fractionDigits)}%`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
