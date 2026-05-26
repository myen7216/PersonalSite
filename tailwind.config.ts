import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        body: ["var(--font-body)", "ui-sans-serif", "system-ui"],
      },
      colors: {
        ink: "#101827",
        freezer: "#c9f8ff",
        neon: "#69fff2",
        violet: "#51447d",
        plum: "#2b213a",
      },
    },
  },
  plugins: [],
};

export default config;
