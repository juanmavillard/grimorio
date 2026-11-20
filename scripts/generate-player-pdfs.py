"""Genera cuatro páginas públicas por guion, una por categoría de personaje."""
import json
from math import ceil
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import (
    KeepTogether, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle,
)
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / 'output/qa/player-sheets.json').read_text())
TEAMS = (
    ('townsfolk', 'Aldeanos', '#205979'),
    ('outsider', 'Forasteros', '#205979'),
    ('minion', 'Esbirros', '#922e3d'),
    ('demon', 'Demonios', '#922e3d'),
)
BODY = ParagraphStyle(
    'body', fontName='Helvetica', fontSize=11, leading=12.4,
    textColor=colors.HexColor('#242b34'), spaceAfter=2,
)
HEADING = ParagraphStyle(
    'role', parent=BODY, fontName='Helvetica-Bold', fontSize=12,
    leading=14, spaceBefore=3, spaceAfter=2,
)
TITLE = ParagraphStyle('title', parent=HEADING, fontSize=21, leading=25, spaceAfter=5)
CATEGORY = ParagraphStyle('category', parent=HEADING, fontSize=16, leading=19, spaceAfter=8)


def clean(text):
    return escape(text.replace('\u2011', '-').replace('\u2013', '-').replace('\u2014', '-'))


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 11)
    canvas.setFillColor(colors.HexColor('#465463'))
    canvas.drawString(34, 23, f'Grimorio privado · Jugadores · {DATA["version"]}')
    canvas.drawRightString(A4[0] - 34, 23, f'{doc.page} / 4')
    canvas.restoreState()


def character_block(role, color):
    return [
        Paragraph(f'<a href="{role["source"]}" color="{color}">{clean(role["name"])}</a>', HEADING),
        Paragraph(clean(role['ability']), BODY),
        Paragraph(f'<b>Cuándo:</b> {clean(role["moment"])}. {clean(role["clarification"])}', BODY),
        Spacer(1, 5),
    ]


for sheet in DATA['sheets']:
    slug = sheet['id'].replace('_', '-')
    path = ROOT / f'output/pdf/personajes-jugadores-{slug}.pdf'
    doc = SimpleDocTemplate(
        str(path), pagesize=A4, leftMargin=30, rightMargin=30, topMargin=24,
        bottomMargin=42, title=f'Personajes para jugadores · {sheet["name"]}',
        author='Grimorio privado',
    )
    roles = sheet['characters']
    flow = []
    for page, (team, category, color) in enumerate(TEAMS):
        if page:
            flow.append(PageBreak())
        flow.extend([
            Paragraph(clean(sheet['name']), TITLE),
            Paragraph(f'<font color="{color}">{category}</font>', CATEGORY),
        ])
        if page == 1:
            flow.extend([
                Paragraph('Guion completo: no todos estos personajes estarán en la partida. <b>Noche*</b>: todas las noches excepto la primera. Los nombres enlazan a la fuente oficial.', BODY),
                Spacer(1, 6),
            ])
        group = [role for role in roles if role['team'] == team]
        if team == 'townsfolk':
            # Dos columnas mantienen los trece Aldeanos en una página con letra de 11 puntos.
            split = ceil(len(group) / 2)
            columns = [[], []]
            for column, chunk in zip(columns, (group[:split], group[split:])):
                for role in chunk:
                    column.extend(character_block(role, color))
            table = Table([columns], colWidths=[doc.width / 2] * 2, hAlign='LEFT')
            table.setStyle(TableStyle([
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (0, -1), 0),
                ('RIGHTPADDING', (0, 0), (0, -1), 9),
                ('LEFTPADDING', (1, 0), (1, -1), 9),
                ('RIGHTPADDING', (1, 0), (1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ]))
            flow.append(table)
        else:
            for role in group:
                flow.append(KeepTogether(character_block(role, color)))
        if page == 3:
            flow.extend([
                Spacer(1, 12),
                Paragraph('<b>Recuerda:</b> Aldeanos y Forasteros empiezan buenos; Esbirros y Demonios, malvados. Personaje y alineamiento pueden cambiar. La borrachera o el veneno pueden alterar tu habilidad o información sin que lo sepas. Las habilidades están parafraseadas.', BODY),
            ])
    doc.build(flow, onFirstPage=footer, onLaterPages=footer)
    reader = PdfReader(path)
    assert len(reader.pages) == 4, f'{path}: se esperaban cuatro páginas, hay {len(reader.pages)}'
    for page, (team, category, _) in zip(reader.pages, TEAMS):
        text = page.extract_text()
        assert category in text
        for role in roles:
            if role['team'] == team:
                assert role['name'] in text.splitlines(), f'Falta {role["name"]} en {category}'
            else:
                assert role['name'] not in text.splitlines(), f'{role["name"]} se ha mezclado con {category}'
    print(f'{path.name}: cuatro páginas por categoría, {len(roles)} personajes comprobados')
