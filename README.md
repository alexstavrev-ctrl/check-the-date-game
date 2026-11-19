# Check the Date!

A classroom TV game about expiration dates, in 3 levels of 6 rounds. The rule the whole game teaches:
**if the date is before today, it is expired. Don't eat it. Ask an adult.**

The screens follow the sample pages Alex approved on 11/19/2026 (Level 1, 2 and 3). The engine is the
Fun Friday game's own engine, copied as it is, so both games look, sound, click and celebrate the same way.

## The levels (each one fades a support)

| Level | What the class sees | How they find "today" | Supports |
|---|---|---|---|
| 1 | Two of the same food. The date is printed `NOV 12`. | A wall calendar with the past days crossed out | Crossed-out days; round 1 is "Do it together" |
| 2 | Three foods, with `BEST BY`, `USE BY` and `EXP`. Rounds 4 to 6 use last and next month. | The calendar, today circled only | A month strip (last month, this month, next month); X's come back as a hint |
| 3 | Three foods with printed dot dates (`11/16/26`, `11/16/2026`, `NOV 16 2026`), lot codes, other years. Tap every good food, then Done. | Today's date on a phone, like in real life | Today in numbers on the phone as a hint |

A hint appears after one wrong tap (Levels 1 and 2) or two (Level 3), or with the Easier button.
No date is ever equal to today, and the game uses the real date of the day it is played.

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

New in this game (in the approved look): the food cards with a printed date and a zoomed copy, the wall calendar
with pins, the month strip, the phone, dot-matrix print (`js/dotmatrix.js`), the level pick and the level-done page.

## Pictures

Canva, colored-pencil style (the style Alex chose 11/17), cut out on transparent paper. Every picture comes from
the shared library alexstavrev-ctrl/classroom-assets and is listed in `assets.lock.json`. Run the library check
before every publish.

## Testing

Open `index.html` through any web server. Handy addresses:

- `?level=2&round=4` straight to a round (`&hint=1` with the hint on)
- `?today=2026-11-19` pretend it is that day; `?seed=3` the same dates every time
- `?screen=pick` straight to the level pick

This is a public page: no student names or student data anywhere in it.
