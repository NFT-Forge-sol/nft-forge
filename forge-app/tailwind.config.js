const { nextui } = require('@nextui-org/react')

module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#FF6B00', // Your main orange
          50: '#FFF2E5',
          100: '#FFE5CC',
          200: '#FFCB99',
          300: '#FFB166',
          400: '#FF9733',
          500: '#FF6B00', // Your main orange
          600: '#CC5500',
          700: '#994000',
          800: '#662A00',
          900: '#331500',
        },
        forge: {
          DEFAULT: '#0A0A0A', // Your main black
          50: '#404040',
          100: '#333333',
          200: '#262626',
          300: '#1A1A1A',
          400: '#0D0D0D',
          500: '#0A0A0A', // Your main black
          600: '#000000',
        },
      },
    },
  },
  darkMode: 'class',
  plugins: [
    nextui({
      themes: {
        dark: {
          colors: {
            background: '#0A0A0A',
            foreground: '#FFFFFF',
            primary: {
              DEFAULT: '#FF6B00',
              foreground: '#FFFFFF',
            },
            focus: '#FF6B00',
          },
        },
      },
    }),
  ],
}
