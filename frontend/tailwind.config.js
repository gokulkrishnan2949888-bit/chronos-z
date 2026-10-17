/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#090D16',
          panel: '#1E293B',
          panelDark: '#111827',
          panelBorder: '#334155',
          panelGlass: 'rgba(30, 41, 59, 0.7)',
          emerald: '#10B981',
          emeraldGlow: 'rgba(16, 185, 129, 0.25)',
          crimson: '#EF4444',
          crimsonGlow: 'rgba(239, 68, 68, 0.25)',
          amber: '#F59E0B',
          cyan: '#06B6D4',
          blue: '#3B82F6',
          purple: '#8B5CF6',
          textMuted: '#94A3B8',
          textLight: '#F1F5F9',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Courier New', 'monospace'],
        sans: ['Inter', 'Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-emerald': '0 0 25px rgba(16, 185, 129, 0.35)',
        'glow-crimson': '0 0 25px rgba(239, 68, 68, 0.35)',
        'glow-cyan': '0 0 25px rgba(6, 182, 212, 0.35)',
        'panel': '0 10px 30px -5px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.07)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
      },
    },
  },
  plugins: [],
};
