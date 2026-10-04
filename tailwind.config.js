/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          light: "#F9F9FB",
          dark: "#1E1E24",
        },
        quest: {
          mission: {
            DEFAULT: "#5D9CEC", // ペールスカイブルー（低刺激）
            bg: "#E6F0FD",
          },
          routine: {
            DEFAULT: "#48CFAD", // ソフトミントグリーン
            bg: "#E5F9F4",
          },
          event: {
            DEFAULT: "#FFCE54", // ウォームハニーイエロー
            bg: "#FFF9E6",
          },
          todo: "#A0A5B5",       // 未達成（ソフトグレー）
          pending: "#F5B041",    // 承認待ち（ソフトオレンジ/黄）
          completed: "#D4AC0D",  // 達成済み（ソフトゴールド）
        },
        text: {
          main: "#2D3238",       // 低刺激なダークチャコール
          muted: "#6B7280",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      }
    },
  },
  plugins: [],
};
