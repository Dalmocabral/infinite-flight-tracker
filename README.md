# ✈️ LiveFlight Monitor - Infinite Flight Tracker

A fast, modern flight tracking application for the Infinite Flight Simulator. Built with React and MapLibre GL to provide smooth, real-time visualization of global traffic and ATC operations.

## ✨ Features

- **Live Global Map**: Visualize all active flights and ATC control zones in real-time.
- **Smooth Animations**: High-performance JavaScript-based interpolation (`requestAnimationFrame`) for gapless aircraft movement.
- **Detailed Flight Info**: Click any aircraft to see:
    -   Real-time telemetry (Altitude, Speed, Heading).
    -   Flight Plan Trajectory (Colored by altitude).
    -   Pilot & Organization details.
- **ATC Integration**: 
    -   Visual boundaries for FIRs (Flight Information Regions).
    -   Interactive ATC zones (Tower, Approach, Departure).
    -   Sidebar with ATIS, NOTAMs, and Traffic counts.
- **Robust Search**: Filter flights by Username, Callsign, or Virtual Airline.
- **Persisted User Settings**: Saves your map preferences (Zoom, Center) and filters automatically.

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite
- **Mapping**: MapLibre GL JS, MapTiler
- **State & Data**: `@tanstack/react-query`, Axios
- **Code Structure**: Functional Components & Custom Hooks

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- API Key for Infinite Flight (or mock data)
- API Key for MapTiler (free tier available)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-username/liveflight-monitor.git
    cd liverMonitorInfinite
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory:
    ```env
    VITE_API_KEY=your_infinite_flight_api_key
    VITE_MAPTILER_KEY=your_maptiler_key
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

## 🏗️ Architecture

The application recently underwent a major refactoring (Dec 2025) to modularize the map logic into specialized hooks.

### Core Hooks (`src/hooks/map/`)

- **`useMap.js`**:
    -   Initializes the MapLibre instance.
    -   Manages local storage persistence for Zoom/Center.
    -   Handles map resize events.

- **`useAircraftMarkers.js`**:
    -   The "engine" of the visualization.
    -   Syncs React state with MapLibre markers.
    -   Runs the 60fps animation loop to interpolate positions.

- **`useTrajectory.js`**:
    -   Fetches flight plan data.
    -   Handles coordinate unwrapping (Dateline crossing).
    -   Renders the altitude-colored path line.

- **`useAtcLayer.js`**:
    -   Fetches global ATC boundaries (GeoJSON).
    -   Render FIR polygons and fallback circles for local ATC.
    -   Handles click interaction for the ATC Sidebar.

### Component Structure

- **`MapSession.jsx`**: The main coordinator that composes the hooks above.
- **`SidebarMenu.jsx`**: Manages the UI overlays and Search.
- **`AtcInfoSidebar.jsx`**: Displays detailed controller info.

---

*Verified & Tested (Dec 2025)*
