"""Limpia únicamente resultados regenerables; nunca perfiles o datos de juego."""
from pathlib import Path
import hashlib
import json
import shutil
import zipfile

ROOT = Path(__file__).resolve().parent.parent
removed = []
skipped = []


def remove(path):
    if path.is_symlink() or path.is_file():
        path.unlink()
    elif path.is_dir():
        shutil.rmtree(path)
    removed.append(str(path.relative_to(ROOT)))


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(chunk)
    return h.hexdigest()


# Las copias expandidas solo se retiran si el ZIP conserva exactamente su contenido.
for folder in sorted((ROOT / 'output/entrega').glob('Grimorio-Base3-*')):
    if not folder.is_dir() or folder.is_symlink():
        continue
    manifest = folder / '05-Version-y-avisos/manifest-entrega.json'
    archive = folder.parent / (folder.name + '.zip')
    checksum = archive.with_suffix('.sha256')
    if not manifest.is_file() or not archive.is_file() or not checksum.is_file():
        skipped.append(folder.name + ': sin ZIP, manifiesto o suma de comprobación')
        continue
    try:
        data = json.loads(manifest.read_text())
        assert data.get('generator') == 'grimorio-friend-kit'
        files = data['files']
        links = data.get('symlinks', {})
        known = set(files) | set(links) | {manifest.relative_to(folder).as_posix()}
        for path in folder.rglob('*'):
            if path.is_file() or path.is_symlink():
                assert path.name == '.DS_Store' or path.relative_to(folder).as_posix() in known, 'hay archivos añadidos'
        assert digest(archive) == checksum.read_text().split()[0], 'ZIP distinto de su suma'
        with zipfile.ZipFile(archive) as zipped:
            assert zipped.testzip() is None, 'ZIP dañado'
            assert zipped.read(folder.name + '/' + manifest.relative_to(folder).as_posix()) == manifest.read_bytes(), 'manifiestos distintos'
            for name, expected in files.items():
                assert digest(folder / name) == expected, f'archivo local modificado: {name}'
                h = hashlib.sha256()
                with zipped.open(folder.name + '/' + name) as stream:
                    for chunk in iter(lambda: stream.read(1024 * 1024), b''):
                        h.update(chunk)
                assert h.hexdigest() == expected, f'archivo no conservado en ZIP: {name}'
            for name, target in links.items():
                assert (folder / name).is_symlink() and (folder / name).readlink().as_posix() == target
                assert zipped.read(folder.name + '/' + name).decode() == target
        remove(folder)
    except (AssertionError, ValueError, KeyError, OSError, zipfile.BadZipFile) as error:
        skipped.append(folder.name + ': ' + str(error))

# Resultados de QA y archivos intermedios conocidos del empaquetador.
for name in ['output/qa', 'output/playwright', 'output/desktop']:
    path = ROOT / name
    if path.exists():
        remove(path)
for pattern in ['*.blockmap', '*.nsis.7z', 'builder-debug.yml', 'builder-effective-config.yaml']:
    for path in (ROOT / 'dist').glob(pattern):
        if path.is_file():
            remove(path)
for path in (ROOT / 'scripts').rglob('__pycache__'):
    if path.is_dir():
        remove(path)
for base in [ROOT, ROOT / 'docs', ROOT / 'desktop', ROOT / 'src', ROOT / 'scripts', ROOT / 'dist', ROOT / 'output']:
    paths = [base / '.DS_Store'] if base == ROOT else base.rglob('.DS_Store')
    for path in paths:
        if path.is_file():
            remove(path)
print('Eliminados:')
for name in removed:
    print('  ' + name)
if skipped:
    print('Conservados por precaución:')
    for name in skipped:
        print('  ' + name)
print('Se conservan ZIP, SHA-256, PDF, paquetes base de dist, dependencias y fuentes.')
