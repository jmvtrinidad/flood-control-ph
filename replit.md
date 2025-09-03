# Infrastructure Project Analytics Dashboard

## Overview

This is a comprehensive infrastructure project analytics dashboard designed for analyzing infrastructure projects across the Philippines. The application provides advanced filtering, mapping, and data visualization capabilities through an interactive web interface. It features a modern full-stack architecture with React frontend, Express backend, and PostgreSQL database, specifically designed to handle large datasets of infrastructure projects with geographic visualization and analytical insights.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern development
- **UI Framework**: Tailwind CSS with shadcn/ui component library for consistent, accessible design
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Charts & Visualization**: Recharts library for responsive data visualization components
- **Form Handling**: React Hook Form with Zod validation for type-safe form management

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules for modern JavaScript features
- **API Design**: RESTful API with structured error handling and request logging
- **File Handling**: Multer middleware for file uploads (JSON project data)
- **Data Validation**: Zod schemas for runtime type checking and API validation

### Database & ORM
- **Database**: PostgreSQL with spatial data support for geographic coordinates
- **ORM**: Drizzle ORM for type-safe database queries and schema management
- **Database Provider**: Neon serverless PostgreSQL for scalable cloud hosting
- **Schema**: Projects table with comprehensive metadata including coordinates, costs, fiscal years, and project details
- **Connection**: Connection pooling with environment-based configuration

### Data Storage Strategy
- **Primary Storage**: PostgreSQL database for persistent project data
- **Memory Storage**: In-memory fallback storage implementation for development/testing
- **Caching**: Browser localStorage for client-side data caching and offline functionality
- **File Storage**: JSON file upload capability for bulk data import

### Development & Build Tools
- **Build Tool**: Vite for fast development and optimized production builds
- **Development**: Hot module replacement with error overlay for rapid iteration
- **Production**: ESBuild for efficient server-side bundling
- **Type Checking**: TypeScript compiler with strict mode enabled
- **Code Quality**: Path aliases for clean imports and organized code structure

### UI/UX Design System
- **Design System**: shadcn/ui with New York style variant
- **Theming**: CSS custom properties with light/dark mode support
- **Icons**: Lucide React icons with Font Awesome fallbacks
- **Typography**: Inter font family for modern, readable interface
- **Responsive**: Mobile-first design with breakpoint-based layouts

### Geographic Integration
- **Mapping**: Google Maps JavaScript API for interactive map visualization
- **Location Data**: Latitude/longitude coordinates stored as decimal fields
- **Places API**: Google Places integration for location search and autocomplete
- **Marker Management**: Custom map markers with project information popups

## External Dependencies

### Core Framework Dependencies
- **@tanstack/react-query**: Server state management and data fetching
- **wouter**: Lightweight routing library for React applications
- **drizzle-orm**: Type-safe ORM for PostgreSQL database operations
- **drizzle-kit**: Database schema migration and management tools

### Database & Backend Services
- **@neondatabase/serverless**: Neon PostgreSQL serverless database driver
- **connect-pg-simple**: PostgreSQL session store for Express applications
- **multer**: File upload middleware for handling JSON project data

### UI Component Libraries
- **@radix-ui/react-***: Comprehensive accessible component primitives
- **class-variance-authority**: Type-safe CSS class variant management
- **tailwind-merge**: Utility for merging Tailwind CSS classes
- **cmdk**: Command palette component for enhanced user interactions

### Data Visualization
- **recharts**: React charting library for analytics and data visualization
- **date-fns**: Date manipulation and formatting utilities

### Development Tools
- **vite**: Next-generation frontend build tool
- **typescript**: Static type checking for enhanced code quality
- **@replit/vite-plugin-runtime-error-modal**: Development error handling
- **@replit/vite-plugin-cartographer**: Replit-specific development enhancements

### External APIs
- **Google Maps JavaScript API**: Interactive mapping and geographic visualization
- **Google Places API**: Location search and geographic data services
- **Font Awesome CDN**: Additional icon library for enhanced UI elements
- **Google Fonts**: Inter font family for consistent typography