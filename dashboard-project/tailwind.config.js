/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "#6366f1", // Premium Indigo
                    foreground: "#ffffff",
                },
                secondary: {
                    DEFAULT: "#f8fafc",
                    foreground: "#0f172a",
                },
                accent: {
                    DEFAULT: "#3b82f6",
                    foreground: "#ffffff",
                },
                card: {
                    DEFAULT: "#ffffff",
                    foreground: "#0f172a",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
                xl: "1rem",
                '2xl': "1.5rem",
            },
            animation: {
                "fade-in": "fadeIn 0.5s ease-out",
                "slide-in-right": "slideInRight 0.3s ease-out",
                "pulse-subtle": "pulseSubtle 2s infinite",
            },
            keyframes: {
                fadeIn: {
                    "0%": { opacity: "0", transform: "translateY(10px)" },
                    "100%": { opacity: "1", transform: "translateY(0)" },
                },
                slideInRight: {
                    "0%": { transform: "translateX(100%)" },
                    "100%": { transform: "translateX(0)" },
                },
                pulseSubtle: {
                    "0%, 100%": { opacity: "1" },
                    "50%": { opacity: "0.7" },
                },
            },
        },
    },
    plugins: [],
}
