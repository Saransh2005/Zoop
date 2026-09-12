# Zoop Mobile — React Native (Expo) Zoom Clone

A cross-platform React Native mobile application for the Zoop Zoom Clone, built with **Expo SDK 57**, **React Navigation**, and **TypeScript**.

---

## 📱 Features

- **Zoom Dark Theme** — Polished, authentic Zoom mobile interface with dark mode palette.
- **Authentication** — Sign In, Sign Up, and 1-tap "Quick Demo Login" integrated with FastAPI JWT endpoints.
- **Bottom Tab Navigation**:
  - **Meet & Chat (Dashboard)**:
    - 🟧 **New Meeting** — 1-tap instant meeting creation that immediately puts you in a room.
    - 🟦 **Join** — Enter any Meeting ID with display name & audio/video join options.
    - 📅 **Schedule** — Schedule meetings with date chips, time selector, and duration presets.
    - 🖥️ **Share Screen** — Quick invite and meeting sharing.
    - **Personal Meeting ID (PMI)** card with 1-tap copy and share.
    - **Upcoming Meetings** real-time feed with pull-to-refresh.
  - **Meetings**:
    - Filter between **Upcoming** and **Recent / Past** meetings.
    - 1-tap **Start / Join**, copy invite link, or share meeting details natively.
  - **Settings & Profile**:
    - User details (Name, Email, PMID).
    - **Backend Server Switcher** — easily switch between the deployed Render cloud backend (`https://zoop-t1l7.onrender.com`) and your local development server (`http://<LAN_IP>:8000`).
    - Meeting audio/video preferences.
- **Meeting Room Experience**:
  - Full-screen dark room with active speaker tile.
  - Front / back camera live preview using `expo-camera`.
  - Zoom signature bottom controls bar (Mute/Unmute, Start/Stop Video, Share, Participants, Chat).
  - Real-time in-meeting chat via **FastAPI WebSockets**.
  - Host controls (mute participants, remove participants, end meeting for all).
  - Meeting info popup with one-tap invite link copying.
  - Elapsed meeting timer (`00:00`).

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd mobile
npm install
```

### 2. Start Expo Development Server
```bash
npx expo start
```

### 3. Run on Device or Simulator
- **Physical Phone (iOS or Android)**:
  1. Download the **Expo Go** app from the App Store or Google Play Store.
  2. Scan the QR code displayed in your terminal.
- **iOS Simulator** (Mac with Xcode):
  Press `i` in the terminal.
- **Android Emulator**:
  Press `a` in the terminal.
- **Web Preview**:
  Press `w` in the terminal.

---

## ⚙️ Backend Connectivity

By default, the mobile app connects to the live deployed cloud backend:
```
https://zoop-t1l7.onrender.com
```

### Connecting to Local Development Backend
If you are running the FastAPI backend locally (`uvicorn main:app --reload --port 8000`):
1. Find your machine's local network IP address (e.g. `192.168.1.50` on Wi-Fi).
2. Open the Zoop mobile app.
3. Go to the **Settings** tab.
4. In **Backend Server Configuration**, set the URL to:
   ```
   http://192.168.1.50:8000
   ```
5. Tap **Save URL**.
