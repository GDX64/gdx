import colors from 'tailwindcss/colors';
import plugin from 'tailwindcss/plugin';
import resolveConfig from 'tailwindcss/resolveConfig';
import { primeColors } from './src/design/design';

export const designConfig = resolveConfig({
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx,md}'],
  safelist: ['opacity-0', 'opacity-100'],
  theme: {
    colors: {
      prime: primeColors,
      sec: {
        ...colors.neutral,
        50: '#fff5f5',
      },
      text: {
        prime: '#000000',
        label: '#5d6169',
        contrast: '#ffffff',
      },
      bg: {
        0: '#fffff6',
        ...colors.neutral,
        1000: '#000000',
      },
      hover: primeColors[500],
      ...colors,
    },
    screens: {
      xs: '500px',
      sm: '640px',
      // => @media (min-width: 640px) { ... }

      md: '768px',
      // => @media (min-width: 768px) { ... }

      lg: '1024px',
      // => @media (min-width: 1024px) { ... }

      xl: '1280px',
      // => @media (min-width: 1280px) { ... }

      '2xl': '1536px',
      // => @media (min-width: 1536px) { ... }
    },
    extend: {
      animation: {
        pointd: 'pointd 1.5s ease-in-out infinite',
        appear: 'appear 1s ease-out both',
      },
      keyframes: {
        pointd: {
          '0%': { transform: 'translate(0, 0)' }, // No movement for the first 25%
          '33%': { transform: 'translate(2px, -2px)' },
          '66%, 100%': { transform: 'translate(0, 0)' }, // No movement for the last 25%
        },
        appear: {
          '0%': { opacity: '0' },
          '100%': {},
        },
      },
    },
  },
  plugins: [
    plugin(({ addUtilities, matchUtilities, theme }) => {
      matchUtilities(
        {
          'animate-delay': (value) => {
            return {
              'animation-delay': value,
            };
          },
        },
        { values: theme('transitionDelay') }
      );
      addUtilities({
        '.my-section-title': {
          'text-decoration': 'underline',
          'font-size': '1.5rem',
          'font-weight': '600',
          'margin-bottom': '0.75rem',
        },
        '.my-external-ref': {
          'text-decoration': 'underline',
          'font-weight': '600',
        },
      });
    }),
  ],
});

export default designConfig;
