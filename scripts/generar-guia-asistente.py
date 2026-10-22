"""Copia el contenido de la guía (src/app/pages/guia/guia.page.ts) a la Edge Function de Asis
(supabase/functions/asistente-chat/guia.ts), para que el asistente sepa lo mismo que la guía.

Uso (desde la raíz del proyecto, cada vez que cambie la guía, y luego volver a desplegar la función):
    python3 scripts/generar-guia-asistente.py
"""
import json
import pathlib
import re

RAIZ = pathlib.Path(__file__).resolve().parent.parent
FUENTE = RAIZ / 'src/app/pages/guia/guia.page.ts'
DESTINO = RAIZ / 'supabase/functions/asistente-chat/guia.ts'

CADENA = r"'((?:[^'\\]|\\.)*)'"


def limpiar(s: str) -> str:
    return s.replace("\\'", "'").replace('\\"', '"')


def temas(bloque: str):
    salida = []
    for m in re.finditer(r"titulo:\s*" + CADENA + r".*?descripcion:\s*" + CADENA + r".*?pasos:\s*\[(.*?)\]", bloque, re.S):
        pasos = [limpiar(p) for p in re.findall(CADENA, m.group(3))]
        salida.append({'titulo': limpiar(m.group(1)), 'descripcion': limpiar(m.group(2)), 'pasos': pasos})
    return salida


texto = FUENTE.read_text()
docente = texto[texto.index('const TEMAS_DOCENTE'):texto.index('const TEMAS_ESTUDIANTE')]
estudiante = texto[texto.index('const TEMAS_ESTUDIANTE'):texto.index('@Component')]

contenido = (
    '// GENERADO por scripts/generar-guia-asistente.py a partir de la guía de la app. No editar a mano.\n'
    'export interface TemaGuia { titulo: string; descripcion: string; pasos: string[] }\n'
    f'export const GUIA_DOCENTE: TemaGuia[] = {json.dumps(temas(docente), ensure_ascii=False, indent=2)};\n'
    f'export const GUIA_ESTUDIANTE: TemaGuia[] = {json.dumps(temas(estudiante), ensure_ascii=False, indent=2)};\n'
)
DESTINO.parent.mkdir(parents=True, exist_ok=True)
DESTINO.write_text(contenido)
print(f'Guía copiada: {len(temas(docente))} temas de docente, {len(temas(estudiante))} de estudiante -> {DESTINO.relative_to(RAIZ)}')
