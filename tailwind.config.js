export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0a0f",
          secondary: "#12121a",
          card: "#1a1a2e",
        },
        accent: {
          DEFAULT: "#6c5ce7",
        },
        success: "#00b894",
        warning: "#f39c12",
        danger: "#e74c3c",
      },
    },
  },
  plugins: [],
};
