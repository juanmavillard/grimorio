"""Prepara una entrega local Mac o Windows con manuales HTML, sin perfiles ni partidas."""
import hashlib
import json
import os
from pathlib import Path
import plistlib
import re
import shutil
import subprocess
import sys
from html import escape
from html.parser import HTMLParser
from urllib.parse import quote, unquote, urlsplit

import markdown
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
VERSION = json.loads((ROOT / 'package.json').read_text())['version']
TARGET = sys.argv[1] if len(sys.argv) > 1 else 'mac'
if TARGET not in ('mac', 'win'):
    raise SystemExit('Indica mac o win como plataforma de entrega.')
WINDOWS = TARGET == 'win'
PLATFORM_LABEL = 'Windows x64' if WINDOWS else 'Mac universal'
NAME = f'Grimorio-Base3-{VERSION}-' + ('Windows' if WINDOWS else 'Mac')
DEST = ROOT / 'output/entrega' / NAME
APP = ROOT / (f'dist/Grimorio-Base3-{VERSION}-Windows.exe' if WINDOWS else 'dist/mac-universal/Grimorio Base 3.app')
ASAR = ROOT / 'dist/win-unpacked/resources/app.asar' if WINDOWS else APP / 'Contents/Resources/app.asar'
MANIFEST = DEST / '05-Version-y-avisos/manifest-entrega.json'

CSS = '''
:root{color-scheme:light;--ink:#1f2c3c;--muted:#526172;--blue:#234e6b;--line:#dce3e8;--paper:#fff;--bg:#f3f5f6}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:17px/1.65 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
a{color:#174e77;text-underline-offset:.18em}a:hover{color:#8c342b}a:focus-visible,summary:focus-visible{outline:3px solid #a55b0c;outline-offset:4px;border-radius:3px}
.top{background:#152b3e;color:#fff;padding:20px max(22px,calc((100% - 1000px)/2));display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap}.top a{color:#fff}.brand{font-weight:750;letter-spacing:.02em}.top nav{display:flex;gap:20px;flex-wrap:wrap;font-size:15px}
main{max-width:1000px;margin:32px auto;background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:36px 44px;box-shadow:0 5px 25px #13283d08}.tag{font-size:13px;letter-spacing:.07em;text-transform:uppercase;font-weight:750;color:var(--blue);margin:0 0 10px}h1{font-size:clamp(28px,4vw,40px);line-height:1.18;letter-spacing:-.025em;margin:0 0 25px}h2{font-size:25px;line-height:1.3;margin:40px 0 16px;border-top:1px solid var(--line);padding-top:22px}h3{font-size:20px;margin:25px 0 10px}p{margin:12px 0}li{margin:7px 0}strong{font-weight:720}code{font: .91em ui-monospace,monospace;background:#f0f3f5;padding:2px 5px;border-radius:4px;overflow-wrap:anywhere}pre{padding:15px;background:#f0f3f5;overflow:auto;border-radius:6px}pre code{padding:0}blockquote{margin:20px 0;padding:8px 22px;background:#f5f8fa;border-left:4px solid #66889e}table{border-collapse:collapse;width:100%;margin:18px 0;font-size:16px;display:block;overflow:auto}th{background:#edf3f6;text-align:left}th,td{padding:11px 14px;border:1px solid var(--line);vertical-align:top;min-width:110px}.notice{padding:14px 18px;background:#faf2e4;border:1px solid #e1cfa7;border-radius:9px;font-size:15px}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:25px 0}.card{padding:18px;border:1px solid var(--line);border-radius:10px;background:#f8fafb}.card h2{border:0;margin:0 0 9px;padding:0;font-size:21px}.card p{font-size:15px}.card a{font-weight:700}.tocbox{background:#f6f8fa;border:1px solid var(--line);border-radius:8px;padding:12px 18px;margin:22px 0}.tocbox summary{cursor:pointer;font-weight:650}.tocbox ul{margin:10px 0;padding-left:23px}.tocbox a{font-size:15px}.footer{max-width:1000px;padding:0 24px 30px;margin:auto;font-size:14px;color:var(--muted)}.footer a{color:var(--muted)}.skip{position:absolute;left:-10000px}.skip:focus{left:15px;top:10px;background:#fff;padding:12px;z-index:5}
@media(max-width:700px){main{margin:14px 10px;padding:24px 20px;border-radius:10px}.cards{grid-template-columns:1fr}.top{padding:18px 20px}.top nav{gap:14px}h2{font-size:23px}.notice{font-size:15px}}
@media print{body{background:#fff;font-size:11pt}.top,.tocbox,.skip,.footer,.cards{display:none}main{border:0;margin:0;padding:0;box-shadow:none;max-width:none}h1{font-size:24pt}h2{font-size:16pt;break-after:avoid}h3{break-after:avoid}table{display:table;font-size:10pt}tr{break-inside:avoid}a{color:inherit}}
'''


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


