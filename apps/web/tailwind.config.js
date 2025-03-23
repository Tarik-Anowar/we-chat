/**
 * @type {import('tailwindcss').Config}
 */
const config = {
    content: [
      "./app/**/*.{js,ts,jsx,tsx}",
      "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '2rem',
          lg: '4rem',
          xl: '5rem',
          '2xl': '6rem',
        },
      },
    },
    variants: {
      extend: {
        boxDecorationBreak: ['hover', 'focus'],
      },
    },
    plugins: [],
  };
  
  export default config;
  