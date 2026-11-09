# Mattias Reinhardt — student portfolio

Static HTML, CSS, and JavaScript. Live at https://mattiasreinhardt.com.

## Hosting

The existing Cloudflare Worker `portfolio` deploys from this repository's `main` branch. Website assets live in `portfolio-static/dist/`. Preserve the existing Cloudflare build settings and domain bindings.

## Projects

- `projects/newton_orbits.py`: Mattias's supplied Python/Tkinter/Matplotlib program, unchanged.
- `physics.mjs`: browser adaptation with a fixed-step velocity-Verlet integrator. Normalized G, total mass, and starting separation are all 1. SI readouts use the preset's physical scales. This is explicitly distinguished from the original Python code on the site.
- Elite Hypertrophy: description grounded in the app source and README; image from its prepared App Store screenshot fixtures. No personal workout data or invented usage metrics.

Run locally: `python3 -m http.server 4173 --directory portfolio-static/dist`.

The orbit animation honors reduced-motion preferences, pauses numerical work when offscreen, and bounds per-frame integration work. No recorded video or animated images are used.