def relative_link(source, target):
    return quote(os.path.relpath(target, source.parent), safe='/#')


def write_page(target, title, body, toc='', label='Manual de consulta', landing=False):
    target.parent.mkdir(parents=True, exist_ok=True)
    home = relative_link(target, DEST / 'EMPIEZA-AQUI.html')
    read = relative_link(target, DEST / '02-Primeros-pasos/que-leer.html')
    manuals = relative_link(target, DEST / '04-Manuales/index.html')
    sheets = relative_link(target, DEST / '03-Hojas-para-jugadores/index.html')
    notices = relative_link(target, DEST / '05-Version-y-avisos/version-y-uso.html')
    cards = ''
    if landing:
        cards = f'''<div class="cards"><section class="card"><h2>Voy a jugar</h2><p>Objetivo, turnos y personajes. No tienes que instalar nada.</p><a href="{relative_link(target, DEST / '04-Manuales/general/guia-jugadores-nuevos.html')}">Entender el juego</a></section><section class="card"><h2>Voy a narrar</h2><p>Material, ensayo y primera sesión con Trouble Brewing.</p><a href="{relative_link(target, DEST / '02-Primeros-pasos/primera-partida.html')}">Preparar mi primera partida</a></section><section class="card"><h2>Conozco el juego</h2><p>Pantallas, archivos y controles del Grimorio.</p><a href="{relative_link(target, DEST / '02-Primeros-pasos/uso-rapido.html')}">Aprender los controles</a></section></div>'''
    if landing:
        body = body.replace('</h1>', '</h1>' + cards, 1)
        toc = ''
    content = f'''<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; base-uri 'none'; form-action 'none'"><title>{escape(title)} · Grimorio</title><style>{CSS}</style></head><body><a class="skip" href="#contenido">Saltar al contenido</a><header class="top"><span class="brand">GRIMORIO · BASE 3</span><nav aria-label="Documentación"><a href="{home}">Inicio</a><a href="{read}">Qué leer</a><a href="{sheets}">Hojas de jugadores</a><a href="{manuals}">Manuales</a></nav></header><main id="contenido"><p class="tag">{escape(label)} · {PLATFORM_LABEL} · versión {VERSION} · sin conexión</p>{f'<details class="tocbox"><summary>En esta página</summary>{toc}</details>' if toc else ''}{body}</main><footer class="footer">Material no oficial. No afiliado a The Pandemonium Institute. <a href="{notices}">Versión, fuentes y condiciones de uso</a>. Los enlaces oficiales externos necesitan Internet.</footer></body></html>'''
    target.write_text(content, encoding='utf-8')


if not WINDOWS and sys.platform != 'darwin':
    raise SystemExit('La entrega Mac conserva el paquete .app: genérala en macOS.')
if not APP.exists():
    raise SystemExit(f'Primero genera y verifica el programa: {APP.name}')
if WINDOWS:
    expected = (ROOT / 'dist/SHA256-win.txt').read_text().split()[0]
    assert digest(APP) == expected, 'El ejecutable Windows no coincide con su suma de comprobación.'
    with APP.open('rb') as stream:
        assert stream.read(2) == b'MZ', 'El archivo no es un ejecutable Windows.'
else:
    with (APP / 'Contents/Info.plist').open('rb') as stream:
        assert plistlib.load(stream)['CFBundleShortVersionString'] == VERSION, 'La aplicación no coincide con la versión del proyecto.'
subprocess.run(['node', 'scripts/check-desktop-package.js', str(ASAR)], cwd=ROOT, check=True)

# Solo se reemplaza una entrega creada por este generador; nunca perfiles del usuario.
if DEST.exists():
    if not MANIFEST.exists():
        raise SystemExit(f'{DEST}: existe sin manifiesto del generador; no se sobrescribe.')
    old = json.loads(MANIFEST.read_text())
    if old.get('generator') != 'grimorio-friend-kit':
        raise SystemExit('El directorio existente no pertenece a este generador.')
    managed = set(old['files']) | set(old.get('symlinks', {})) | {MANIFEST.relative_to(DEST).as_posix()}
    unexpected = [p for p in DEST.rglob('*') if p.is_file() and p.name != '.DS_Store' and p.relative_to(DEST).as_posix() not in managed]
    if unexpected:
        raise SystemExit('Hay archivos añadidos manualmente: conserva esa carpeta antes de regenerar.')
    shutil.rmtree(DEST)
