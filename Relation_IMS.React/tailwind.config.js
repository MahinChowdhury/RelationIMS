/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                "primary": "#17cf54",
                "primary-dark": "#12a543",
                "secondary": "#4e9767",
                "tertiary": "#236c31",
                "background-light": "#f8fcf9",
                "background-dark": "#112116",
                "surface-light": "rgba(255, 255, 255, 0.6)",
                "surface-dark": "rgba(17, 33, 22, 0.6)",
                "surface-container": "#eaf0ea",
                "surface-container-low": "#f0f3f0",
                "surface-container-highest": "#dee5de",
                "on-surface": "#0e1b12",
                "on-surface-variant": "#3c4a3b",
                "outline-variant": "#c2c9bf",
                "error": "#ba1a1a",
                "error-container": "#ffdad6",
                "on-error-container": "#410002",
                "text-main": "#0e1b12",
                "text-secondary": "#4e9767",
            },
            fontFamily: {
                "display": ["Manrope", "Noto Sans", "sans-serif"]
            },
            borderRadius: {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "full": "9999px"
            },
            keyframes: {
                slideInRight: {
                    '0%': { transform: 'translateX(100%)', opacity: '0' },
                    '100%': { transform: 'translateX(0)', opacity: '1' },
                },
            },
            animation: {
                slideInRight: 'slideInRight 0.3s ease-out',
            },
        },
    },
}
