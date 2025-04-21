/** @type {import('tailwindcss').Config} */
module.exports = {
  // ...existing config...
  
  theme: {
    extend: {
      // ...existing extends...
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        }
      }
    },
  },
  
  // ...rest of the config...
}
