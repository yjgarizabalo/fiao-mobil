// Formato de dinero, fecha y texto en un solo lugar. Antes formatCurrency/getInitials/
// getAvatarColor/normalizeText estaban copiadas en 4 pantallas distintas (clientList,
// clients, clientDetail, businessList/businesses) y cada una construía su propio
// `Intl.NumberFormat` en cada render; aquí se construyen una sola vez.

const moneyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('es-CO');

export function formatMoney(value: number): string {
  return moneyFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatNumber(value: number): string {
  return numberFormatter.format(Number.isFinite(value) ? value : 0);
}

// "1,5 M" en vez de "$1.500.000" para espacios chicos (tiles, headers).
export function formatMoneyCompact(value: number): string {
  const amount = Number.isFinite(value) ? value : 0;
  if (Math.abs(amount) < 100000) return formatMoney(amount);
  const millions = amount / 1_000_000;
  const rounded = Math.round(millions * 10) / 10;
  return `${rounded.toString().replace('.', ',')} M`;
}

export function digitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, '');
}

export function parseMoney(value: string): number {
  const parsed = Number(digitsOnly(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

const dateFormatter = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function formatDate(value: string | Date): string {
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: string | Date): string {
  return dateTimeFormatter.format(new Date(value));
}

export function daysUntil(value: string | Date): number {
  const target = new Date(value);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export function formatRelativeDate(value: string | Date): string {
  const diff = daysUntil(value);
  if (diff === 0) return 'Hoy';
  if (diff === -1) return 'Ayer';
  if (diff === 1) return 'Mañana';
  if (diff < 0 && diff >= -6) return `Hace ${Math.abs(diff)} días`;
  if (diff > 0 && diff <= 6) return `En ${diff} días`;
  return formatDate(value);
}

export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function getInitials(name: string): string {
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function getFirstName(name: string): string {
  return name.trim().split(' ')[0] ?? name;
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(' ');
  return `${lastSpace > 0 ? cut.slice(0, lastSpace) : cut}…`;
}

// Formato colombiano de celular: "3001234567" → "300 123 4567".
export function formatPhone(phone: string): string {
  const digits = digitsOnly(phone);
  if (digits.length !== 10) return phone;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

const AVATAR_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6'];

export function getAvatarColor(name: string): string {
  if (!name) return AVATAR_COLORS[0]!;
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]!;
}

export function pluralize(count: number, singular: string, plural: string = `${singular}s`): string {
  return count === 1 ? singular : plural;
}
