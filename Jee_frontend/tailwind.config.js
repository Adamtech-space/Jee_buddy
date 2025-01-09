// /** @type {import('tailwindcss').Config} */
// export default {
//   content: [
//     "./index.html",
//     "./src/**/*.{js,ts,jsx,tsx}",
//   ],
//   theme: {
//     extend: {
//       colors: {
//         primary: 'var(--primary)',
//         'primary-dark': 'var(--primary-dark)',
//       },
//       animation: {
//         'gradient-shift': 'gradientShift 10s ease infinite',
//       },
//       keyframes: {
//         gradientShift: {
//           '0%, 100%': { backgroundPosition: '0% 50%' },
//           '50%': { backgroundPosition: '100% 50%' },
//         },
//       },
//     },
//   },
//   plugins: [],
// }
// -------------------------------
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        'primary-dark': 'var(--primary-dark)',
        dark: {
          DEFAULT: '#0E1420',
          light: '#1A2333',
          darker: '#080C14',
        },
      },
      animation: {
        'gradient-shift': 'gradientShift 10s ease infinite',
        'gradient': 'gradient 8s linear infinite',
        'blob': "blob 7s infinite",
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        gradient: {
          '0%, 100%': {
            'background-size': '200% 200%',
            'background-position': 'left center'
          },
          '50%': {
            'background-size': '200% 200%',
            'background-position': 'right center'
          },
        },
        blob: {
          "0%": {
            transform: "translate(0px, 0px) scale(1)",
          },
          "33%": {
            transform: "translate(30px, -50px) scale(1.1)",
          },
          "66%": {
            transform: "translate(-20px, 20px) scale(0.9)",
          },
          "100%": {
            transform: "translate(0px, 0px) scale(1)",
          },
        },
      },
    },
  },
  plugins: [],
}