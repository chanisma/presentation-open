# -*- coding: utf-8 -*-
"""동적 씬 덱 구조 검증기 (BLOCKING 게이트 1/2).

사용법: python validate_scene.py <덱 index.html 경로>

하드 게이트 (오류 → exit 1):
  1. 씬(data-scene) 의도 주석 필수: <!-- scene: id | metaphor: … | intent: … -->
  2. metaphor 중복 금지 (씬당 고유 시각 메타포)
  3. 구조 시그니처 클러스터 ≤ 2 (같은 구조 3씬 이상 = 쌍둥이 차단)
  4. 씬 간 텍스트 유사도 ≤ 0.65
  5. 이모지 금지
  6. Math.random / Date.now 금지 (모션 = t의 순수 함수)
  7. 균등 그리드 금지 (repeat(3+,1fr), 1fr 1fr 1fr…)
  8. 씬 스타일 스코프 한정: 셀렉터에 [data-scene="id"] 필수, @keyframes는 id- 접두사
소프트 (경고):
  순수 #000/#fff 배경, 씬 요소 수 < 4, 주석 scene id와 data-scene 불일치 외 기타
"""
import re
import sys
from difflib import SequenceMatcher
from html.parser import HTMLParser
from pathlib import Path

EMOJI_RE = re.compile(
    '[\U0001F000-\U0001FAFF☀-⛿✀-➿⬀-⯿️]')
GRID_RE = re.compile(r'repeat\(\s*[3-9]|(?:1fr\s+){2,}1fr')
NONDETERMINISTIC_RE = re.compile(r'Math\.random\s*\(|Date\.now\s*\(')
INTENT_RE = re.compile(
    r'scene\s*:\s*(?P<id>[\w-]+)\s*\|\s*metaphor\s*:\s*(?P<metaphor>[^|]+?)\s*\|\s*intent\s*:\s*(?P<intent>.+)',
    re.S)

VOID_TAGS = {'br', 'img', 'hr', 'input', 'meta', 'link', 'source', 'wbr'}


class Node:
    __slots__ = ('tag', 'children')
    def __init__(self, tag):
        self.tag = tag
        self.children = []


class SceneParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.scenes = []            # {id, index, comment, tree, texts, styles, inline_styles, elem_count}
        self._slide_idx = -1
        self._scene = None          # 현재 씬 dict
        self._scene_depth = 0
        self._depth = 0
        self._node_stack = []
        self._pending_comment = None
        self._in_style = False
        self._in_script = False
        self.global_scripts = []
        self.has_motion_runtime = False

    def handle_comment(self, data):
        if INTENT_RE.search(data):
            self._pending_comment = data

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        cls = (a.get('class') or '').split()
        if tag == 'div' and 'slide' in cls:
            self._slide_idx += 1
            if 'data-scene' in a:
                self._scene = {
                    'id': a.get('data-scene') or f'noid-{self._slide_idx}',
                    'index': self._slide_idx,
                    'has_slide_class': True,
                    'comment': self._pending_comment,
                    'tree': Node('slide'),
                    'texts': [],
                    'styles': [],
                    'inline_styles': [],
                    'elem_count': 0,
                }
                self._pending_comment = None
                self.scenes.append(self._scene)
                self._scene_depth = self._depth
                self._node_stack = [self._scene['tree']]
                self._depth += 1
                return
        if tag == 'div' and a.get('data-scene') is not None and 'slide' not in cls:
            # data-scene인데 slide 클래스 없음 → 씬으로 기록하되 오류 표시용
            self._slide_idx += 1
            self._scene = {
                'id': a.get('data-scene') or f'noid-{self._slide_idx}',
                'index': self._slide_idx, 'has_slide_class': False,
                'comment': self._pending_comment, 'tree': Node('slide'),
                'texts': [], 'styles': [], 'inline_styles': [], 'elem_count': 0,
            }
            self._pending_comment = None
            self.scenes.append(self._scene)
            self._scene_depth = self._depth
            self._node_stack = [self._scene['tree']]
            self._depth += 1
            return

        if self._scene is not None:
            if tag == 'style':
                self._in_style = True
                self._scene['styles'].append('')
            elif tag == 'script':
                self._in_script = True
            else:
                self._scene['elem_count'] += 1
                if a.get('style'):
                    self._scene['inline_styles'].append(a['style'])
                node = Node(tag)
                if self._node_stack:
                    self._node_stack[-1].children.append(node)
                if tag not in VOID_TAGS:
                    self._node_stack.append(node)
        else:
            if tag == 'style':
                self._in_style = True
            elif tag == 'script':
                self._in_script = True
        if tag not in VOID_TAGS:
            self._depth += 1

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in VOID_TAGS:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if tag in VOID_TAGS:
            return
        if tag == 'style':
            self._in_style = False
        if tag == 'script':
            self._in_script = False
        self._depth -= 1
        if self._scene is not None:
            if self._depth == self._scene_depth:
                self._scene = None
                self._node_stack = []
            elif tag not in ('style', 'script') and len(self._node_stack) > 1:
                self._node_stack.pop()

    def handle_data(self, data):
        if self._in_style:
            if self._scene is not None and self._scene['styles']:
                self._scene['styles'][-1] += data
            return
        if self._in_script:
            self.global_scripts.append(data)
            if 'SceneMotion' in data and 'register' in data and 'timelines' in data:
                self.has_motion_runtime = True
            return
        if self._scene is not None and data.strip():
            self._scene['texts'].append(data.strip())


