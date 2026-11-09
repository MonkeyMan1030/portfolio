# Mattias Reinhardt — portfolio

A static, printmaking-inspired portfolio with a procedurally drawn bear that eats draggable heading letters.

## Run and test

```sh
python3 -m http.server 4173 --directory portfolio-static/dist
node tests/ecosystem.mjs
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
- `site.js`: short, skippable print reveal; session persistence and reduced-motion support.
- `physics.mjs` / `orbit.js`: two-body velocity-Verlet model and visualization.
- `projects/newton_orbits.py`: Mattias's original supplied Python program, byte-for-byte unchanged.

## Behavior

Drag a heading letter into the woodland, click a letter, or activate it with a keyboard. The feed button is an alternative on smaller screens. Letters obey gravity and resolve equal-mass circle contacts. Bears reserve individual letters, eat them, and flip; three meals can produce a cub, up to four bears. At most 16 letters are simulated. Expired/eaten letters are restored to the heading. Reset restores all heading letters.

Simulation timestep: 1/120 second, elapsed-time clamp 50 ms, capped work per animation frame. Seeded randomness permits repeatable tests. Numerical work stops when paused, offscreen, or the document is hidden. Reduced motion starts the interaction paused; users can explicitly play it. No GIFs, prerecorded creature animations, or external rendering libraries.

The visual direction uses Mattias's preferences (bear print palette, angular cut shapes, comic panels). His artwork photographs are private design references and are NOT included. The bear and scenery are original programmatic drawings, not traced artwork. The website and browser adaptations were developed with AI assistance; the original Python project is supplied separately.

## Deploy

Existing Cloudflare Worker `portfolio`, connected to GitHub `main`. Deploy directory: `portfolio-static/dist`. Preserve existing domain bindings. Cloudflare runs:

```sh
npx wrangler deploy --name portfolio --assets ./portfolio-static/dist --compatibility-date 2026-11-04
```

Public site: https://www.mattiasreinhardt.com
