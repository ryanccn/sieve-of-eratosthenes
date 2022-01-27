const { fuchsia } = require('tailwindcss/colors');

module.exports = {
  content: ['./src/**/*.vue', './index.html'],
  theme: {
    extend: {
      colors: {
        primary: fuchsia,
      },
    },
  },
  plugins: [],
};
