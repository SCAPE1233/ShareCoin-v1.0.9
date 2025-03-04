import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Expose custom CSS properties as tailwind colors
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
        
       // If you want to customize the default breakpoints, uncomment and edit:
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
        "2xl": "1536px",
      },
      
    },
  },
  plugins: [],
} satisfies Config;
