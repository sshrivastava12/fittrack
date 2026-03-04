#!/usr/bin/env node
/**
 * Run this with: node scripts/generate-icons.js
 * Requires: npm install canvas (or use https://realfavicongenerator.net)
 *
 * Alternatively, paste the SVG below into a tool like https://maskable.app
 * to generate all icon sizes.
 */

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="#000000"/>
  <rect width="512" height="512" rx="112" fill="#0A84FF" opacity="0.15"/>
  <circle cx="256" cy="256" r="180" fill="#0A84FF" opacity="0.1"/>
  <!-- Dumbbell icon -->
  <rect x="80" y="236" width="352" height="40" rx="20" fill="#0A84FF"/>
  <rect x="60" y="176" width="60" height="160" rx="20" fill="#0A84FF"/>
  <rect x="392" y="176" width="60" height="160" rx="20" fill="#0A84FF"/>
  <rect x="40" y="206" width="40" height="100" rx="16" fill="#30D158"/>
  <rect x="432" y="206" width="40" height="100" rx="16" fill="#30D158"/>
</svg>`;

console.log("Icon SVG:");
console.log(svgIcon);
console.log("\nTo generate PNG icons:");
console.log("1. Visit https://maskable.app/editor");
console.log("2. Upload the SVG above");
console.log("3. Download all sizes");
console.log("4. Place them in /public/icons/");
console.log("\nRequired sizes: 72, 96, 128, 144, 152, 167, 180, 192, 512");
