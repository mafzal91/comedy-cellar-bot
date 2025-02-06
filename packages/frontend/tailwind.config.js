/** @type {import('tailwindcss').Config} */
import plugin from "tailwindcss/plugin";

// https://github.com/tailwindlabs/tailwindcss/discussions/2466#discussioncomment-10250392
const padPlugin = plugin(({ matchUtilities, theme }) => {
  matchUtilities(
    {
      "pad-x": (value) => ({
        "& > *": {
          "padding-left": value,
          "padding-right": value,
          "&:first-child": {
            "padding-left": "0",
          },
          "&:last-child": {
            "padding-right": "0",
          },
        },
      }),
      "pad-y": (value) => ({
        "& > *": {
          "padding-top": value,
          "padding-bottom": value,
          "&:first-child": {
            "padding-top": "0",
          },
          "&:last-child": {
            "padding-bottom": "0",
          },
        },
      }),
    },
    {
      values: theme("spacing"),
    }
  );
});

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#f6cb5c",
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), padPlugin],
};
