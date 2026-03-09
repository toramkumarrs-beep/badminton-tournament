import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "#0a0a0a", // Deep obsidian
                foreground: "#ededed", // Off-white text
                card: "rgba(255, 255, 255, 0.05)",
                primary: {
                    DEFAULT: "#10b981", // Emerald 500
                    hover: "#059669",   // Emerald 600
                },
                secondary: {
                    DEFAULT: "#8b5cf6", // Violet 500
                    hover: "#7c3aed",   // Violet 600
                },
                bracket: {
                    line: "rgba(255, 255, 255, 0.15)",
                    active: "#10b981",
                }
            },
            backgroundImage: {
                'hero-glow': 'radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.25) 0%, rgba(10, 10, 10, 0) 50%)',
            },
        },
    },
    plugins: [],
};

export default config;
