/**
 * Catálogo fijo de accesos rápidos disponibles para el coach (RF-E1-02).
 * El orden aquí determina el orden de visualización en el dashboard.
 */

export interface QuickAccessItem {
  key:    string;
  emoji:  string;
  label:  string;
  route:  string;
  color:  string;
  subtle: string;
}

export const QUICK_ACCESS_CATALOG: QuickAccessItem[] = [
  { key: 'clients',   emoji: '👥', label: 'Clientes',  route: '/(coach)/clients',   color: '#2563EB', subtle: '#EFF6FF' },
  { key: 'routines',  emoji: '📋', label: 'Rutinas',   route: '/(coach)/routines',  color: '#7C3AED', subtle: '#F5F3FF' },
  { key: 'nutrition', emoji: '🥗', label: 'Nutrición', route: '/(coach)/nutrition', color: '#059669', subtle: '#ECFDF5' },
  { key: 'calendar',  emoji: '📅', label: 'Agenda',    route: '/(coach)/calendar',  color: '#D97706', subtle: '#FFFBEB' },
  { key: 'videos',    emoji: '🎬', label: 'Vídeos',    route: '/(coach)/videos',    color: '#DC2626', subtle: '#FEF2F2' },
  { key: 'messages',  emoji: '💬', label: 'Mensajes',  route: '/(coach)/messages',  color: '#0891B2', subtle: '#ECFEFF' },
];

export const DEFAULT_QUICK_ACCESS: string[] = ['clients', 'routines', 'nutrition'];

export function getActiveShortcuts(selected: string[]): QuickAccessItem[] {
  return QUICK_ACCESS_CATALOG.filter((item) => selected.includes(item.key));
}
