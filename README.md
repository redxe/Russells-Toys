# Russell's Toys

Small collection of playful, age-appropriate webpages created for Miranda's son Russell (age 5). Simple, colorful interactive pages designed for touch and keyboard—easy to run locally and safe for a child to play with.

## Features
- Tiny games and interactive pages (colors, sounds, simple puzzles)
- Touch-first and keyboard-friendly controls
- Offline-first: static HTML/CSS/JS, no tracking or ads
- Lightweight assets optimized for quick load on low-end devices

## Quick start
1. Clone the repo:
    git clone <repo-url>
2. Open a page in your browser:
    - Open `pages/index.html` directly, or
    - Run a simple server:
      python -m http.server 8000
      and visit http://localhost:8000/pages/

## Project layout
- pages/    — individual toy webpages (index.html, color-game.html, etc.)
- assets/   — images, audio, fonts
- scripts/  — shared JS helpers
- styles/   — CSS and variables

## Development notes
- Keep UI simple and obvious for a 5-year-old
- Prefer large buttons, high-contrast colors, and audible feedback
- Avoid external trackers and third-party ads
- Test on a tablet and low-power phone

## Contributing
Small, focused PRs welcome. Maintain kid-friendly content and simple UX.

## License
MIT
