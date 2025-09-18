# MTN Coverage Checker

A modern web application for checking MTN network coverage across South Africa using live MTN APIs.

## 🚀 Features

- **Live MTN Data**: Real-time coverage checking using official MTN APIs
- **Interactive Maps**: Google Maps integration with coverage visualization
- **Multiple Technologies**: 2G, 3G, 4G, 5G, Uncapped Wireless, Fibre, Licensed Wireless, Fixed LTE
- **Modern UI**: Responsive design with glass morphism effects
- **Accurate Results**: No static data fallbacks - only shows verified coverage
- **Address Search**: Intelligent geocoding with South Africa filtering

## 🛠️ Technologies

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with custom design system
- **Maps**: Google Maps JavaScript API v3
- **Backend**: Vercel API Routes (proxy for CORS bypass)
- **APIs**: MTN Coverage APIs, Google Geocoding API

## 📦 Quick Start

### Development
```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env.local
# Add your GOOGLE_MAPS_API_KEY

# Start development server
npm run dev
```

### Production Deployment
```bash
# Deploy to Vercel
vercel --prod

# Or push to GitHub and connect to Vercel
git push origin main
```

## 🏗️ Architecture

### CORS Solution
The app uses Vercel API routes to proxy MTN API calls, bypassing browser CORS restrictions:

```
Browser → Vercel App → API Route → MTN APIs → Success ✅
```

### API Endpoints
- `/api/coverage` - Proxies MTN coverage WMS requests
- `/api/geocode` - Proxies Google Geocoding API

## 🌍 Environment Variables

```bash
# Required for geocoding and maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Auto-detected
NODE_ENV=production
VERCEL_URL=your-app.vercel.app
```

## 📁 Project Structure

```
mtn-coverage-checker/
├── api/                    # Vercel API routes
│   ├── coverage.js         # MTN API proxy
│   └── geocode.js          # Geocoding proxy
├── src/
│   ├── components/         # React components
│   ├── utils/              # API clients & utilities
│   └── types/              # TypeScript definitions
├── docs/                   # Documentation
├── archive/                # Development artifacts
└── vercel.json             # Deployment config
```

## 🔧 Key Features

### Accuracy First
- ✅ Only live MTN API data
- ❌ No static data fallbacks
- ❌ No infrastructure guessing
- ✅ Matches official MTN coverage site

### Performance
- Parallel API requests for multiple technologies
- Smart caching with Vercel edge functions
- Optimized bundle size with Vite

### Developer Experience
- TypeScript for type safety
- Modern React patterns with hooks
- Comprehensive error handling
- Detailed deployment documentation

## 📖 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Complete deployment instructions
- [API Documentation](./docs/) - MTN API integration details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- MTN South Africa for API access
- Google Maps Platform
- Vercel for hosting infrastructure

---
*Last updated: $(date)*