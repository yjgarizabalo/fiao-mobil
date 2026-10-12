/**
 * Enlaces a WhatsApp para cobrar un vale.
 *
 * Se usa el enlace universal `https://wa.me/…` y no el esquema `whatsapp://`
 * a propósito: el esquema obliga a declarar `LSApplicationQueriesSchemes` en
 * el Info.plist de iOS (y por tanto a rehacer el prebuild), mientras que
 * `wa.me` funciona igual en Android y en iOS sin tocar nada nativo y, si la
 * persona no tiene WhatsApp instalado, abre la versión web.
 *
 * Lo que esto hace es **abrir** el chat con el mensaje ya escrito; el envío lo
 * confirma el tendero. No hay envío automático ni masivo: eso exigiría la
 * WhatsApp Business API de Meta, con número verificado y plantillas aprobadas.
 */
import { Linking } from 'react-native';

import { digitsOnly } from '@/core/utils/format';

/** Indicativo de Colombia: el formulario pide 10 dígitos, sin país. */
const COUNTRY_CODE = '57';
const LOCAL_LENGTH = 10;

/**
 * Pasa un teléfono al formato internacional que espera `wa.me` (solo dígitos,
 * con indicativo y sin `+`). Devuelve `null` si no hay nada que marcar, para
 * que la pantalla pueda ocultar el botón en vez de abrir un chat roto.
 */
export const toWhatsAppNumber = (phone: string): string | null => {
  const digits = digitsOnly(phone);
  if (digits.length === 0) return null;

  // Ya viene con indicativo (por ejemplo si se guardó como +57 300…).
  if (digits.startsWith(COUNTRY_CODE) && digits.length === COUNTRY_CODE.length + LOCAL_LENGTH) {
    return digits;
  }
  if (digits.length === LOCAL_LENGTH) return `${COUNTRY_CODE}${digits}`;

  // Longitud rara: se manda tal cual y que WhatsApp decida. Es preferible a
  // no ofrecer el botón, porque el dato puede venir de un registro viejo.
  return digits;
};

export interface DebtReminderInput {
  /** Nombre del cliente, tal como lo registró el tendero. */
  debtorName: string;
  /** Nombre del negocio que cobra. */
  businessName?: string;
  /** Saldo pendiente, ya formateado con `formatMoney`. */
  formattedBalance: string;
}

/**
 * Mensaje de cobro. El tono es deliberadamente amable: el tendero le vende a
 * esta persona todos los días y un recordatorio seco le cuesta el cliente.
 */
export const buildDebtReminder = ({
  debtorName,
  businessName,
  formattedBalance,
}: DebtReminderInput): string => {
  const firstName = debtorName.trim().split(/\s+/)[0] ?? debtorName.trim();
  const from = businessName ? ` de *${businessName}*` : '';

  return (
    `Hola ${firstName} 👋 Le escribo${from}.\n\n` +
    `Le recuerdo con todo el aprecio que tiene un saldo pendiente de *${formattedBalance}*.\n\n` +
    'Cuando pueda me avisa para coordinar el pago. ¡Muchas gracias!'
  );
};

export interface TeamInviteInput {
  /** Nombre del negocio al que se invita. */
  businessName?: string;
  /** Etiqueta del rol en español (p. ej. "Cajero"). */
  roleLabel: string;
  /** Código que la persona teclea en la app para unirse. */
  code: string;
}

/**
 * Mensaje de invitación al equipo. Incluye el paso a paso para unirse con el
 * código dentro de la app, ya que el flujo es por código (no por deep link).
 */
export const buildTeamInvite = ({ businessName, roleLabel, code }: TeamInviteInput): string => {
  const at = businessName ? ` a *${businessName}*` : '';

  return (
    `¡Hola! 👋 Te invito a unirte${at} en *Fiao* como *${roleLabel}*.\n\n` +
    'Para entrar:\n' +
    '1️⃣ Instala Fiao e ingresa con tu cuenta.\n' +
    '2️⃣ Ve a *Perfil → Tengo un código*.\n' +
    `3️⃣ Escribe este código: *${code}*\n\n` +
    'El código vence en 7 días. ¡Te espero! 🙌'
  );
};

/** URL lista para `Linking.openURL`. */
export const buildWhatsAppUrl = (phone: string, message: string): string | null => {
  const number = toWhatsAppNumber(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
};

/**
 * `true` si el sistema puede abrir WhatsApp en este dispositivo.
 *
 * Antes de lanzar una cola de varios recordatorios seguidos tiene sentido
 * comprobar esto una sola vez: si el tendero no tiene WhatsApp, abrir `wa.me`
 * N veces solo termina en el navegador N veces, sin avisarle por qué.
 *
 * Depende de que la app declare el esquema `whatsapp://` en la configuración
 * nativa (`app.json` → `ios.infoPlist.LSApplicationQueriesSchemes` y el
 * plugin `withWhatsAppQueries` para Android 11+). Sin esa declaración, el
 * sistema operativo siempre responde que no — por eso este chequeo solo es
 * confiable en un build nativo real (development client o el APK/IPA de
 * EAS), no dentro de Expo Go.
 */
export const isWhatsAppAvailable = async (): Promise<boolean> => {
  try {
    return await Linking.canOpenURL('whatsapp://send');
  } catch {
    return false;
  }
};
