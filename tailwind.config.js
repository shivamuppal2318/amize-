// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  // NativeWind toggles dark mode via a class on web; Tailwind must be configured accordingly.
  // This fixes: "Cannot manually set color scheme, as dark mode is type 'media'."
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        'figtree-light': ['Figtree_300Light'],
        'figtree': ['Figtree_400Regular'],
        'figtree-medium': ['Figtree_500Medium'],
        'figtree-semibold': ['Figtree_600SemiBold'],
        'figtree-bold': ['Figtree_700Bold'],
        'figtree-extrabold': ['Figtree_800ExtraBold'],
        'figtree-black': ['Figtree_900Black'],

        // Override default Tailwind font families with Figtree
        'sans': ['Figtree_400Regular'],
        'serif': ['Figtree_400Regular'],
        'mono': ['Figtree_400Regular'],
      },
    },
  },
  plugins: [],
}
