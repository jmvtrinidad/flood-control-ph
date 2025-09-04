# Infrastructure Project Analytics Dashboard

A comprehensive web application for analyzing infrastructure projects across the Philippines, featuring interactive dashboards, Google Maps integration, and advanced analytics capabilities.

## Features

- 🏗️ **Project Management**: Comprehensive infrastructure project database with 9,731+ Philippine projects
- 📊 **Advanced Analytics**: Interactive charts, regional analysis, and contractor performance metrics
- 🗺️ **Interactive Maps**: Google Maps integration with project location visualization
- 🔍 **Advanced Filtering**: Filter by region, contractor, fiscal year, cost range, and date ranges
- 📈 **Data Visualization**: Charts powered by Recharts for investment analysis and project trends
- 📱 **Responsive Design**: Modern UI built with React, TypeScript, and Tailwind CSS

## Prerequisites

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **Google Maps API Key** (for map functionality)

## Local Development Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd infrastructure-analytics-dashboard
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# Google Maps API Key (required for map functionality)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 3. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Maps JavaScript API** and **Places API**
4. Create credentials (API Key)
5. Add your domain/localhost to API key restrictions
6. Copy the API key to your `.env` file

### 4. Run the Application

```bash
# Development mode (with hot reload)
npm run dev
```

The application will be available at `http://localhost:5000`

### 5. Build for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

## Docker Deployment

### Option 1: Build Docker Image Locally

Create a `Dockerfile` in the root directory:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/analytics || exit 1

# Start the application
CMD ["npm", "start"]
```

Build and run the Docker image:

```bash
# Build the image
docker build -t infrastructure-dashboard .

# Run the container
docker run -p 5000:5000 \
  -e VITE_GOOGLE_MAPS_API_KEY=your_api_key_here \
  infrastructure-dashboard
```

### Option 2: Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  dashboard:
    build: .
    ports:
      - "5000:5000"
    environment:
      - VITE_GOOGLE_MAPS_API_KEY=${VITE_GOOGLE_MAPS_API_KEY}
      - NODE_ENV=production
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/api/analytics"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

Run with Docker Compose:

```bash
# Start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

## Project Structure

```
infrastructure-dashboard/
├── client/                 # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   ├── pages/         # Application pages
│   │   └── types/         # TypeScript type definitions
│   └── index.html
├── server/                # Express backend application
│   ├── index.ts          # Server entry point
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Data storage layer
│   ├── vite.ts           # Vite development server
│   └── initial-data.json # Pre-loaded project data
├── shared/               # Shared code between client and server
│   └── schema.ts        # Data schemas and types
├── package.json         # Dependencies and scripts
├── vite.config.ts      # Vite configuration
├── tailwind.config.ts  # Tailwind CSS configuration
└── tsconfig.json       # TypeScript configuration
```

## API Endpoints

The application provides the following REST API endpoints:

- `GET /api/projects` - Retrieve projects with optional filtering
- `GET /api/projects/:id` - Get single project details
- `POST /api/projects` - Create new project
- `POST /api/projects/bulk` - Bulk create projects
- `POST /api/projects/upload` - Upload projects from JSON file
- `GET /api/analytics` - Get comprehensive analytics data

## Data Management

### Automatic Data Loading

The application automatically loads a comprehensive dataset of 9,731 Philippine infrastructure projects on startup. No manual data upload is required.

### Data Filtering

Available filters:
- **Search**: Project name, location, contractor, or region
- **Cost Range**: Minimum and maximum project costs
- **Region**: Philippine administrative regions
- **Contractor**: Specific contractor names
- **Fiscal Year**: Project fiscal years
- **Date Range**: Project start/completion dates
- **Status**: Project status (active, completed, etc.)

### Data Storage

The application uses in-memory storage with automatic data persistence. For production deployments requiring data persistence across restarts, consider implementing database storage (PostgreSQL recommended).

## Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling framework
- **shadcn/ui** - UI component library
- **TanStack Query** - Server state management
- **Recharts** - Data visualization
- **Wouter** - Lightweight routing
- **Google Maps API** - Interactive mapping

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **Drizzle ORM** - Database toolkit
- **Zod** - Schema validation
- **Multer** - File upload handling

### Development Tools
- **Vite** - Build tool and dev server
- **ESBuild** - Fast bundling
- **PostCSS** - CSS processing
- **Drizzle Kit** - Database migrations

## Performance Considerations

- **Data Caching**: Client-side caching with TanStack Query
- **Code Splitting**: Automatic route-based code splitting
- **Image Optimization**: Lazy loading for map markers
- **Bundle Analysis**: Use `npm run build` to analyze bundle size

## Troubleshooting

### Common Issues

1. **Google Maps not loading**:
   - Verify `VITE_GOOGLE_MAPS_API_KEY` is set correctly
   - Check API key restrictions in Google Cloud Console
   - Ensure Maps JavaScript API is enabled

2. **Port already in use**:
   - Change the PORT in `.env` file
   - Kill existing processes using the port

3. **Build failures**:
   - Clear npm cache: `npm cache clean --force`
   - Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`

### Development Mode Issues

- If hot reload isn't working, restart the dev server
- Clear browser cache if changes aren't reflected
- Check console for TypeScript errors

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Run type checking: `npm run check`
5. Build the project: `npm run build`
6. Commit your changes: `git commit -m 'Add your feature'`
7. Push to the branch: `git push origin feature/your-feature`
8. Submit a pull request

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Support

For support and questions:
- Check the troubleshooting section above
- Review the project documentation
- Open an issue on the repository

---

**Infrastructure Project Analytics Dashboard** - Empowering data-driven infrastructure development across the Philippines.