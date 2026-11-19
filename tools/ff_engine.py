#!/usr/bin/env python3
"""The Fun Friday engine inside Check the Date!: copy it, and prove the copy is exact.

    python3 tools/ff_engine.py build PATH/TO/fun-friday-game/index.html
        writes js/ff-engine.js and css/ff-engine.css from the Fun Friday page
    python3 tools/ff_engine.py check PATH/TO/fun-friday-game/index.html
        every block in those two files must still be in the Fun Friday page, byte for byte

Alex 11/19: "copy the entire game engine and framework of the fun friday game, sounds, button presses,
visual effects, etc." So these parts are not rewritten: they are cut out of the Fun Friday page as they are.
Each block is found by its first line and runs to its last line, so if Fun Friday changes one of them,
'build' takes the new version and 'check' says which block no longer matches.
Blocks that are Fun Friday's own screens (bill, till, map, street, STOP signs, number line) are not copied.
"""
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent

# (name, what it is, first line, last line[, after]). A line is matched by how it starts; "=" in front means the
# whole line. The last line is the first match after the first line (or, with `after`, after that line).
JS = [
    ('pictures', 'picture files in place of emoji (P), the star', 'const HAVE=new Set(window.WARMUP_HAVE', 'function P(k,e)'),
    ('state', 'shared state: round index i, Easier, Sound, rounds done', 'const $=id=>document.getElementById(id);', 'const unit=()=>'),
    ('sounds', 'every sound, made in the browser', '/* ---------- sounds: all made in the browser', '=};'),
    ('narrator-note', 'narrator notes', '/* ---------- narrator:', '   the browser'),
    ('narrator', 'narrator (off, as in Fun Friday, until the recorded voices are ready)', 'const VOICE_OFF=', 'function sayQ(s)'),
    ('bigwin', 'the game-show win on a full-screen layer', "/* the bill screen's big win", '  const b=r.getBoundingClientRect();WINFX.play('),
    ('effects', 'confetti, the flying star, party, cheer line, round stamps', '/* ---------- confetti:', '=}', 'function stamps(){'),
    ('tactile', 'tactile buttons: press and release clicks', '/* ---------- tactile buttons', '=})();'),
    ('opening', 'the opening page', '/* Opening page. It shows once', '=}', 'function showOpen(){'),
]
CSS = [
    ('base', 'page base', ':root{color-scheme:light}body{margin:0', ':root{color-scheme:light}body{margin:0'),
    ('look', 'colors, fonts, --u, top strip, stamps, teacher buttons, question, hint', '=:root{', '.hint{'),
    ('cards', 'answer cards and how they deal in', '.choice{background:var(--card)', '.choice:active{transform:translateY'),
    ('ai', 'picture files on cards', '/* picture files that replace emoji', 'img.ai{'),
    ('right', 'right answer: green frame and check', '/* answers: right = green frame', '.choice.yes::before,.choice.pick::before'),
    ('wrong', 'wrong answer: red frame, shake, wash; motion; confetti layers', '.choice.no{border-color', '#fx{position:fixed'),
    ('bottom', 'bottom strip, Next, cheer line, opening page', '.bottom{', '@keyframes fadeout'),
    ('otitle', 'opening title words', '.o-title{position:absolute;left:50%', '.o-title{position:absolute;left:50%'),
    ('obtn', 'opening Start button', '.o-btn{position:absolute', '@media (max-aspect-ratio:1/1){.o-btn'),
    ('breathe', 'Start button breathes', '/* effects (Alex 11/18)', '@keyframes breathe'),
    ('calm1', 'reduced motion', '@media (prefers-reduced-motion:reduce){.o-btn,', '@media (prefers-reduced-motion:reduce){.o-btn,'),
    ('title', 'floating title stage', '/* title screen V18', '@media (prefers-reduced-motion:reduce){.tfx-map'),
    ('tactile', 'tactile buttons', '/* tactile buttons (Alex 11/18)', '@media (prefers-reduced-motion:reduce){.prs'),
    ('pulse', 'Start button pulses twice', '.o-btn{animation:pulse', '.o-btn:active{box-shadow:0 calc(var(--u)*.4)'),
    ('calm2', 'reduced motion', '@media (prefers-reduced-motion:reduce){.choice,.choice::before', '@media (prefers-reduced-motion:reduce){.choice,.choice::before'),
]


