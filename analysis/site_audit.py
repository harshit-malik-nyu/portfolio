"""Check every committed HTML page's local href/src targets and HTML fragments.

Offline structural checks only; not browser rendering, remote URL health, CSS URL
resolution, JavaScript-generated links, or employer validation.
"""
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import json
import subprocess

ROOT = Path(__file__).resolve().parents[1]


class Page(HTMLParser):
    def __init__(self, text):
        super().__init__()
        self.ids = []
        self.links = []
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if 'id' in values:
            self.ids.append(values['id'])
        for name in ('href', 'src'):
            if name in values:
                self.links.append(values[name])


def resolve(root, source, url):
    parts = urlsplit(url)
    if parts.scheme or parts.netloc:
        return None
    route = unquote(parts.path)
    candidate = ((root / route.lstrip('/')) if route.startswith('/')
                 else source.parent / route) if route else source
    candidate = candidate.resolve()
    if not candidate.is_relative_to(root.resolve()):
        raise ValueError('target escapes site root')
    options = [candidate]
    if candidate.is_dir():
        options = [candidate / 'index.html']
    elif not candidate.suffix:
        options += [candidate.with_suffix('.html'), candidate / 'index.html']
    target = next((p for p in options if p.is_file()), None)
    if target is None:
        raise ValueError('missing local target')
    return target, unquote(parts.fragment)


def audit(root, pages):
    cache = {}
    errors = []
    checked = 0

    def parsed(path):
        if path not in cache:
            cache[path] = Page(path.read_text(encoding='utf-8'))
        return cache[path]

    for source in pages:
        page = parsed(source)
        for identity, count in Counter(page.ids).items():
            if count > 1:
                errors.append(f'{source.relative_to(root)}: duplicate id {identity!r}')
        for link in page.links:
            try:
                result = resolve(root, source, link)
                if result is None:
                    continue
                target, fragment = result
                checked += 1
                if fragment and target.suffix == '.html' and fragment not in parsed(target).ids:
                    raise ValueError('missing HTML fragment')
            except ValueError as exc:
                errors.append(f'{source.relative_to(root)}: {link!r}: {exc}')
    return dict(html_pages=len(pages), local_references_checked=checked, errors=errors,
                scope='Static href/src targets, clean HTML routes, fragments and duplicate IDs; no remote or runtime checks.')


if __name__ == '__main__':
    tracked = subprocess.check_output(['git', 'ls-files', '-z', '--', '*.html'], cwd=ROOT)
    pages = [ROOT / name.decode() for name in tracked.split(b'\0') if name]
    result = audit(ROOT, pages)
    print(json.dumps(result, indent=2))
    raise SystemExit(bool(result['errors']))
