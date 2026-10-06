import { format, differenceInDays, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { BadgeVariant } from '@/components/ui/Badge';

/** Formatea número a COP */
export function formatCOP(amount: number | null | undefined): string {
  if (amount == null) return '$ 0';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Formatea fecha estándar 'd MMM, yyyy' */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return format(date, 'd MMM, yyyy', { locale: es });
  } catch {
    return dateStr;
  }
}

/** Formatea fecha corta 'dd/MM/yyyy' */
export function formatShortDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '-';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    return format(date, 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
}

/**
 * Calcula estado y días restantes de un documento
 */
export function getDocumentStatusInfo(expiryDateStr: string | null | undefined, alertDays = 30): {
  status: 'vigente' | 'por_vencer' | 'vencido';
  badgeVariant: BadgeVariant;
  label: string;
  daysRemaining: number | null;
} {
  if (!expiryDateStr) {
    return {
      status: 'vigente',
      badgeVariant: 'success',
      label: 'Sin vencimiento',
      daysRemaining: null,
    };
  }

  const expiry = parseISO(expiryDateStr);
  const today = new Date();
  const diff = differenceInDays(expiry, today);

  if (diff < 0) {
    return {
      status: 'vencido',
      badgeVariant: 'danger',
      label: `Vencido hace ${Math.abs(diff)} d`,
      daysRemaining: diff,
    };
  } else if (diff <= alertDays) {
    return {
      status: 'por_vencer',
      badgeVariant: 'warning',
      label: `Vence en ${diff} d`,
      daysRemaining: diff,
    };
  } else {
    return {
      status: 'vigente',
      badgeVariant: 'success',
      label: `Vigente (${diff} d)`,
      daysRemaining: diff,
    };
  }
}

/** Obtiene badgeVariant y label para el estado del empleado */
export function getEmployeeStatusInfo(status: string): {
  badgeVariant: BadgeVariant;
  label: string;
} {
  switch (status) {
    case 'active':
      return { badgeVariant: 'success', label: 'Activo' };
    case 'vacation':
      return { badgeVariant: 'warning', label: 'Vacaciones' };
    case 'inactive':
      return { badgeVariant: 'neutral', label: 'Inactivo' };
    case 'terminated':
      return { badgeVariant: 'danger', label: 'Liquidado' };
    default:
      return { badgeVariant: 'neutral', label: status };
  }
}

/** Obtiene badgeVariant y label para periodo de nómina */
export function getPayrollStatusInfo(status: string): {
  badgeVariant: BadgeVariant;
  label: string;
} {
  switch (status) {
    case 'paid':
      return { badgeVariant: 'success', label: 'Pagada' };
    case 'calculated':
      return { badgeVariant: 'info', label: 'Calculada' };
    case 'draft':
      return { badgeVariant: 'warning', label: 'Borrador' };
    default:
      return { badgeVariant: 'neutral', label: status };
  }
}
