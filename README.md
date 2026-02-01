# CampusRetriever 🎓 

### *The Unified Academic Intelligence & Resource Portal*

**CampusRetriever** is a high-performance web application built with **React**, **TypeScript**, and **Vite**. It serves as a centralized "Information Retrieval" engine for students, allowing them to access complex campus data—from lab manuals and faculty details to real-time academic schedules—through a single, optimized interface.

---

## 📖 Table of Contents
1. [Project Overview](#-project-overview)
2. [✨ Core Website Features](#-core-website-features)
3. [Technical Architecture](#-technical-architecture)
4. [Installation & Setup](#-installation--setup)
5. [Future Roadmap](#-future-roadmap)
6. [License](#-license)

---

## 🌟 Project Overview
Navigating university resources is often a fragmented experience. **CampusRetriever** solves this by consolidating disparate data sources into a searchable, user-friendly dashboard. By leveraging modern web technologies, the platform ensures that critical information is always just a few keystrokes away.

---

## ✨ Core Website Features

### 🔍 1. Smart Retrieval Engine
The heart of the website is an advanced search and filter system. Users can query the `metadata.json` database to instantly pull up:
* **Department Directories:** Quick access to faculty lists and office locations.
* **Lab Resources:** Instant retrieval of Lab Manuals (Physics, DS, C-Programming).
* **Course Material:** Search for syllabus copies and lecture notes by course code.

### 📊 2. Dynamic Resource Dashboard
A centralized hub that categorizes campus assets into digestible modules:
* **Live Status Tracking:** (In-development) View which computer labs or study rooms are currently available.
* **Academic Shortcuts:** Quick-links to internal portals like results, attendance, and library catalogs.

### 📱 3. Responsive & Adaptive UI
* **Mobile-First Design:** Optimized for smartphones so students can find classrooms or lab details while walking between buildings.
* **Dark/Light Mode:** Integrated theme switching for comfortable viewing during late-night study sessions.

### 🛡️ 4. Type-Safe Data Handling
Built entirely with **TypeScript**, the website ensures:
* **Zero-Runtime Errors:** Every piece of retrieved data is validated against strictly defined interfaces.
* **Fast Data Hydration:** Using Vite and React for near-instant rendering of large datasets.

### 📂 5. Modular Metadata Management
The website uses a structured `metadata.json` file as its "Single Source of Truth," making it incredibly easy for administrators to update campus information without touching the core code.

---

## 🛠️ Technical Architecture

### **The Stack**
* **Framework:** React (Functional Components & Hooks)
* **Type Management:** TypeScript (Interfaces & Enums)
* **Build Tool:** Vite (ESM-based HMR)
* **Styling:** (Add your CSS Framework here, e.g., Tailwind CSS / Material UI)

### **Directory Logic**
```text
campusretriever/
├── components/     # UI Building blocks (SearchBars, Tables, Cards)
├── pages/          # View logic (Dashboard, SearchResults, About)
├── services/       # Logic for filtering and fetching from metadata.json
├── types.ts        # Shared TypeScript interfaces
└── App.tsx         # Root component and navigation routing
