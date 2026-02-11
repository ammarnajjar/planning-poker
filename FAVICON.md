# Favicon Guide

The Planning Poker app has a custom favicon showing a poker card with the Fibonacci number "8".

## Files

The following favicon files are generated and included in the build:

- `favicon.svg` - Scalable vector source (modern browsers)
- `favicon.ico` - Multi-size ICO file (16x16, 32x32)
- `favicon-16x16.png` - Small size PNG
- `favicon-32x32.png` - Standard size PNG
- `apple-touch-icon.png` - iOS home screen icon (180x180)
- `favicon-512x512.png` - Large size for PWA
- `manifest.json` - Web app manifest for PWA support

## Regenerating Favicons

If you need to modify the favicon design:

1. Edit `src/favicon.svg` with your preferred SVG editor or text editor
2. Run the following commands to regenerate PNG versions:

```bash
cd src

# Generate PNG files from SVG
rsvg-convert -w 16 -h 16 favicon.svg -o favicon-16x16.png
rsvg-convert -w 32 -h 32 favicon.svg -o favicon-32x32.png
rsvg-convert -w 180 -h 180 favicon.svg -o apple-touch-icon.png
rsvg-convert -w 512 -h 512 favicon.svg -o favicon-512x512.png

# Generate ICO file (requires png-to-ico: npm install -g png-to-ico)
npx png-to-ico favicon-16x16.png favicon-32x32.png > favicon.ico
```

### Prerequisites

- `rsvg-convert` (from librsvg): Install with `brew install librsvg` on macOS
- `png-to-ico`: Installed via npx when needed

## Design Details

The favicon features:
- **Color scheme**: Material Indigo (#3f51b5) matching the app theme
- **Number**: "8" (a Fibonacci number commonly used in planning poker)
- **Style**: Playing card design with corner numbers and suit symbols
- **Accent**: Orange diamond shapes representing estimation/voting
