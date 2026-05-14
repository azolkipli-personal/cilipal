# 🌶️ CiliPal

## Why

Most people who grow chilli peppers struggle with the same problem: they forget to water, miss harvest windows, and have no record of what worked and what didn't. Plant care apps exist, but they're generic — they treat your prized Carolina Reaper the same as a supermarket basil plant. Chilli growers need something that understands the obsession: tracking each plant individually, logging fertiliser schedules, and knowing exactly when those pods are ready to pick.

## What

CiliPal is a dedicated chilli plant tracker. Not a generic gardening app — specifically for people who grow chillies and want to obsess over every pod. It gives each plant its own profile with photo diary, care logging, and harvest tracking. You can see at a glance which plants need watering, when you last fertilised, and how your harvest this season compares to the last.

The impact: fewer dead plants, better harvests, and a searchable history of everything you tried — so you actually learn what works in your specific conditions.

## Features

- **Individual plant profiles** — Add multiple plants, each with name, variety, and planting date
- **Photo diary** — Snap and attach photos to track growth over time, with camera integration
- **Care logging** — Record watering, fertilising, pruning, and pest treatments with timestamps
- **Harvest tracking** — Log yields per plant and watch your season totals
- **Local-first storage** — All data stored on-device with SQLite, works offline
- **Push notifications** — Reminders for watering and care schedules
- **Location-aware** — Optional location tagging for garden vs balcony vs indoor plants

## Quick Start

```bash
git clone https://github.com/azolkipli-personal/cilipal
cd cilipal
npm install
npx expo start
```

Scan the QR code with Expo Go (iOS/Android) or press `a` for Android emulator / `i` for iOS simulator.

## Tech Stack

- **Framework**: React Native via Expo (SDK 54)
- **Navigation**: Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Database**: expo-sqlite (on-device SQLite)
- **Camera**: expo-camera, expo-image-picker
- **Notifications**: expo-notifications
- **Location**: expo-location
