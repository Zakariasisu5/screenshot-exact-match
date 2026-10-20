# RemitShip - International Shipping & Logistics Platform

A modern, DHL-inspired international shipping and logistics platform built for RemitShip. Features real-time shipment tracking, secure staff authentication, and a comprehensive service management system.

This project was built with [Lovable](https://lovable.dev).

## 🚀 Features

### Public-Facing Features
- **Hero Section with Integrated Tracking**: Clean, professional landing page with embedded tracking form
- **Service Categories**: 
  - Document & Parcel Shipping (Express Air Delivery, Flexible Times, Insurance)
  - Cargo Shipping (Air/Ocean/Road Freight, Warehousing)
- **Smooth Scroll Effects**: Parallax scrolling, fade-in animations, and dynamic image sections
- **Image Galleries**: Professional photography showcasing fleet and operations
- **Trust Indicators**: Security, global network, and on-time delivery highlights
- **Statistics Dashboard**: Key metrics (15+ years, 50K+ shipments, 100+ countries, 99.8% on-time)
- **Responsive Design**: Mobile-first approach with tablet and desktop optimizations

### Staff Portal
- **Split-Panel Authentication**: DHL-inspired auth pages with brand panel and form panel
- **Multiple Auth Modes**: Sign in, Sign up, Password reset with email verification
- **Google OAuth Integration**: One-click sign-in with Google
- **Role-Based Access**: Staff roles assigned by administrators
- **Session Management**: Secure authentication with Supabase

### Admin Dashboard
- **Shipment Management**: Create, update, and track shipments
- **Status Updates**: Real-time shipment status changes with notifications
- **Delivery Actions**: Mark shipments as delivered with proof of delivery
- **Secure Access**: Protected routes with staff authentication

## 🎨 Design System

### Color Palette
- **Primary Navy**: `#10284B` (Brand color, headers, CTAs)
- **Secondary Blue**: `#1a3a5f` (Gradients, accents)
- **White/Light**: Clean backgrounds and text on dark sections
- **Trust Indicators**: Green (`#2e7d32`), Red (`rgb(229, 57, 53)`)

### Typography
- **Headlines**: 2.5rem - 3rem, weight 700, tight line-height
- **Body**: 1rem - 1.125rem, line-height 1.5-1.7
- **Buttons**: 1rem, weight 600

### Layout Structure
- **Hero**: Full-width with background image overlay
- **Service Cards**: Grid layout with icons, descriptions, and CTAs
- **Image Sections**: Parallax backgrounds with content overlays
- **Trust Band**: Centered content with icon grid
- **CTAs**: Two-column grid for personal/business options

## 🛠️ Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (React-based)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) with Radix UI primitives
- **Styling**: Tailwind CSS v4 with custom CSS
- **Icons**: Lucide React
- **Backend**: Supabase (Authentication, Database)
- **Build Tool**: Vite
- **Package Manager**: npm / Bun
- **Routing**: TanStack Router with file-based routing

## 📁 Project Structure

```
src/
├── assets/              # Images and static files
│   ├── manship.jpeg     # Fleet operations image
│   ├── remitship.jpeg   # International shipping image
│   ├── remitship-hq.jpg # Headquarters hero image
│   ├── remitship-icon.png
│   └── remitship-logo.png
├── components/
│   ├── remitship/       # RemitShip-specific components
│   │   ├── action-form.tsx      # Admin action form
│   │   ├── admin-shell.tsx      # Admin layout wrapper
│   │   ├── public-shell.tsx     # Public site layout
│   │   ├── shipment-list.tsx    # Shipment table
│   │   └── tracking-form.tsx    # Public tracking input
│   └── ui/              # shadcn/ui components (40+ components)
├── integrations/
│   └── supabase/        # Supabase client and auth
├── lib/
│   ├── remitship.ts              # Core utilities
│   ├── remitship.functions.ts   # Server functions
│   └── utils.ts                  # Helper functions
├── routes/
│   ├── index.tsx        # Homepage
│   ├── auth.tsx         # Authentication page
│   ├── auth_.reset.tsx  # Password reset
│   ├── admin.tsx        # Admin dashboard
│   └── __root.tsx       # Root layout
└── styles.css           # Global styles + DHL-inspired CSS
```

## 💻 Development

### Prerequisites
- Node.js 18+ (install with [nvm](https://github.com/nvm-sh/nvm))
- npm or Bun package manager

### Local Setup

```sh
# Clone the repository
git clone <this-repository-url>
cd screenshot-exact-match

# Install dependencies
npm install
# or
bun install

# Set up environment variables
cp .env.example .env
# Add your Supabase credentials to .env

# Start development server
npm run dev
# or
bun run dev
```

The app will be available at `http://localhost:8082`

### Available Scripts

```sh
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🗄️ Database Schema

Key tables:
- **shipments**: Tracking data, origin, destination, status
- **actions**: Staff updates and status changes
- **profiles**: User/staff information

## 🎯 Key Features Implementation

### Smooth Scrolling Effects
- Intersection Observer API for triggering animations
- CSS transitions for smooth fade-ins and slide-ins
- Parallax scrolling on background images
- Dynamic transform based on scroll position

### Authentication Flow
1. User visits `/auth`
2. Options: Sign in, Sign up, or Password reset
3. Sign up requires email verification
4. Administrator assigns staff role
5. Authenticated users access `/admin`

### Shipment Tracking
1. Public users enter tracking number on homepage
2. System queries database for shipment
3. Displays status, location, and timeline
4. Staff can update status from admin panel

## 🌐 Deployment

### Deploy with Lovable
Changes pushed to the `main` branch automatically sync to Lovable and trigger deployments.

### Manual Deployment
```sh
npm run build
# Deploy the dist/ folder to your hosting provider
```

## 📝 License

This project is proprietary software for RemitShip.

## 🔗 Links

- **Lovable Editor**: [Continue developing](https://lovable.dev/projects/bec214bd-304b-4ed6-8b4d-47f1f92bfc60)
- **Documentation**: See `roadmap.md` for feature roadmap

## 🤝 Contributing

This project is managed through Lovable. To contribute:
1. Make changes in the Lovable editor
2. Changes auto-commit to this repository
3. Pull changes locally if needed: `git pull origin main`

## 📧 Support

For questions or issues, contact the RemitShip development team.

---

**Built with ❤️ using Lovable and modern web technologies**
