# Check the Date!

A classroom TV game about expiration dates, in 3 levels of 6 rounds. The rule the whole game teaches:
**if the date is before today, it is expired. Don't eat it. Ask an adult.**

The screens follow the sample pages Alex approved on 11/19/2026 (Level 1, 2 and 3). The engine is the
Fun Friday game's own engine, copied as it is, so both games look, sound, click and celebrate the same way.
Alex 11/19 (20:20 UTC): in these three levels there is no date on the packages; each date is shown only in the big
date box under its food, and the pictures have no blank label. Level 1 (20:24 UTC) shows one food at a time.

## The levels (each one fades a support)

| Level | What the class sees | How they find "today" | Supports |
|---|---|---|---|
| 1 | One food. "Is it expired or not?" Two answers: Expired, Not expired. The date reads `NOV 12`. | A wall calendar with the past days crossed out | Crossed-out days; round 1 is "Do it together"; 3 expired and 3 still good, never 3 the same in a row |
| 2 | Three foods, with `BEST BY`, `USE BY` and `EXP`. Rounds 4 to 6 use last and next month. | The calendar, today circled only | A month strip (last month, this month, next month); X's come back as a hint |
| 3 | Three foods with dot-matrix dates printed many real ways: `11/16/26`, `11-16-26`, `11.16.26`, `111626`, `11162026`, `16NOV26`, `16 NOV 2026`, `NOV 16 2026`, `NOV 2026` (month and year only), `PACKED ON` next to `USE BY`, and times and lot codes on the same line. Other years. Tap every good food, then Done. | Today's date on a phone, like in real life | Today in numbers on the phone as a hint; a crammed date is read back in the phone's numbers |

A hint appears after one wrong tap (Levels 1 and 2) or two (Level 3), or with the Easier button. In Level 1 a wrong
answer pins the food on its date on the calendar ("Look again. Find NOV 12 on the calendar.").
No date is ever equal to today, and the game uses the real date of the day it is played.

## Find the Date!

The level pick also opens Find the Date! (folder `find/`, Levels 1 to 4): turn a 3D package, find where the date is
printed, then say what it says. It was built as its own part and plugs in with one call,
`FindTheDate.start(section, {level, round, today, rand, onExit})`, and `FindTheDate.stop()`. The packages are drawn in
code; three.js r160 is self-hosted in `find/` with its licence. Testing address: `?screen=find&level=1&round=1`
(with `&today=` and `&seed=` as usual).

## What comes from the Fun Friday game

Alex 11/19: "copy the entire game engine and framework of the fun friday game, sounds, button presses, visual
effects, etc." Here is what was copied, what was adapted and what was left out.

| Part | How | File |
|---|---|---|
| Every sound (bells, oops, whoosh, click, chime, win, party), made in the browser | exact copy | `js/ff-engine.js` |
| Tactile buttons: press and release clicks, sink and spring | exact copy | `js/ff-engine.js`, `css/ff-engine.css` |
| Confetti, the star that flies to its round stamp, the party at the end | exact copy | `js/ff-engine.js` |
| Cheer line, round stamps, the star picture | exact copy | `js/ff-engine.js` |
| Game-show win ("YOU GOT IT!", Astra) on a full-screen layer | exact copy | `js/winfx-astra.js`, `css/winfx-astra.css`, `bigWin` in `js/ff-engine.js` |
| Narrator (reads the question and the tapped date) | exact copy, **off** as in Fun Friday until the recorded voices are ready | `js/ff-engine.js` |
| Opening page and Start button (breathes, pulses, sinks when pressed) | exact copy | `js/ff-engine.js`, `css/ff-engine.css` |
| Colors, fonts, `--u` sizing, top strip, teacher buttons, giant question, hint line | exact copy | `css/ff-engine.css` |
| Answer cards: deal in, green check, red frame and shake, wash over a wrong card, the rest fade | exact copy | `css/ff-engine.css` |
| Fonts (Baloo 2, Nunito) and the star | same files, from classroom-assets | `assets/` |
| Floating title: the same physics (drift, bump, springs, tap and pop, calm mode) | adapted: this game's foods and today's calendar page | `js/titlefx.js`, `css/titlefx.css` |
| Round flow: Next, Skip, Back, arrow keys, the finish of a round | adapted: 3 levels, a level pick, Done in Level 3 | `js/game.js` |
| Fun Friday's own screens (bill, till, map, street, STOP signs, number line), its bus honk | not used: they belong to that trip | - |
| Live-edit snapshot inside Claude | not used: the game is played from its web page | - |

`js/ff-engine.js` and `css/ff-engine.css` are not edited by hand. To check that they are still exact copies,
or to take a newer Fun Friday version:

```
python3 tools/ff_engine.py check ../fun-friday-game/index.html   # PASS = every block is the same as in Fun Friday
python3 tools/ff_engine.py build ../fun-friday-game/index.html   # copy the blocks again
```

New in this game (in the approved look): the food cards with their big date box, the Level 1 answer buttons, the wall
calendar with pins, the month strip, the phone, dot-matrix print (`js/dotmatrix.js`), the level pick and the level-done page.

## Pictures

Canva, colored-pencil style (the style Alex chose 11/17), cut out on transparent paper. Every picture comes from
the shared library alexstavrev-ctrl/classroom-assets and is listed in `assets.lock.json`. Run the library check
before every publish.

## Publishing

The live game is the `gh-pages` branch (https://alexstavrev-ctrl.github.io/check-the-date-game/). Before every publish:

```
python3 tools/ff_engine.py check ../fun-friday-game/index.html                          # PASS: the engine is still an exact copy
python3 ../classroom-assets/tools/assets.py check --site . --baseline-git origin/gh-pages  # RESULT: PASS: every picture and font is approved library art
git push origin main && git push origin main:gh-pages
```

Then open the live link on a real browser and play a round (github.io can't be reached from the cloud sessions).

## Testing

Open `index.html` through any web server. Handy addresses:

- `?level=2&round=4` straight to a round (`&hint=1` with the hint on)
- `?today=2026-11-19` pretend it is that day; `?seed=3` the same dates every time
- `?screen=pick` straight to the level pick

This is a public page: no student names or student data anywhere in it.
