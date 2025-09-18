# MTN Coverage Checker - Deployment Guide

## Overview
This app uses Vercel API routes to proxy MTN coverage API calls, bypassing CORS restrictions that prevent direct browser access to MTN's APIs.

## Architecture
```
Browser → Vercel App → Vercel API Route → MTN APIs → Response
```

## Setup & Deployment

### 1. Environment Variables
Create a `.env.local` file with:
```bash
GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

### 2. Deploy to Vercel

#### Option A: Vercel CLI
```bash
npm install -g vercel
vercel login
vercel --prod
```

#### Option B: GitHub Integration
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy automatically on push

### 3. Vercel Configuration
The `vercel.json` file configures:
- API route timeouts (30s for coverage, 10s for geocoding)
- CORS headers
- SPA routing

### 4. API Endpoints

#### `/api/coverage`
Proxies MTN coverage API calls
- **Parameters**: `lat`, `lng`, `technology`, `type`
- **Example**: `/api/coverage?lat=-26.2041&lng=28.0473&technology=ALL&type=wms`

#### `/api/geocode`
Proxies Google Geocoding API
- **Parameters**: `address`
- **Example**: `/api/geocode?address=Johannesburg%20South%20Africa`

## Testing

### Local Development
```bash
npm run dev
# App runs on http://localhost:3001
# API routes accessible at http://localhost:3001/api/*
```

### Production Testing
```bash
curl "https://your-app.vercel.app/api/coverage?lat=-26.2041&lng=28.0473&technology=ALL&type=wms"
```

## Troubleshooting

### Common Issues

1. **API timeouts**
   - Increase timeout in `vercel.json`
   - MTN APIs can be slow (10-30 seconds)

2. **CORS errors**
   - Verify `vercel.json` CORS configuration
   - Check API route headers

3. **Geocoding failures**
   - Verify `GOOGLE_MAPS_API_KEY` is set
   - Check Google API quotas/billing

4. **No coverage data**
   - MTN APIs may be down/blocking requests
   - Check Vercel function logs

### Debugging
- View logs in Vercel dashboard
- Add console.log statements to API routes
- Test API routes directly before testing frontend

## Performance Optimization

1. **Caching**: Add caching headers to API responses
2. **Parallel requests**: Frontend makes multiple technology requests simultaneously
3. **Timeouts**: Reasonable timeouts prevent hanging requests
4. **Error handling**: Graceful degradation when APIs fail

## Security

1. **API Keys**: Store in Vercel environment variables
2. **Rate limiting**: Consider adding rate limiting to API routes
3. **Input validation**: Validate coordinates and parameters
4. **Error messages**: Don't expose internal API details

## Monitoring

1. **Vercel Analytics**: Built-in performance monitoring
2. **Function logs**: Monitor API route performance
3. **Error tracking**: Track API failures and timeouts
4. **Usage metrics**: Monitor API request volumes

## Cost Considerations

1. **Vercel Functions**: First 100GB-hours free, then $20/month
2. **Google Maps API**: $2-$7 per 1,000 requests (depending on service)
3. **Bandwidth**: Usually minimal for JSON responses

## Scaling

For high traffic, consider:
1. **Caching layer** (Redis, Vercel KV)
2. **CDN** for static assets
3. **Database** for coverage data caching
4. **Alternative APIs** for redundancy