#!/usr/bin/env python3
"""
Gera e sincroniza o shell compartilhado (menu lateral + topbar mobile) em todas
as páginas estáticas do portal computacaounemat.github.io (sem iframes).

Uso:
    python3 sites/computacaounemat.github.io/scripts/build_shell.py
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
import re


ROOT = Path(__file__).resolve().parent.parent

HEAD_START = "<!-- BCC-PORTAL-HEAD:START -->"
HEAD_END = "<!-- BCC-PORTAL-HEAD:END -->"
OPEN_START = "<!-- BCC-PORTAL-SHELL:START -->"
OPEN_END = "<!-- BCC-PORTAL-SHELL:END -->"
CLOSE_START = "<!-- BCC-PORTAL-SHELL:CLOSE-START -->"
CLOSE_END = "<!-- BCC-PORTAL-SHELL:CLOSE-END -->"


@dataclass(frozen=True)
class PageSpec:
    rel_path: str
    page_id: str
    prefix: str  # "./" na raiz, "../" nas subpastas
    mobile_title: str


PAGES: list[PageSpec] = [
    PageSpec("index.html", "horarios-2027-1", "./", "Horários 2027/1"),
    PageSpec("horarios-2026-2/index.html", "horarios-2026-2", "../", "Horários 2026/2"),
    PageSpec("guia/index.html", "guia", "../", "Guia do Estudante"),
    PageSpec("estagio/index.html", "estagio", "../", "Guia do Estágio"),
    PageSpec("tcc/index.html", "tcc", "../", "Guia do TCC"),
    PageSpec("marca/index.html", "marca", "../", "Marca do Curso"),
    PageSpec("secomp/index.html", "secomp", "../", "SECOMP 2026"),
    PageSpec("eventos/index.html", "eventos", "../", "Memória de Eventos"),
]


def render_head(prefix: str) -> str:
    return "\n".join(
        [
            HEAD_START,
            '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">',
            f'<link rel="stylesheet" href="{prefix}assets/portal/portal-shell.css">',
            HEAD_END,
        ]
    )


def nav_link(
    href: str,
    icon_class: str,
    icon_color: str,
    label: str,
    active: bool = False,
    external: bool = False,
    badge: tuple[str, str] | None = None,
) -> str:
    cls = "bcc-nav-link is-active" if active else "bcc-nav-link"
    attrs = [f'href="{href}"', f'class="{cls}"']
    if active:
        attrs.append('aria-current="page"')
    if external:
        attrs.append('target="_blank"')
        attrs.append('rel="noopener noreferrer"')
    badge_html = ""
    if badge:
        b_text, b_mod = badge
        b_cls = f"bcc-nav-badge bcc-nav-badge--{b_mod}" if b_mod else "bcc-nav-badge"
        badge_html = f'<span class="{b_cls}">{b_text}</span>'
    return (
        f'          <li><a {" ".join(attrs)}>'
        f'<i class="{icon_class} bcc-nav-icon" style="color:{icon_color};" aria-hidden="true"></i>'
        f"<span>{label}</span>{badge_html}</a></li>"
    )


def render_open(spec: PageSpec) -> str:
    p = spec.prefix
    a = spec.page_id

    internal_links = [
        nav_link(
            f"{p}",
            "fa-solid fa-calendar-days",
            "#8DC63F",
            "Horários 2027/1",
            active=(a == "horarios-2027-1"),
            badge=("Atual", "green"),
        ),
        nav_link(
            f"{p}horarios-2026-2/",
            "fa-solid fa-calendar-days",
            "#009EE0",
            "Horários 2026/2",
            active=(a == "horarios-2026-2"),
        ),
        nav_link(f"{p}guia/", "fa-solid fa-book-open", "#34d399", "Guia do Estudante", active=(a == "guia")),
        nav_link(f"{p}estagio/", "fa-solid fa-briefcase", "#38bdf8", "Guia do Estágio", active=(a == "estagio")),
        nav_link(f"{p}tcc/", "fa-solid fa-graduation-cap", "#fbbf24", "Guia do TCC", active=(a == "tcc")),
        nav_link(f"{p}marca/", "fa-solid fa-palette", "#22d3ee", "Marca do Curso", active=(a == "marca")),
        nav_link(f"{p}secomp/", "fa-solid fa-microchip", "#c084fc", "SECOMP 2026", active=(a == "secomp")),
        nav_link(f"{p}eventos/", "fa-solid fa-clock-rotate-left", "#8DC63F", "Memória de Eventos", active=(a == "eventos")),
    ]

    online_systems_links = [
        nav_link(
            "https://ialxnder.fly.dev/mural",
            "fa-solid fa-tv",
            "#38bdf8",
            "Mural Digital",
            external=True,
        ),
        nav_link(
            "https://ialxnder.fly.dev/estagio",
            "fa-solid fa-file-signature",
            "#38bdf8",
            "Portal de Estágio",
            external=True,
        ),
        nav_link(
            "https://ialxnder.fly.dev/tcc",
            "fa-solid fa-book-bookmark",
            "#fbbf24",
            "Portal de TCC",
            external=True,
        ),
        nav_link(
            "https://ialxnder.fly.dev/planos",
            "fa-solid fa-clipboard-check",
            "#34d399",
            "Validador de Planos",
            external=True,
        ),
        nav_link(
            "https://ialxnder.fly.dev/camisetas",
            "fa-solid fa-shirt",
            "#22d3ee",
            "Camiseta BCC",
            external=True,
            badge=("R$ 35", ""),
        ),
        nav_link(
            "https://sistema-unemat.vercel.app/",
            "fa-solid fa-computer",
            "#94a3b8",
            "Agenda de Laboratórios",
            external=True,
        ),
        nav_link(
            "https://ialxnder.fly.dev/mural/assistente",
            "fa-solid fa-robot",
            "#38bdf8",
            "Assistente Virtual",
            external=True,
            badge=("iALXnder", "cyan"),
        ),
    ]

    external_links = [
        nav_link(
            "https://sigaa.unemat.br/sigaa/verTelaLogin.do",
            "fa-solid fa-building-columns",
            "#94a3b8",
            "SIGAA UNEMAT",
            external=True,
        ),
        nav_link(
            "https://unemat.br/",
            "fa-solid fa-globe",
            "#94a3b8",
            "Portal UNEMAT",
            external=True,
        ),
        nav_link(
            "https://www.instagram.com/computacao.unemataia/",
            "fa-brands fa-instagram",
            "#34d399",
            "Instagram do Curso",
            external=True,
        ),
    ]

    return "\n".join(
        [
            OPEN_START,
            '<a class="bcc-skip-link" href="#bcc-conteudo-principal">Pular para o conteúdo principal</a>',
            '<div id="bcc-sidebar-overlay" class="bcc-sidebar-overlay" aria-hidden="true"></div>',
            '<div class="bcc-shell">',
            '  <aside id="bcc-sidebar" class="bcc-sidebar" aria-label="Menu principal do curso">',
            '    <div class="bcc-sidebar-brand">',
            '      <button type="button" id="bcc-btn-close-sidebar" class="bcc-close-btn" aria-label="Fechar menu">',
            '        <i class="fa-solid fa-xmark" aria-hidden="true"></i>',
            "      </button>",
            f'      <a href="{p}" class="bcc-brand-link">',
            f'        <img src="{p}marca/arquivos/logo_bcc_horizontal_fundo_transparente_texto_branco.png" alt="Ciência da Computação — UNEMAT" class="bcc-brand-logo">',
            '        <span class="bcc-brand-sub">UNEMAT · Alto Araguaia &amp; Rondonópolis</span>',
            "      </a>",
            "    </div>",
            '    <nav class="bcc-nav" aria-label="Navegação do portal">',
            '      <p class="bcc-nav-group-label">Menu Principal</p>',
            '      <ul class="bcc-nav-list">',
            *internal_links,
            "      </ul>",
            '      <p class="bcc-nav-group-label">Sistemas Online</p>',
            '      <ul class="bcc-nav-list">',
            *online_systems_links,
            "      </ul>",
            '      <p class="bcc-nav-group-label">Links Externos</p>',
            '      <ul class="bcc-nav-list">',
            *external_links,
            "      </ul>",
            "    </nav>",
            '    <div class="bcc-sidebar-footer">',
            '      <p class="bcc-sidebar-footer-title">Secretaria Acadêmica</p>',
            '      <p class="bcc-sidebar-footer-row"><strong>Alto Araguaia:</strong> 08h–11h / 13h30–17h30</p>',
            '      <p class="bcc-sidebar-footer-row"><strong>Rondonópolis:</strong> 08h–11h / 14h–21h30</p>',
            "    </div>",
            "  </aside>",
            '  <div class="bcc-main-col">',
            '    <div class="bcc-mobile-topbar">',
            '      <button type="button" id="bcc-btn-hamburger" class="bcc-hamburger" aria-label="Abrir menu" aria-expanded="false" aria-controls="bcc-sidebar">',
            '        <i class="fa-solid fa-bars" aria-hidden="true"></i>',
            "      </button>",
            f'      <a href="{p}" class="bcc-mobile-title">{spec.mobile_title}</a>',
            '      <span class="bcc-mobile-campus">UNEMAT BCC</span>',
            "    </div>",
            '    <div id="bcc-conteudo-principal" class="bcc-content" tabindex="-1">',
            OPEN_END,
        ]
    )


def render_close(prefix: str) -> str:
    return "\n".join(
        [
            CLOSE_START,
            "    </div>",
            "  </div>",
            "</div>",
            f'<script src="{prefix}assets/portal/portal-shell.js" defer></script>',
            CLOSE_END,
        ]
    )


def replace_block(text: str, start_marker: str, end_marker: str, replacement: str) -> str:
    pattern = re.compile(re.escape(start_marker) + r".*?" + re.escape(end_marker), re.S)
    if not pattern.search(text):
        raise RuntimeError(f"Marcador não encontrado: {start_marker}")
    return pattern.sub(lambda _: replacement, text, count=1)


def sync_all() -> None:
    for spec in PAGES:
        path = ROOT / spec.rel_path
        text = path.read_text(encoding="utf-8")
        text = replace_block(text, HEAD_START, HEAD_END, render_head(spec.prefix))
        text = replace_block(text, OPEN_START, OPEN_END, render_open(spec))
        text = replace_block(text, CLOSE_START, CLOSE_END, render_close(spec.prefix))
        path.write_text(text, encoding="utf-8")
        print(f"SYNCED: {spec.rel_path} (active={spec.page_id})")


if __name__ == "__main__":
    sync_all()
