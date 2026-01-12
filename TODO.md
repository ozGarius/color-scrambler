# TODO: Future Features for Color Scrambler

Here are some fun image processing features to implement:

## 0. Improve UI/UX [COMPLETED]
- [x] Add a "Reset" button to clear the canvas and reset all controls.
- [x] Add a "Save Settings" button to save the current settings to localStorage.
- [x] Add a "Load Settings" button to load the saved settings from localStorage.
- [x] Add a dark mode toggle.
- [x] Restyle the UI to be more modern and user-friendly. Possibly using material design.

## 1. Pixel Sorting (The Glitch Art Classic) [COMPLETED]
- [x] Sort pixels in rows or columns based on Brightness, Hue, or Saturation.
- [x] Creates a "melting" or "dripping" glitch art effect.

## 2. Chromatic Aberration (RGB Split) [COMPLETED]
- [x] Shift the Red, Green, and Blue channels independently by a few pixels.
- [x] Adds a distorted, high-energy look to the edges of objects.

## 3. Palette Swapping (Color Stealing)
- [ ] Allow uploading a second "Palette Image".
- [ ] Map the colors of the first image to the nearest colors in the second image's palette.

## 4. Dithering (Retro Tech Aesthetic) [COMPLETED]
- [x] Limit color depth and use dithering algorithms (like Floyd-Steinberg).
- [x] Create a 1980s GameBoy or old Macintosh computer look.

## 5. ASCII Art Mode
- [ ] Render the image as text characters (`@`, `#`, `+`, `.`) based on pixel density.
- [ ] Option to download the result as a `.txt` file.

## 6. Channel Swapping [COMPLETED]
- [x] A simple toggle to swap RGB channels (e.g., Red ↔ Blue).
- [x] Instantly creates "alien world" landscapes.

## 7. "Stained Glass" (Voronoi Tiles) [COMPLETED]
- [x] Divide the image into geometric cells and fill each with the average color.
- [x] Produces a beautiful abstract mosaic effect.
