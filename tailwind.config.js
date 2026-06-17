module.exports = {
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    './pages/**/*.{ts,tsx,js,jsx}'
  ],
  theme: {
    extend: {
      colors: {
        uiussc: {
          navy: '#0b2545',
          green: '#2fa84f',
          light: '#f5f7fb'
        }
      }
    }
  },
  plugins: []
}
