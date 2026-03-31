/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      typography: {
        DEFAULT: {
          css: {
            h1: {
              color: 'var(--color-primary)',
              lineHeight: '1.2',
            },
            h2: {
              color: 'var(--color-accent)',
            },
            h3: {
              color: 'var(--color-accent)',
            },
            code: {
              color: 'var(--tw-color-green-400)',
              backgroundColor: 'var(--color-code-bg)',
            },
            blockquote: {
              borderLeftColor: 'var(--color-accent)',
              color: 'var(--color-text-secondary)',
            },
            img: {
              borderRadius: '0.5rem',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            a: {
              color: '#3182ce',
              '&:hover': {
                color: '#2c5282',
              },
            },
          },
        },
      },
    },
  },
};
