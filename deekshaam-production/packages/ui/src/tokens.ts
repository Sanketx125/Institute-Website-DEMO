// Design tokens extracted from Deekshaam approved design system
export const tokens = {
  colors: {
    primary: '#c2410c', // WCAG AA compliant accessible brand orange (4.6:1 on white)
    primaryDark: '#9a3412',
    primaryLight: '#ffedd5',
    navy: '#0f2440', // Academic deep navy structure
    navyLight: '#1c3a5e',
    ink: '#111827', // Slate 900
    muted: '#4b5563', // Slate 600 (7.5:1 on white)
    line: '#e5e7eb', // Slate 200
    cream: '#f9fafb', // Clean neutral off-white
    soft: '#f3f4f6', // Clean neutral soft gray
    dark: '#0f2440', // Deep institutional navy replaces near-black
    green: '#15803d',
    greenLight: '#dcfce7',
    white: '#ffffff',
    border: '#d1d5db',
  },
  typography: {
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    headings: 'Inter, sans-serif',
  },
  radius: {
    sm: '6px',
    md: '8px',
    lg: '10px',
    xl: '12px',
    full: '9999px',
  },
  shadows: {
    card: '0 20px 60px rgba(22, 24, 26, 0.09)',
    modal: '0 30px 100px rgba(0, 0, 0, 0.3)',
    sm: '0 2px 8px rgba(0,0,0,0.05)',
  },
  breakpoints: {
    mobile: '720px',
    tablet: '1050px',
    desktop: '1200px',
  },
};
