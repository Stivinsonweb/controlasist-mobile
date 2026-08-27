export type MetodoPagoTipo = 'nequi' | 'daviplata' | 'bancolombia' | 'davivienda' | 'pse' | 'efectivo' | 'otro';

export interface MetodoPagoCatalogoItem {
  tipo: MetodoPagoTipo;
  label: string;
  placeholder: string;
  /** Color distintivo del ícono — no son los logos oficiales de cada entidad, solo un acento visual. */
  color: string;
}

export const METODOS_PAGO_CATALOGO: MetodoPagoCatalogoItem[] = [
  { tipo: 'nequi', label: 'Nequi', placeholder: 'Número de celular', color: '#d6006e' },
  { tipo: 'daviplata', label: 'Daviplata', placeholder: 'Número de celular', color: '#e2001a' },
  { tipo: 'bancolombia', label: 'Bancolombia', placeholder: 'Número de cuenta', color: '#fdda24' },
  { tipo: 'davivienda', label: 'Davivienda', placeholder: 'Número de cuenta', color: '#ed1c27' },
  { tipo: 'pse', label: 'PSE', placeholder: 'Instrucciones / enlace', color: '#004990' },
  { tipo: 'efectivo', label: 'Efectivo / Consignación', placeholder: 'Lugar o instrucciones', color: '#10b981' },
  { tipo: 'otro', label: 'Otro', placeholder: 'Detalle', color: '#64748b' },
];

export interface MetodoPagoConfig {
  tipo: MetodoPagoTipo;
  dato: string;
  activo: boolean;
}

export function catalogoMetodo(tipo: MetodoPagoTipo): MetodoPagoCatalogoItem {
  return METODOS_PAGO_CATALOGO.find((m) => m.tipo === tipo) ?? METODOS_PAGO_CATALOGO[METODOS_PAGO_CATALOGO.length - 1];
}

/** Construye la lista completa a partir de lo guardado — si nunca se ha configurado nada, todos quedan inactivos por defecto. */
export function normalizarMetodosPago(guardados: MetodoPagoConfig[] | null | undefined): MetodoPagoConfig[] {
  const mapa = new Map((guardados || []).map((m) => [m.tipo, m]));
  return METODOS_PAGO_CATALOGO.map((c) => mapa.get(c.tipo) || { tipo: c.tipo, dato: '', activo: false });
}
