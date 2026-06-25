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
          light: '#f5f7fb',
          orange: '#FF6500',
          charcoal: '#151312',
          ink: '#161B2A',
          ivory: '#FBF7F0',
          neutral: '#F2EEE8',
          muted: '#5F5A55',
          positive: '#39A852'
        }
      }
    }
  },
  plugins: []
}