DEST.mkdir(parents=True)

# Las fuentes legibles se convierten con enlaces locales controlados; no se entrega el repositorio.
sources = {}
for source in (ROOT / 'docs/manuales').rglob('*.md'):
    path = source.relative_to(ROOT / 'docs/manuales')
    sources[source.resolve()] = DEST / '04-Manuales' / ('index.html' if path.name == 'README.md' else str(path.with_suffix('.html')))
for source in (ROOT / 'docs/entrega').glob('*.md'):
    location = {'empieza-aqui': 'EMPIEZA-AQUI.html', 'version-y-uso': '05-Version-y-avisos/version-y-uso.html'}.get(source.stem, f'02-Primeros-pasos/{source.stem}.html')
    sources[source.resolve()] = DEST / location
sources[(ROOT / 'docs/README.md').resolve()] = DEST / '04-Manuales/index.html'

for source, target in sources.items():
    if source == (ROOT / 'docs/README.md').resolve():
        continue
    text = source.read_text()
    if source == (ROOT / 'docs/manuales/README.md').resolve():
        text = text.replace('Para arquitectura, fuentes y auditorías, vuelve al [índice completo de documentación](../README.md).', 'Esta carpeta contiene los manuales de juego y uso; los informes de desarrollo permanecen en el proyecto original.')
    def replace_link(match):
        title, url = match.groups()
        parts = urlsplit(url)
        if parts.scheme or url.startswith('#'):
            return match.group(0)
        destination = (source.parent / unquote(parts.path)).resolve()
        if destination not in sources:
            raise ValueError(f'Enlace no incluido: {source.name} -> {url}')
        return f'[{title}]({relative_link(target, sources[destination])}{"#" + parts.fragment if parts.fragment else ""})'
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', replace_link, text)
    converter = markdown.Markdown(extensions=['tables', 'fenced_code', 'toc', 'attr_list'])
    body = converter.convert(text)
    title = next(line[2:] for line in text.splitlines() if line.startswith('# '))
    label = 'Para empezar' if source.parent.name == 'entrega' else 'Manual de consulta'
    if source.name == 'personajes.md':
        label = 'Almanaque completo del Narrador'
    elif source.name in ['personajes-jugadores.md', 'guia-jugadores-nuevos.md']:
        label = 'Material para jugadores'
    write_page(target, title, body, converter.toc, label, target.name == 'EMPIEZA-AQUI.html')

# PDF públicos: fuente de verdad separada de cualquier partida.
pdf_folder = DEST / '03-Hojas-para-jugadores'
pdf_folder.mkdir()
public_links = []
for slug, title in [('trouble-brewing', 'Trouble Brewing'), ('bad-moon-rising', 'Bad Moon Rising'), ('sects-and-violets', 'Sects & Violets')]:
    source = ROOT / f'output/pdf/personajes-jugadores-{slug}.pdf'
    assert len(PdfReader(source).pages) == 4, f'Regenera el PDF de {title}: se esperan cuatro páginas.'
    filename = f'personajes-jugadores-{slug}.pdf'
    shutil.copyfile(source, pdf_folder / filename)
    public_links.append(f'<li><a href="{filename}">{title}: personajes para jugadores (PDF, cuatro páginas)</a></li>')
write_page(pdf_folder / 'index.html', 'Hojas de personajes para jugadores', '<h1>Hojas de personajes para jugadores</h1><p>Entrega a todos la misma hoja del guion que vais a jugar. Incluye personajes fuera de juego; no muestra el reparto real.</p><p>Cada PDF tiene una página para Aldeanos, otra para Forasteros, otra para Esbirros y otra para Demonios. Las habilidades están parafraseadas y los nombres enlazan a su fuente oficial.</p><ul>' + ''.join(public_links) + '</ul><p>Para una primera sesión, empieza por Trouble Brewing. No es necesario imprimir las hojas de los otros guiones.</p>', label='Material público')

# Solo el ejecutable portátil o la aplicación autorizada; nunca perfiles.
program = DEST / '01-Programa'
program.mkdir()
if WINDOWS:
    shutil.copy2(APP, program / APP.name)
    instructions = f'Abre {APP.name} con doble clic desde el Explorador.\nRequiere Windows 10/11 de 64 bits. No necesita instalación ni administrador.\nEs una compilación no firmada: SmartScreen puede advertir sobre un editor desconocido.\nConsulta EMPIEZA-AQUI.html. La ejecución real en Windows está pendiente de comprobación.\n'
