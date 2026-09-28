export interface SanitizeOptions {
  /** Mascara identidades (nomes, e-mails, avatares) e o nome da organização. */
  mask: boolean;
  organization: string;
  /** Nunca deve aparecer na saída; qualquer ocorrência é removida. */
  pat: string;
}

const IDENTITY_KEYS = new Set([
  'displayName',
  'uniqueName',
  'mailAddress',
  'imageUrl',
  'descriptor',
  'directoryAlias',
  'principalName',
]);
const EMAIL = /[\w.+-]+@[\w-]+(\.[\w-]+)+/g;
const NAME_WITH_EMAIL = /^.*<[^>]*@[^>]*>\s*$/;

function cleanString(s: string, o: SanitizeOptions): string {
  let out = o.pat && s.includes(o.pat) ? s.split(o.pat).join('[REDACTED]') : s;
  if (o.mask) {
    if (NAME_WITH_EMAIL.test(out)) return '[identidade]';
    out = out.replace(EMAIL, '[email]');
    if (o.organization) out = out.split(o.organization).join('{organization}');
  }
  return out;
}

export function sanitize(value: unknown, o: SanitizeOptions): unknown {
  if (typeof value === 'string') return cleanString(value, o);
  if (Array.isArray(value)) return value.map((v) => sanitize(v, o));
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = o.mask && IDENTITY_KEYS.has(k) && typeof v === 'string' ? '[mascarado]' : sanitize(v, o);
    }
    return out;
  }
  return value;
}

/** Garantia final: o PAT jamais pode ser gravado. */
export function assertNoSecret(serialized: string, pat: string): void {
  if (pat && serialized.includes(pat)) {
    throw new Error('Abortado: o PAT apareceu na saída. Nada foi gravado.');
  }
}
