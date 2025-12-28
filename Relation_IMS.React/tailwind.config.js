/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                "primary": "#17cf54",
                "primary-dark": "#12a543",
                "background-light": "#f8fcf9",
                "background-dark": "#112116",
                "surface-light": "rgba(255, 255, 255, 0.6)",
                "surface-dark": "rgba(17, 33, 22, 0.6)",
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
        },
    },
}
