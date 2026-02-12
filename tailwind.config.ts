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
        brand: {
          50: "#f0f4ff",
          100: "#dbe4ff",
          200: "#bac8ff",
          300: "#91a7ff",
          400: "#748ffc",
          500: "#5c7cfa",
          600: "#4c6ef5",
          700: "#4263eb",
          800: "#3b5bdb",
          900: "#364fc7",
        },
        success: { light: "#d3f9d8", DEFAULT: "#40c057", dark: "#2b8a3e" },
        danger: { light: "#ffe3e3", DEFAULT: "#fa5252", dark: "#c92a2a" },
        warning: { light: "#fff3bf", DEFAULT: "#fab005", dark: "#e67700" },
      },
    },
  },
  plugins: [],
};
export default config;
