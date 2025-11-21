/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Moonlit brand colors
        moonlit: {
          coral: '#EE9B7F',     // Primary coral/salmon color
          navy: '#0B1929',      // Dark navy for headings
          cream: '#FAF4F0',     // Cream background
          beige: '#F5ECE5',     // Alternative beige
          gray: '#6B7280',      // Body text gray
          'coral-hover': '#E88B6F', // Darker coral for hover
        },
        // Keep for backwards compatibility during transition
        primary: '#EE9B7F',
        secondary: '#0B1929',
      },
    },
  },
  plugins: [],
}