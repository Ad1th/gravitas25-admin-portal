# Gravitas 25 Admin Portal

A full-stack web application for managing MFC's CodeXcape Gravitas 25 event administration. This project consists of a Node.js/Express backend with Supabase integration and a vanilla HTML/CSS/JavaScript frontend for administrative tasks.

## 🚀 Features

- **Authentication System**: Secure admin login with JWT tokens
- **Event Management**: Create, read, update, and delete events
- **User Management**: Handle user registrations and profiles
- **Submission Tracking**: Monitor and manage event submissions
- **Score Management**: Track and update scoring for events
- **Real-time Dashboard**: Admin portal with live data updates

## 🛠 Tech Stack

### Backend

- **Node.js** with Express.js framework
- **Supabase** for database and authentication
- **JWT** for secure authentication
- **Redis** for caching and session management
- **bcrypt** for password hashing

### Frontend

- **Vanilla HTML/CSS/JavaScript**
- **Font Awesome** icons
- **Google Fonts** (Inter)
 
### Development & Deployment

- **pnpm** package manager
- **Vercel** for deployment
- **Nodemon** for development server
- **ESLint** & **Prettier** for code quality
- **Husky** for git hooks

## 📦 Installation

### Prerequisites

- Node.js (v14 or higher)
- pnpm (recommended) or npm
- Redis server (optional, for caching)
- Supabase project

### Setup

1. **Clone the repository**

   ```bash
   git clone https://github.com/Ad1th/gravitas25-admin-portal.git
   cd gravitas25-admin-portal
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment Configuration**

   Copy the example environment file:

   ```bash
   cp .env.example .env
   ```

   Configure your `.env` file with the following variables:

   ```env
   # Server
   PORT=4000

   # Redis (optional, for caching)
   REDIS_URL=redis://localhost:6379

   # Supabase
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key

   # JWT
   JWT_SECRET=your_jwt_secret_key
   ```

4. **Supabase Setup**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Set up your database tables (User, Event, Submission, etc.) in the Supabase dashboard
   - Get your project URL and anon key from the Supabase project settings
   - Update your `.env` file with these credentials

5. **Verify Redis Connection**
   ```bash
   pnpm run redis:check
   ```

## 🚀 Running the Application

### Development Mode

```bash
# Start backend development server
pnpm run dev

# The server will start at http://localhost:4000
```

### Production Mode

```bash
# Build the application
pnpm run build

# Start production server
pnpm start
```

### Frontend Development

The frontend is served statically from the `/frontend` directory and accessible at:

- Local: `http://localhost:4000/frontend`
- Admin Portal: `http://localhost:4000/frontend/index.html`

## 📁 Project Structure

```
├── api/                    # Vercel serverless function entry
│   └── index.js
├── frontend/              # Static frontend files
│   ├── index.html         # Admin portal UI
│   ├── main.js           # Frontend JavaScript
│   ├── style.css         # Styling
│   └── package.json      # Frontend dependencies
├── middleware/           # Express middleware
│   ├── auth.js          # Authentication middleware
│   └── requireAdmin.js  # Admin role verification
├── src/                 # Backend source code
│   ├── app.js          # Express app configuration
│   ├── server.js       # Server entry point
│   ├── config/
│   │   └── supabase.js # Supabase client configuration
│   ├── controllers/    # Route controllers
│   │   ├── authController.js
│   │   ├── eventController.js
│   │   ├── scoreController.js
│   │   ├── submissionController.js
│   │   └── userController.js
│   ├── routes/         # API routes
│   │   ├── auth.route.js
│   │   ├── event.route.js
│   │   ├── score.route.js
│   │   ├── submission.route.js
│   │   └── userRoute.js
│   └── utils/
│       └── logger.js   # Application logging
├── package.json        # Main package configuration
├── vercel.json        # Vercel deployment config
├── .env.example       # Environment variables template
└── .gitignore         # Git ignore rules
```

## 🔗 API Endpoints

### Authentication

- `POST /auth/login` - Admin login
- `POST /auth/logout` - Admin logout
- `GET /auth/verify` - Verify JWT token

### Users

- `GET /users` - List all users
- `GET /users/:id` - Get user by ID
- `PUT /users/:id` - Update user
- `DELETE /users/:id` - Delete user

### Events

- `GET /events` - List all events
- `POST /events` - Create new event
- `GET /events/:id` - Get event by ID
- `PUT /events/:id` - Update event
- `DELETE /events/:id` - Delete event
- `GET /events/schedule` - Get event schedule

### Submissions

- `GET /submissions` - List all submissions
- `POST /submissions` - Create submission
- `GET /submissions/:id` - Get submission by ID
- `PUT /submissions/:id` - Update submission
- `DELETE /submissions/:id` - Delete submission

### Scores

- `GET /scores` - List all scores
- `POST /scores` - Create/update score
- `GET /scores/:id` - Get score by ID

## 🛠 Available Scripts

### Development

- `pnpm dev` - Start development server with auto-reload
- `pnpm start` - Start production server

### Database

- Database operations are handled through Supabase dashboard
- Use Supabase SQL editor for database queries and schema changes
- Access Supabase dashboard for table management and data viewing

### Code Quality

- `pnpm run lint` - Run ESLint
- `pnpm run lint:fix` - Fix ESLint errors automatically
- `pnpm run format` - Check Prettier formatting
- `pnpm run format:fix` - Fix Prettier formatting

### Health Checks

- `pnpm run redis:check` - Check Redis connection
- `pnpm run health:check` - Check server health

### Build & Deploy

- `pnpm run build` - Build both frontend and backend
- `pnpm run build:frontend` - Build only frontend
- `pnpm run build:backend` - Build only backend

## 🚀 Deployment

### Vercel Deployment

The application is configured for easy deployment on Vercel:

1. **Connect your GitHub repository to Vercel**

2. **Configure Environment Variables**
   Add all required environment variables in your Vercel project settings.

3. **Deploy**
   ```bash
   vercel --prod
   ```

The `vercel.json` configuration handles:

- API routes via serverless functions (`/api/*`)
- Static frontend serving (`/*`)

### Manual Deployment

1. **Build the application**

   ```bash
   pnpm run build
   ```

2. **Deploy to your preferred hosting platform**
   - Ensure environment variables are configured
   - Point to `src/server.js` as the entry point

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **CORS Protection**: Configured for specific origins
- **Rate Limiting**: Built-in request rate limiting
- **Input Validation**: Express validator for request validation
- **Admin Role Verification**: Middleware for admin-only routes

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style
- Run `pnpm run lint:fix` and `pnpm run format:fix` before committing
- Write meaningful commit messages
- Test your changes thoroughly

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Repository Owner**: [Ad1th](https://github.com/Ad1th)

## 🐛 Issues & Support

If you encounter any issues or need support:

1. Check existing [GitHub Issues](https://github.com/Ad1th/gravitas25-admin-portal/issues)
2. Create a new issue with detailed information
3. Include steps to reproduce the problem

## 🔄 Changelog

### v1.0.0

- Initial release
- Admin authentication system
- Event management functionality
- User management system
- Submission tracking
- Score management
- Frontend admin portal
