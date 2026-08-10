-- Rediseño "dark vibrant SaaS": tema de acento personalizable por el docente para todo
-- su panel (ver ACCENT_PALETTES en src/app/shared/utils/subject-theme.util.ts). Se aplica
-- como CSS custom properties (--accent-from/--accent-to) vía AccentThemeService.
alter table docentes
  add column if not exists tema_acento text default 'emerald-teal';
