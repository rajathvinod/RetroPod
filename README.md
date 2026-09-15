# RetroPod Widget 🎵

RetroPod is a transparent, floating desktop widget that brings the nostalgic, authentic experience of a classic iPod right to your Windows desktop. 

Built with **Electron, React, and TypeScript**, it acts as a universal media controller. Instead of being tied to a single service, it taps directly into the native Windows OS to detect and control whatever media you are currently playing—whether that's a YouTube video in Chrome, a podcast in Edge, or a playlist in the Spotify desktop app.

---

## ✨ Features

- **Universal Media Detection:** Uses the Windows System Media Transport Controls (SMTC) API to pull live song metadata and high-res album art from any active media source on your PC.
- **Zero-Latency Native Controls:** Utilizes a custom-compiled C# binary that hooks into the Win32 API (`user32.dll`) to simulate hardware-level media key presses, resulting in completely instant play, pause, and skip controls.
- **Authentic Scroll Wheel:** A fully draggable, interactive click wheel that natively adjusts your Windows master system volume.
- **Resilient Playback Tracking:** A custom React state machine calculates timeline progression mathematically using timestamp deltas, ensuring a buttery-smooth progress bar immune to backend jitter.
- **Dynamic UI & Audio Cues:** Features a bouncing EQ visualizer and utilizes the Web Audio API to generate authentic, mechanical "tick" haptic sounds when scrolling the wheel.
- **Advanced Window Management:** 
  - **Edge-Snapping:** Drag the widget to the edge of your monitor, and it will mathematically calculate its bounds to slide 70% off-screen into a semi-transparent "auto-hide" state. Hovering brings it back.
  - **System Tray Integration:** Runs quietly in the background via the Windows taskbar tray.
  - **Theming:** Includes multiple colorways (Classic White, U2 Edition, and Midnight) selectable from a functional, scrollable iPod OS menu.

---

## 🛠️ Technology Stack

- **Frontend:** React, TypeScript, TailwindCSS, Framer Motion
- **Backend:** Electron, Node.js
- **OS Integration:** Windows SMTC (`windows-media-sessions`), Win32 API (Custom C# executable), `loudness` (Volume Control)
- **Build Tool:** Vite

---

## 🚀 How to Run Locally

### Prerequisites
- Node.js installed on your machine.
- Windows 10 or 11 (required for SMTC media detection).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/RetroPod.git
   cd RetroPod
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

*(Note: The `media_keys.exe` binary is compiled natively. If you wish to recompile the native controls, use the included C# compiler `csc.exe` on the `media_keys.cs` file).*

---

## 💡 Architecture & Design Decisions

### Why a Custom C# Executable?
Initially, media keys were simulated by spawning a hidden PowerShell process via Node's `child_process.exec`. However, PowerShell boot times introduced a 3 to 5-second latency delay between clicking "Pause" and the music actually stopping. To solve this bottleneck, a lightweight C# script (`media_keys.cs`) was compiled into a native `.exe`. Calling this binary from Electron reduced latency from 5000ms to less than 10ms.

### Why Not Use the Spotify API?
Using specific APIs limits the widget's capabilities and requires complex OAuth flows for the user. By intercepting the Windows OS-level SMTC broadcasts, the widget instantly becomes compatible with **all** media players out of the box, requiring zero configuration or logins from the user.
