/** @type {import('tailwindcss').Config} */
module.exports = {
  // NativeWind v4: incluir todos los archivos de la app
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Paleta primaria Construpay: azul construcción
        primary: {
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#1A56DB',  // Azul principal
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        // Estados de documentos
        status: {
          green:  '#16A34A',  // Vigente
          yellow: '#CA8A04',  // Por vencer
          red:    '#DC2626',  // Vencido
        },
        // Fondos
        surface: {
          DEFAULT: '#F8FAFC',
          card:    '#FFFFFF',
          border:  '#E2E8F0',
        },
        // Texto
        content: {
          primary:   '#0F172A',
          secondary: '#475569',
          tertiary:  '#94A3B8',
          inverse:   '#FFFFFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'System'],
      },
      borderRadius: {
        card: '12px',
        badge: '6px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 6px rgba(0,0,0,0.07), 0 2px 4px rgba(0,0,0,0.06)',
      },
    },
  },
  plugins: [],
};
