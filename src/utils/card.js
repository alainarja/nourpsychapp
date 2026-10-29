// Client-side card checks for the add-card form. The full number and CVC are never stored —
// only brand, last 4 and expiry. A real payment provider will tokenize cards later.

export function luhnValid(number) {
  const digits = number.replace(/\D/g, '');
  if (digits.length < 12 || digits.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

export function cardBrand(number) {
  const n = number.replace(/\D/g, '');
  if (/^4/.test(n)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'Amex';
  return 'Card';
}

// Groups digits as the user types: 4242 4242 4242 4242 (Amex: 4-6-5).
export function formatCardNumber(value) {
  const n = value.replace(/\D/g, '').slice(0, 19);
  if (cardBrand(n) === 'Amex') return [n.slice(0, 4), n.slice(4, 10), n.slice(10, 15)].filter(Boolean).join(' ');
  return n.replace(/(.{4})/g, '$1 ').trim();
}

export function formatExpiry(value) {
  const n = value.replace(/\D/g, '').slice(0, 4);
  return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n;
}

export function expiryValid(mmyy, now = new Date()) {
  const m = /^(\d{2})\/(\d{2})$/.exec(mmyy);
  if (!m) return false;
  const month = Number(m[1]);
  const year = 2000 + Number(m[2]);
  if (month < 1 || month > 12) return false;
  // Valid through the last day of the expiry month.
  return new Date(year, month, 1) > now;
}

export const cvcValid = (cvc, brand) => (brand === 'Amex' ? /^\d{4}$/ : /^\d{3}$/).test(cvc);
