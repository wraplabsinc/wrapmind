# WrapMind Estimator

Mobile-first PWA for wrap shops to generate vehicle wrap quotes.

## Features

- **Mobile-First Design**: Optimized for iOS/Android with touch-friendly UI
- **Dark Theme**: Slate background with blue accents for reduced eye strain
- **Two Vehicle Selection Methods**: VIN lookup or Year/Make/Model/Trim browser
- **Auto-Advance Wizard**: Steps advance automatically on selection
- **Smart Auto-Select**: Single options are selected automatically
- **PWA Support**: Installable on mobile, works offline
- **Real-time Pricing**: Calculate wholesale, retail, and margin instantly
- **Vehicle-Specific Coverage**: Sq ft calculated per vehicle
- **Vehicle Summary Cards**: Displayed on Package, Material, and Quote pages

## Design

- Dark slate color scheme (`#0f172a` background)
- Blue accent colors (`#3b82f6`) for interactive elements
- High contrast text for readability
- Touch-optimized with 16px+ tap targets

## Tech Stack

- React + Vite
- Tailwind CSS
- Supabase JS client with `x-api-key` header
- Vite PWA Plugin

## Getting Started

```bash
npm install
npm run dev
```

## Flow

1. **Vehicle Selection**: Choose via VIN lookup or Year → Make → Model → Trim browser
2. **Package Selection**: Select wrap coverage package
3. **Material Selection**: Choose vinyl/PPF material (optional)
4. **Price Summary**: View wholesale, retail, and margin pricing with print option

## Testing

**Test VIN:** `5YJSA1E26TF123456`

Use this VIN in the VIN Lookup mode to test the app. Make sure the Supabase `cars` table has a vehicle with this ID.

Install on mobile:
- iOS: Share → Add to Home Screen
- Android: Chrome menu → Install app

## API Configuration

- **Project URL**: `https://nbewyeoiizlsfmbqoist.supabase.co`
- **API Key**: `wrap-dev-12345678-abcdefghijklmnop` (via `x-api-key` header)

## Database

Tables:
- `cars` - Vehicle data with dimensions and body parts
- `wrap_materials` - Material pricing and specs
- `wrap_packages` - Package coverage and labor

RPC functions:
- `calculate_package_price` - Get wholesale/retail/margin breakdown
- `get_available_packages` - List all packages
- `get_wrap_materials` - List materials by category