def signature(node, depth=0):
    if depth >= 5:
        return node.tag
    kids = ','.join(signature(c, depth + 1) for c in node.children[:12])
    return f'{node.tag}({kids})' if kids else node.tag


def split_css_rules(css):
    """top-level (selector, body) 목록. @media는 내부를 재귀 평탄화."""
    rules, i, n = [], 0, len(css)
    while i < n:
        brace = css.find('{', i)
        if brace < 0:
            break
        selector = css[i:brace].strip()
        depth, j = 1, brace + 1
        while j < n and depth:
            if css[j] == '{':
                depth += 1
            elif css[j] == '}':
                depth -= 1
            j += 1
        body = css[brace + 1:j - 1]
        if selector.startswith('@media'):
            rules.extend(split_css_rules(body))
        else:
            rules.append((selector, body))
        i = j
    return rules


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        return 2
    path = Path(sys.argv[1])
    if not path.exists():
        print(f'오류: 파일 없음 — {path}')
        return 1
    html = path.read_text(encoding='utf-8')

    parser = SceneParser()
    parser.feed(html)
    scenes = parser.scenes
    errors, warnings = [], []

    if not scenes:
        print('data-scene 씬이 없습니다. (동적 씬 덱이 아님)')
        return 0

    # 1·2) 의도 주석 + metaphor 중복
    metaphors = {}
    for s in scenes:
        where = f"씬 {s['id']}(#{s['index']})"
        if not s['has_slide_class']:
            errors.append(f"{where}: data-scene 요소에 class=\"slide\" 누락")
        if not s['comment']:
            errors.append(f"{where}: 의도 주석 없음 — <!-- scene: id | metaphor: … | intent: … --> 필수")
            continue
        m = INTENT_RE.search(s['comment'])
        cid, metaphor = m.group('id').strip(), m.group('metaphor').strip()
        if cid != s['id']:
            errors.append(f"{where}: 주석의 scene id({cid})가 data-scene({s['id']})과 불일치")
        if not m.group('intent').strip():
            errors.append(f"{where}: intent가 비어 있음")
        if metaphor in metaphors:
            errors.append(f"{where}: metaphor '{metaphor}' 중복 — 씬 {metaphors[metaphor]}와 동일 (씬당 고유 메타포)")
        metaphors[metaphor] = s['id']

    # 3) 구조 시그니처 클러스터
    clusters = {}
    for s in scenes:
        clusters.setdefault(signature(s['tree']), []).append(s['id'])
    for sig, ids in clusters.items():
        if len(ids) >= 3:
            errors.append(f"쌍둥이 구조 {len(ids)}씬: {', '.join(ids)} — 구조 시그니처 클러스터 ≤ 2 (메타포 재발명 필요)")

    # 4) 텍스트 유사도
    norm = {s['id']: re.sub(r'\s+', ' ', ' '.join(s['texts'])).strip() for s in scenes}
    ids = [s['id'] for s in scenes]
    for i in range(len(ids)):
        for j in range(i + 1, len(ids)):
            a, b = norm[ids[i]], norm[ids[j]]
            if len(a) >= 30 and len(b) >= 30:
                r = SequenceMatcher(None, a, b).ratio()
                if r > 0.65:
                    errors.append(f"씬 {ids[i]} ↔ {ids[j]}: 텍스트 유사도 {r:.2f} > 0.65 (내용 중복)")

    # 5) 이모지
    for s in scenes:
        joined = ' '.join(s['texts'])
        found = EMOJI_RE.findall(joined)
        if found:
            errors.append(f"씬 {s['id']}: 이모지 사용 금지 — {' '.join(found[:5])} (씬의 자기 시각 언어로 표현)")

    # 6) 비결정 코드
    for script in parser.global_scripts:
        m = NONDETERMINISTIC_RE.search(script)
        if m:
            errors.append(f"비결정 코드 금지: {m.group(0)}… — 모션은 t의 순수 함수여야 함")
            break

    # 7) 균등 그리드
    for s in scenes:
        blob = ' '.join(s['styles'] + s['inline_styles'])
        if GRID_RE.search(blob):
            errors.append(f"씬 {s['id']}: 균등 그리드(repeat(3+,1fr)/1fr 반복) 금지 — 비대칭 분할로 재설계")

    # 8) 스타일 스코프
    for s in scenes:
        scope = f'[data-scene="{s["id"]}"]'
        for css in s['styles']:
            for selector, _body in split_css_rules(css):
                if selector.startswith('@keyframes'):
                    name = selector.split(None, 1)[1].strip() if ' ' in selector else ''
                    if not name.startswith(s['id']):
                        errors.append(f"씬 {s['id']}: @keyframes '{name}'는 '{s['id']}-' 접두사 필요")
                elif selector.startswith('@'):
                    continue
                elif scope not in selector:
                    errors.append(f"씬 {s['id']}: 스코프 밖 셀렉터 '{selector[:60]}' — {scope} 하위로 한정")

    # 소프트 경고
    for s in scenes:
        blob = ' '.join(s['styles'] + s['inline_styles']).lower()
        if re.search(r'background(?:-color)?\s*:\s*#(?:000|000000|fff|ffffff)\b', blob):
            warnings.append(f"씬 {s['id']}: 순수 #000/#fff 배경 — 톤이 있는 잉크/종이 색 권장")
        if s['elem_count'] < 4:
            warnings.append(f"씬 {s['id']}: 요소 {s['elem_count']}개 — 빈 씬 의심 (픽셀 검수 확인)")

    has_register = any('SceneMotion.register' in sc for sc in parser.global_scripts)
    uses_deck_runtime = 'app/runtime/deck.js' in html  # Contract v1: deck.js가 런타임 제공
    if has_register and not parser.has_motion_runtime and not uses_deck_runtime:
        errors.append('SceneMotion.register 사용 중이나 런타임 없음 — deck.js(Contract v1) 참조 또는 motion-utils.md 스니펫 필요')

    print(f'씬 {len(scenes)}개 검사 완료 — 시그니처 클러스터 {len(clusters)}종')
    for w in warnings:
        print(f'  경고: {w}')
    for e in errors:
        print(f'  오류: {e}')
    if errors:
        print(f'\nBLOCK: 오류 {len(errors)}건 — 규칙 우회가 아니라 표현 재발명으로 해결할 것')
        return 1
    print(f'\n통과 (경고 {len(warnings)}건)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
