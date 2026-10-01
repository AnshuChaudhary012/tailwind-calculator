# Modern Tailwind CSS & JavaScript Calculator

A clean, responsive, and feature-rich calculator built with modern **Tailwind CSS** and vanilla **JavaScript**.

## 🔗 Links

- **Live Demo**: [tailwind-calculator-iota.vercel.app](https://tailwind-calculator-iota.vercel.app)
- **GitHub Repository**: [github.com/AnshuChaudhary012/tailwind-calculator](https://github.com/AnshuChaudhary012/tailwind-calculator)

## ✨ Features

- **Modern Responsive Design**: Glassmorphic styling with smooth active states, hover transitions, and dark/light mode toggle.
- **Arithmetic Engine**: Handles addition, subtraction, multiplication, division, percentages, and sign negation (`±`).
- **Precision Safe**: Protects against standard JavaScript floating-point issues (e.g. `0.1 + 0.2 = 0.3`).
- **Full Keyboard Support**:
  - `0` - `9`: Number input
  - `.` : Decimal point
  - `+`, `-`, `*`, `/`: Standard operators
  - `Enter` or `=`: Calculate
  - `Backspace`: Delete last digit
  - `Escape`: Clear All (AC)
  - `%`: Percentage
- **Calculation History**: Stores recent computations in `localStorage`. Click any previous calculation to restore its result.
- **Audio Feedback**: Subtle synthesized click sound using the Web Audio API with an on/off toggle.
- **Theme Persistence**: Light and Dark theme preferences persist across reloads.

## 🚀 How to Run

1. Open `index.html` directly in any web browser:
   - Double click `index.html` in file explorer, or
   - Right click and choose **Open with Browser** (Chrome, Edge, Firefox, Safari).

Alternatively, serve with a lightweight local web server if desired:
```bash
npx serve .
```
