# Mattias Reinhardt — portfolio

A static notebook portfolio with a procedural autumn tree, physical falling leaves, and a letter-eating bear.

## Run and test

```sh
python3 -m http.server 4173 --directory portfolio-static/dist
node tests/ecosystem.mjs
node tests/leaves.mjs
```

Open http://localhost:4173. No package installation or build step is needed.

## Structure

- `index.html`: interactive cover and project index.
- `about.html`: supplied biography, LinkedIn, and contact. Current school/program comes from Mattias's linked profile.
- `projects/elite-hypertrophy.html`: app details grounded in the project's local source and README; screenshot uses prepared example data.
- `projects/orbits.html`: original Python project and live browser adaptation.
- `projects/letter-bear.html`: interaction design, implementation notes, and source links.
- `ecosystem.mjs`: deterministic fixed-step simulation, letter contacts, exclusive target reservations, feeding/flip/birth state machine. No browser dependencies.
- `creatures.js`: procedural Canvas drawings, pointer and keyboard controls, visibility management, accessible status updates, inspection overlay.
- `site.js` / `notebook.js`: progressive branch drawing on every homepage load; Skip/Replay, scroll-grown margin vines, pointer/scroll wind, and motion controls.
- `leaves.mjs`: seeded, fixed-step leaf simulation; swept contacts against measured letter/heading ledges, attachment/reflow, wind release, and a 64-leaf cap.
- `sketch.js`: seeded, generated pencil underlines that draw themselves when a heading scrolls into view.
- `orbit-mini.js`: the live two-body drawing on the home page card; uses `physics.mjs`.
- `physics.mjs` / `orbit.js`: two-body velocity-Verlet model and visualization.
- `projects/newton_orbits.py`: Mattias's original supplied Python program, byte-for-byte unchanged.

## Behavior

Drag a heading letter into the woodland, click a letter, or activate it with a keyboard. The feed button is an alternative on smaller screens. Letters obey gravity and resolve equal-mass circle contacts. Bears reserve individual letters, eat them, and flip; three meals can produce a cub, up to four bears. At most 16 letters are simulated. Expired/eaten letters are restored to the heading. Reset restores all heading letters.

Simulation timestep: 1/120 second, elapsed-time clamp 50 ms, capped work per animation frame. Seeded randomness permits repeatable tests. Numerical work stops when paused, offscreen, or the document is hidden. Reduced motion starts the interaction paused; users can explicitly play it. No GIFs, prerecorded creature animations, or external rendering libraries. The page drawing also pauses in hidden tabs and honors reduced motion.

The locally hosted Kalam font is distributed under the SIL Open Font License; see `portfolio-static/dist/assets/fonts/OFL.txt`. Special Elite is distributed under the Apache License 2.0. Playfair Display (the name) is under the SIL Open Font License. Architext (pencil lettering) is © Grant Marshall, supplied by Mattias; its licence terms are not in the font file and should be confirmed with the author.

The visual direction uses Mattias's preferences for sketchbooks, printmaking, and visible nature. Copy is limited to verified education and project information. His artwork photographs are private design references and are NOT included. The bear and scenery are original programmatic drawings, not traced artwork. The website and browser adaptations were developed with AI assistance; the original Python project is supplied separately.

## Deploy

Existing Cloudflare Worker `portfolio`, connected to GitHub `main`. Deploy directory: `portfolio-static/dist`. Preserve existing domain bindings. Cloudflare runs:

```sh
npx wrangler deploy --name portfolio --assets ./portfolio-static/dist --compatibility-date 2026-11-04
```

Public site: https://www.mattiasreinhardt.com
