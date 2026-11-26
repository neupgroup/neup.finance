import type { Config } from 'tailwindcss';
import componentPreset from './@neup/components/tailwind.preset';

export default {
  presets: [componentPreset],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './core/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './@neup/**/*.{js,ts,jsx,tsx,mdx}',
    './@base/**/*.{js,ts,jsx,tsx,mdx}',
  ],
} satisfies Config;
