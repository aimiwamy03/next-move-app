/** Digits only, US 10-digit. */
export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10);
}

export function formatPhoneDisplay(digits: string): string {
  const d = digitsOnly(digits);
  if (d.length === 0) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

export function isValidUsPhone(digits: string): boolean {
  const d = digitsOnly(digits);
  return d.length === 10 && d[0] !== '0' && d[0] !== '1';
}

export function telUrl(digits: string): string {
  return `tel:+1${digitsOnly(digits)}`;
}
