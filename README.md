# FabZClean - Modern Laundry Management System

A comprehensive, cloud-based laundry management system built with React, TypeScript, Supabase, and Express.

## 🚀 Features

### Core Features
- **Order Management** - Create, track, and manage laundry orders
- **Customer Management** - Comprehensive customer database with history
- **Inventory Tracking** - Real-time inventory management
- **Delivery Tracking** - Live GPS tracking for deliveries
- **Accounting** - Complete accounting system with P&L, balance sheets
- **Analytics** - Advanced analytics and reporting
- **Multi-location Support** - Manage multiple franchises and factories

### Authentication & Security
- **Role-Based Access Control** - 6 different user roles
- **Secure Authentication** - Powered by Supabase Auth
- **Row Level Security** - Database-level security policies
- **Activity Logging** - Comprehensive audit trail

### User Roles
1. **Admin** - Full system access
2. **Franchise Manager** - Manage franchise operations
3. **Factory Manager** - Oversee factory operations
4. **Employee** - Day-to-day operations
5. **Driver** - Delivery management
6. **Customer** - Self-service portal

## 🛠 Tech Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **React Query** - Server state management
- **Wouter** - Routing
- **Recharts** - Data visualization

### Backend
- **Supabase** - Backend as a Service
- **PostgreSQL** - Database
- **Express** - API server (optional, for custom logic)
- **WebSocket** - Real-time updates

### Additional Tools
- **Zod** - Schema validation
- **React Hook Form** - Form management
- **Date-fns** - Date manipulation
- **Lucide React** - Icons

## 📋 Prerequisites

- Node.js 18 or higher
- npm or yarn
- A Supabase account (free tier available)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd FabZClean
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Supabase
Follow the detailed guide in [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

Quick steps:
1. Create a Supabase project at https://supabase.com
2. Run the schema from `supabase/schema.sql` in SQL Editor
3. Copy your API credentials

### 4. Configure Environment
Create a `.env` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your-project-url.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Server Configuration
PORT=5000
HOST=0.0.0.0
NODE_ENV=development

# Session Secret
SESSION_SECRET=your-random-secret
```

### 5. Start Development Server
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

### 6. Create Admin User
1. Sign up at `/signup`
2. In Supabase dashboard, run:
```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

## 📁 Project Structure

```
FabZClean/
├── client/           # Frontend React application
│   └── src/
│       ├── components/   # React components
│       ├── contexts/     # React contexts
│       ├── hooks/        # Custom hooks
│       ├── lib/          # Utilities and config
│       ├── pages/        # Page components
│       └── types/        # TypeScript types
├── server/           # Backend Express server
├── supabase/         # Database schema
├── shared/           # Shared code
└── scripts/          # Utility scripts
```

See [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) for detailed structure.

## 🔐 User Roles & Permissions

### Admin
- Full system access
- User management
- System configuration
- All reports and analytics

### Franchise Manager
- Manage franchise operations
- View franchise analytics
- Manage franchise staff
- Customer management

### Factory Manager
- Factory operations
- Production tracking
- Inventory management
- Factory analytics

### Employee
- Process orders
- Customer service
- Basic reporting
- Daily operations

### Driver
- Delivery tracking
- Route optimization
- Update delivery status
- View assigned deliveries

### Customer
- Place orders
- Track orders
- Payment history
- Profile management

## 📖 Documentation

- [Supabase Setup Guide](./SUPABASE_SETUP.md) - Complete Supabase configuration
- [Project Structure](./PROJECT_STRUCTURE.md) - Detailed project organization
- [API Documentation](./API_DOCUMENTATION.md) - API endpoints reference
- [Architecture](./ARCHITECTURE_DOCUMENTATION.md) - System architecture
- [Frontend Guide](./FRONTEND_ARCHITECTURE_DOCUMENTATION.md) - Frontend details

## 🧪 Testing

```bash
# Run tests
npm test

# Run linting
npm run lint

# Type check
npm run check
```

## 🏗 Building for Production

```bash
# Build frontend
npm run build

# Start production server
npm start
```

## 🚢 Deployment

### Recommended Platforms
- **Frontend**: Vercel, Netlify, or Cloudflare Pages
- **Backend**: Render, Railway, or Heroku
- **Database**: Supabase (included)

### Environment Variables
Set these in your production environment:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `NODE_ENV=production`

## 🔧 Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run check

# Database operations
npm run db:push

# Code cleanup
npm run code:cleanup
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

- **Documentation**: Check the `/docs` folder
- **Issues**: Create an issue in the repository
- **Supabase Support**: https://supabase.com/docs

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] WhatsApp integration
- [ ] Payment gateway integration
- [ ] Advanced route optimization
- [ ] Machine learning for demand prediction
- [ ] Multi-language support
- [ ] Offline mode support

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [shadcn/ui](https://ui.shadcn.com) - Beautiful UI components
- [Tailwind CSS](https://tailwindcss.com) - Styling framework
- [Lucide](https://lucide.dev) - Icon library

## 📞 Contact

For questions or support, please create an issue in the repository.

---

**Built with ❤️ for the laundry industry**