def hit(pattern, line):
    return line == pattern[1:] if pattern.startswith('=') else line.startswith(pattern)


def cut(lines, first, last, after=None):
    """the lines from `first` to the next `last` (or the first `last` after `after`); one line when first == last"""
    starts = [n for n, s in enumerate(lines) if hit(first, s)]
    if len(starts) != 1:
        raise SystemExit(f'block start {first!r}: found {len(starts)} times in the Fun Friday page (need exactly 1)')
    a = starts[0]
    if first == last:
        return lines[a]
    b = a + 1
    if after:
        while not hit(after, lines[b]):
            b += 1
    while not hit(last, lines[b]):
        b += 1
        if b >= len(lines):
            raise SystemExit(f'block end {last!r} not found after {first!r}')
    return '\n'.join(lines[a:b + 1])


def sections(page):
    script = re.findall(r'<script>(.*?)</script>', page, re.S)
    style = re.findall(r'<style>(.*?)</style>', page, re.S)
    return '\n'.join(script).split('\n'), '\n'.join(style).split('\n')


def commit_of(ff):
    head = Path(ff).resolve().parent / '.git' / 'HEAD'
    try:
        ref = head.read_text().strip()
        if ref.startswith('ref: '):
            ref = (head.parent / ref[5:]).read_text().strip()
        return ref[:7]
    except OSError:
        return 'unknown'


JS_HEAD = '''/* ============================================================================================================
   THE FUN FRIDAY ENGINE, copied as it is from the Fun Friday game (alexstavrev-ctrl/fun-friday-game, index.html,
   commit {commit}). Alex 11/19: "copy the entire game engine and framework of the fun friday game, sounds, button
   presses, visual effects, etc." so both games sound, click and celebrate the same way.
   Do not edit this file. Every block between "ff:" marks is a byte-for-byte copy: tools/ff_engine.py check proves it,
   and tools/ff_engine.py build takes a newer Fun Friday version. This game only sets the switches in index.html.
   ============================================================================================================ */
'''
CSS_HEAD = '''/* ============================================================================================================
   THE FUN FRIDAY LOOK AND EFFECTS, copied as they are from the Fun Friday game (index.html, commit {commit}):
   colors, fonts, --u, top strip, stamps, teacher buttons, question, answer cards with their right and wrong
   states, motion, cheer line, Next, opening page, floating-title stage, tactile buttons.
   Do not edit this file (tools/ff_engine.py check proves it is an exact copy). This game's own screens and the
   few places where it differs are in game.css, which loads after this file.
   ============================================================================================================ */
'''


def build(ff):
    page = Path(ff).read_text()
    js, css = sections(page)
    commit = commit_of(ff)
    out = [JS_HEAD.format(commit=commit)]
    for name, what, first, last, *after in JS:
        out.append(f'/* ff:{name}: {what} */\n' + cut(js, first, last, after[0] if after else None) + '\n/* ff:end */\n')
    (HERE / 'js' / 'ff-engine.js').write_text('\n'.join(out))
    out = [CSS_HEAD.format(commit=commit)]
    for name, what, first, last, *after in CSS:
        out.append(f'/* ff:{name}: {what} */\n' + cut(css, first, last, after[0] if after else None) + '\n/* ff:end */\n')
    (HERE / 'css' / 'ff-engine.css').write_text('\n'.join(out))
    print('built js/ff-engine.js and css/ff-engine.css from Fun Friday', commit)


def check(ff):
    page = Path(ff).read_text()
    bad = 0
    for f in ('js/ff-engine.js', 'css/ff-engine.css'):
        text = (HERE / f).read_text()
        blocks = re.findall(r'/\* ff:([\w-]+): [^\n]*\*/\n(.*?)\n/\* ff:end \*/', text, re.S)
        for name, body in blocks:
            if body not in page:
                bad += 1
                print(f'FAIL {f} block {name}: no longer the same as in the Fun Friday page')
        print(f'{f}: {len(blocks)} blocks, {len(blocks) - sum(1 for n, b in blocks if b not in page)} exact copies')
    print('FAIL' if bad else 'PASS: the engine is an exact copy of the Fun Friday code')
    return 1 if bad else 0


if __name__ == '__main__':
    if len(sys.argv) != 3 or sys.argv[1] not in ('build', 'check'):
        print(__doc__)
        sys.exit(2)
    sys.exit(build(sys.argv[2]) if sys.argv[1] == 'build' else check(sys.argv[2]))
