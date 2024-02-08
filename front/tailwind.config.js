/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        black: "#000",
        mistyrose: "#ffd2cc",
        gold: "#febe03",
        skyblue: "#87dcf7",
        white: "#fff",
        gray: "#030100",
        silver: "#c8c8c8",
        darkturquoise: {
          "100": "#0ee0f5",
          "200": "#00e0ff",
        },
        moccasin: "#ffedb9",
        mintcream: "#f6fffd",
        forestgreen: "#42b13a",
        crimson: "#ff4161",
        indianred: "#f76179",
        dodgerblue: "#3a8bf0",
        mediumblue: "#4435f8",
        deepskyblue: "#31cdfe",
        gainsboro: "rgba(217, 217, 217, 0)",
        darkgray: "#afafaf",
        blanchedalmond: "rgba(243, 233, 197, 0.95)",
        antiquewhite: {
          "100": "rgba(230, 221, 196, 0.7)",
          "200": "rgba(231, 222, 196, 0.7)",
        },
      },
      spacing: {},
      fontFamily: {
        jua: "Jua",
      },
      borderRadius: {
        "31xl": "50px",
        "316xl": "335px",
        "26xl": "45px",
        "11xl": "30px",
        "10xs": "3px",
      },
    },
    fontSize: {
      "31xl": "3.13rem",
      "81xl": "6.25rem",
      "21xl": "2.5rem",
      "26xl": "2.81rem",
      "16xl": "2.19rem",
      "11xl": "1.88rem",
      sm: "0.88rem",
      "3xl": "1.38rem",
      inherit: "inherit",
    },
    screens: {
      lg: {
        max: "1200px",
      },
      md: {
        max: "960px",
      },
      sm: {
        max: "420px",
      },
    },
  },
  corePlugins: {
    preflight: false,
  },
};