else:
    subprocess.run(['/usr/bin/ditto', '--noextattr', '--noqtn', str(APP), str(program / APP.name)], check=True)
    subprocess.run(['node', 'scripts/check-desktop-package.js', str(program / APP.name / 'Contents/Resources/app.asar')], cwd=ROOT, check=True)
    instructions = 'Abre Grimorio Base 3.app con doble clic desde Finder.\nPuedes moverla a Aplicaciones. Requiere macOS 13 o posterior.\nSi macOS la bloquea, consulta EMPIEZA-AQUI.html y la guía de escritorio.\n'
(program / 'ABRIR-PROGRAMA.txt').write_text(instructions, encoding='utf-8')
(DEST / 'LEEME.txt').write_text(f'GRIMORIO BASE 3 · {VERSION} · {PLATFORM_LABEL}\n\n1. Extrae todo el ZIP.\n2. Abre EMPIEZA-AQUI.html para elegir qué leer.\n3. Abre el programa incluido en 01-Programa (solo {PLATFORM_LABEL}).\n4. Las hojas PDF están en 03-Hojas-para-jugadores.\n\nNo hace falta instalar herramientas ni conectarse a Internet.\nNo hay partidas personales en esta carpeta.\nLee 05-Version-y-avisos/version-y-uso.html antes de compartir: esta preparación local no concede un permiso de distribución.\n', encoding='utf-8')
notice_folder = DEST / '05-Version-y-avisos'
shutil.copyfile(ROOT / 'desktop/THIRD_PARTY_NOTICES.md', notice_folder / 'DEPENDENCIAS.txt')

# Comprueba todos los enlaces internos de la documentación, sin necesitar un servidor.
class Links(HTMLParser):
    def __init__(self):
        super().__init__(); self.links = []; self.ids = set()
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.add(attrs['id'])
        if tag == 'a' and 'href' in attrs:
            self.links.append(attrs['href'])

pages = {}
for path in DEST.rglob('*.html'):
    if '01-Programa' in path.relative_to(DEST).parts:
        continue
    parser = Links(); parser.feed(path.read_text()); pages[path] = parser
for path, parser in pages.items():
    for link in parser.links:
        parts = urlsplit(link)
        if parts.scheme:
            assert parts.scheme in ['https', 'mailto'], f'Enlace externo no autorizado: {link}'
            continue
        target = (path.parent / unquote(parts.path)).resolve() if parts.path else path
        assert target.is_relative_to(DEST.resolve()) and target.exists(), f'Enlace roto: {path} -> {link}'
        if parts.fragment and target in pages:
            assert unquote(parts.fragment) in pages[target].ids, f'Ancla rota: {link}'

files = {path.relative_to(DEST).as_posix(): digest(path) for path in sorted(DEST.rglob('*')) if path.is_file() and not path.is_symlink()}
inputs = {str(path.relative_to(ROOT)): digest(path) for path in sources if path.name != 'README.md' or path.parent.name == 'manuales'}
inputs.update({str(path.relative_to(ROOT)): digest(path) for path in (ROOT / 'output/pdf').glob('personajes-jugadores-*.pdf')})
symlinks = {path.relative_to(DEST).as_posix(): os.readlink(path) for path in DEST.rglob('*') if path.is_symlink()}
for path in symlinks:
    assert (DEST / path).resolve().is_relative_to(DEST.resolve()), f'Enlace simbólico fuera del paquete: {path}'
MANIFEST.write_text(json.dumps({'symlinks': symlinks, 'generator': 'grimorio-friend-kit', 'version': VERSION, 'platform': 'windows-x64' if WINDOWS else 'mac-universal', 'files': files, 'sources': inputs, 'htmlPages': len(pages), 'publicCharacters': 72, 'distributionPermission': 'not-granted-by-this-kit'}, ensure_ascii=False, indent=2) + '\n')
archive = DEST.parent / (DEST.name + '.zip')
if WINDOWS:
    import zipfile
    with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6) as output:
        for path in sorted(DEST.rglob('*')):
            if path.is_file():
                output.write(path, Path(DEST.name) / path.relative_to(DEST))
else:
    subprocess.run(['/usr/bin/ditto', '-c', '-k', '--keepParent', '--norsrc', '--noextattr', '--noqtn', str(DEST), str(archive)], check=True)
archive.with_suffix('.sha256').write_text(f'{digest(archive)}  {archive.name}\n')
print(f'Carpeta preparada: {DEST}')
print(f'ZIP: {archive} ({archive.stat().st_size / 1024 / 1024:.1f} MiB)')
print(f'Verificados: {len(pages)} documentos HTML, tres PDF, programa {PLATFORM_LABEL} y enlaces locales.')
print('Preparación local: no se publica ni envía nada; permiso de distribución pendiente.')
