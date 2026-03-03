# Multi-Tenant Hostel Management System (StayNest)

A production-ready **multi-tenant SaaS platform** for hostel management with superadmin-approved owner model, strict data isolation, role-based access control, and a polished modern frontend.

## 🎯 Features

### Multi-Tenant Architecture
- **Superadmin**: Platform administrator who approves/rejects owner applications
- **Owner**: Hostel owners who manage their own properties and staff
- **Staff**: Created by owners, can manage owner's hostels
- **Resident**: Default role — can browse hostels, book rooms, and apply for ownership

### Core Functionality
- ✅ Owner application and approval workflow
- ✅ Strict data isolation between tenants
- ✅ Staff management by owners
- ✅ Hostel and room management with image uploads
- ✅ Booking system with owner approval
- ✅ Billing and maintenance tracking
- ✅ Email notifications (Nodemailer)
- ✅ Email verification with OTP
- ✅ Password reset via email
- ✅ Audit logging for security-critical actions
- ✅ Activity log per user
- ✅ Rate limiting for applications
- ✅ Pagination and search/filtering
- ✅ Analytics dashboard for owners and superadmin
- ✅ Hostel reviews and ratings
- ✅ Marketplace for hostel listings
- ✅ Gate pass management
- ✅ Phone verification
- ✅ Account suspension by superadmin
- ✅ Comprehensive input validation (frontend + backend)
- ✅ Atomic operations for concurrency safety

## 🏗️ Tech Stack

### Backend
- **Node.js** + **Express.js**
- **MongoDB** + **Mongoose**
- **JWT** authentication
- **Nodemailer** for emails
- **bcryptjs** for password hashing
- **Multer** for file/image uploads
- **express-rate-limit** for rate limiting
- **helmet**, **cors**, **xss-clean** for security
- **Service layer** architecture for business logic separation
- **Centralized validation** via `validations/` directory

### Frontend
- **React** + **Vite**
- **React Router v6** for navigation
- **Axios** for API calls
- **CSS3** with premium gradients and glassmorphism
- **Design system** with reusable UI components (`Button`, `Input`, `Badge`, `Spinner`, `Skeleton`, `EmptyState`)
- **Layout system**: `AuthLayout`, `DashboardLayout`, `MainLayout`
- **Custom hooks** for shared logic
- **Toast notifications** and **Success modals**
- **Skeleton loading states**
- **TiltCard** micro-animations

## 📁 Project Structure

```
HostelManagement/
├── backend/
│   ├── config/            # Constants and app configuration
│   ├── controllers/       # Route handler functions
│   │   ├── authController.js
│   │   ├── superadminController.js
│   │   ├── ownerController.js
│   │   ├── hostelController.js
│   │   ├── roomController.js
│   │   ├── bookingController.js
│   │   ├── billController.js
│   │   ├── maintenanceController.js
│   │   ├── analyticsController.js
│   │   ├── reviewController.js
│   │   ├── marketplaceController.js
│   │   ├── gatePassController.js
│   │   ├── phoneController.js
│   │   └── accountController.js
│   ├── middleware/        # Auth, ownership, rate limiting, upload
│   ├── models/            # Mongoose schemas
│   │   ├── User.js
│   │   ├── OwnerApplication.js
│   │   ├── Hostel.js
│   │   ├── Room.js
│   │   ├── Booking.js
│   │   ├── Bill.js
│   │   ├── MaintenanceRequest.js
│   │   ├── Review.js
│   │   ├── AuditLog.js
│   │   ├── ActivityLog.js
│   │   ├── OtpVerification.js
│   │   ├── Notification.js
│   │   └── Counter.js
│   ├── routes/            # API route definitions
│   ├── services/          # Business logic layer (email, etc.)
│   ├── uploads/           # Uploaded files (hostel images)
│   ├── utils/             # Seed scripts, audit logger, helpers
│   ├── validations/       # Centralized Joi/express-validator schemas
│   └── server.js          # Entry point
├── frontend/
│   ├── src/
│   │   ├── api.js              # Axios base instance
│   │   ├── App.jsx             # Main app + routes
│   │   ├── index.css           # Global design tokens & styles
│   │   ├── components/         # Shared components
│   │   │   ├── ui/             # Design system primitives
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Badge.jsx
│   │   │   │   ├── Spinner.jsx
│   │   │   │   ├── Skeleton.jsx
│   │   │   │   ├── EmptyState.jsx
│   │   │   │   └── ui.css
│   │   │   ├── Navbar.jsx
│   │   │   ├── HostelCard.jsx
│   │   │   ├── DashboardCard.jsx
│   │   │   ├── ReviewSection.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── SuccessModal.jsx
│   │   │   ├── SkeletonCard.jsx
│   │   │   ├── TiltCard.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── context/            # AuthContext
│   │   ├── hooks/              # Custom React hooks
│   │   ├── layout/             # Layout components
│   │   │   ├── AuthLayout.jsx
│   │   │   ├── DashboardLayout.jsx
│   │   │   └── MainLayout.jsx
│   │   └── pages/
│   │       ├── HomePage.jsx
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── ForgotPassword.jsx
│   │       ├── ResetPassword.jsx
│   │       ├── VerifyEmail.jsx
│   │       ├── HostelDetailPage.jsx
│   │       ├── MarketplacePage.jsx
│   │       ├── superadmin/
│   │       ├── admin/          # Owner dashboard pages
│   │       │   ├── AdminDashboard.jsx
│   │       │   ├── HostelManagement.jsx
│   │       │   ├── RoomManagement.jsx
│   │       │   ├── BookingRequests.jsx
│   │       │   └── BillingManagement.jsx
│   │       ├── staff/
│   │       └── resident/
│   │           ├── ResidentDashboard.jsx
│   │           ├── BrowseHostels.jsx
│   │           ├── BookRoom.jsx
│   │           ├── MyBookings.jsx
│   │           ├── MyBills.jsx
│   │           ├── MyMaintenanceRequests.jsx
│   │           ├── NewMaintenanceRequest.jsx
│   │           ├── ApplyForOwnership.jsx
│   │           └── ApplicationStatus.jsx
│   └── package.json
├── .env.example
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- MongoDB (v5+)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd HostelManagement
```

2. **Setup Backend**
```bash
cd backend
npm install

# Create .env file from example
cp .env.example .env
# Edit .env with your configuration
```

3. **Setup Frontend**
```bash
cd frontend
npm install
```

### Environment Variables

**Backend (`backend/.env`)**
```env
MONGO_URI=mongodb://localhost:27017/hostel-management
JWT_SECRET=your-strong-secret-key-here
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
FRONTEND_URL=http://localhost:5173
PORT=5000
NODE_ENV=development
```

**Frontend (`.env` — create in `frontend/` directory)**
```env
VITE_API_URL=http://localhost:5000/api
```

### Running the Application

1. **Create Superadmin Account**
```bash
cd backend
node utils/seedSuperadmin.js
```

**Default Superadmin Credentials:**
- Email: `admin@hostelplatform.com`
- Password: `SuperAdmin@123`

2. **Start Backend**
```bash
cd backend
npm run dev
```
Server runs on `http://localhost:5000`

3. **Start Frontend**
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173`

## 📖 Usage Guide

### For Residents

1. **Register** at `/register` (email verification required)
2. **Browse Hostels** — View all available hostels on the marketplace
3. **View Details** — See hostel info, photos, reviews, and ratings
4. **Book Rooms** — Submit booking requests
5. **Track Bills & Maintenance** — View your bills, submit and track maintenance requests
6. **Apply for Ownership** — Click "Become an Owner" from dashboard

### For Owners

1. **Apply** — Submit owner application with business details
2. **Wait for Approval** — Superadmin reviews application
3. **Manage Hostels** — Create, edit, and manage hostels with images
4. **Manage Rooms** — Add and configure rooms per hostel
5. **Create Staff** — Add staff members to help manage operations
6. **Manage Bookings** — Approve/reject resident booking requests
7. **Track Billing** — Generate and manage bills for residents
8. **View Analytics** — Revenue, occupancy, and booking stats

### For Superadmin

1. **Login** with superadmin credentials
2. **Review Applications** — View pending owner applications
3. **Approve/Reject** — Approve qualified owners or reject with reason
4. **Suspend Accounts** — Suspend or reactivate owner accounts
5. **Monitor Platform** — View platform-wide statistics and analytics
6. **Audit Logs** — Track all security-critical actions

## 🔐 Security Features

- ✅ JWT-based authentication with secure token handling
- ✅ Role-based access control (RBAC) — superadmin, owner, staff, resident
- ✅ Ownership validation middleware — tenants can only access their own data
- ✅ Password hashing with bcrypt
- ✅ Email verification via OTP before account activation
- ✅ Password reset via secure email link
- ✅ Rate limiting (3 applications per 24 hours; login protection)
- ✅ Audit logging for all superadmin actions
- ✅ Activity logging per user
- ✅ XSS protection (xss-clean)
- ✅ HTTP parameter pollution prevention
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Centralized input validation (backend)
- ✅ Atomic operations for concurrency safety on bookings and counters

## 📊 API Endpoints

### Authentication
```
POST   /api/auth/register              # Register new user
POST   /api/auth/login                 # Login
GET    /api/auth/me                    # Get current user
POST   /api/auth/verify-email          # Verify email with OTP
POST   /api/auth/resend-otp            # Resend OTP
POST   /api/auth/forgot-password       # Request password reset email
POST   /api/auth/reset-password        # Reset password with token
```

### Owner Management
```
POST   /api/owner/apply                # Apply for ownership
GET    /api/owner/my-application       # Check application status
POST   /api/owner/staff                # Create staff member
GET    /api/owner/staff                # List staff
DELETE /api/owner/staff/:id            # Delete staff member
```

### Superadmin
```
GET    /api/admin/owner-requests       # List pending applications
PATCH  /api/admin/approve-owner/:id    # Approve owner
PATCH  /api/admin/reject-owner/:id     # Reject owner with reason
GET    /api/admin/all-owners           # List all owners
PATCH  /api/admin/suspend/:id          # Suspend / reactivate account
GET    /api/admin/platform-stats       # Platform statistics
GET    /api/admin/audit-logs           # View audit logs
```

### Hostels & Rooms
```
GET    /api/hostels                    # List hostels (filtered by role)
POST   /api/hostels                    # Create hostel (with image upload)
GET    /api/hostels/:id                # Get hostel details
PUT    /api/hostels/:id                # Update hostel
DELETE /api/hostels/:id                # Delete hostel
GET    /api/rooms                      # List rooms
POST   /api/rooms                      # Create room
PUT    /api/rooms/:id                  # Update room
DELETE /api/rooms/:id                  # Delete room
```

### Bookings
```
GET    /api/bookings                   # List bookings
POST   /api/bookings                   # Create booking request
PATCH  /api/bookings/:id/approve       # Approve booking
PATCH  /api/bookings/:id/reject        # Reject booking
DELETE /api/bookings/:id               # Cancel booking
```

### Billing & Maintenance
```
GET    /api/bills                      # List bills
POST   /api/bills                      # Create bill
PATCH  /api/bills/:id/pay              # Mark bill as paid
GET    /api/maintenance                # List maintenance requests
POST   /api/maintenance                # Create maintenance request
PATCH  /api/maintenance/:id/status     # Update request status
```

### Reviews
```
GET    /api/reviews/:hostelId          # Get reviews for a hostel
POST   /api/reviews/:hostelId          # Submit a review
DELETE /api/reviews/:id                # Delete a review
```

### Analytics
```
GET    /api/analytics/owner            # Owner analytics (revenue, occupancy)
GET    /api/analytics/platform         # Platform-wide analytics (superadmin)
```

### Marketplace
```
GET    /api/marketplace                # Browse all public hostel listings
GET    /api/marketplace/:id            # Get public hostel listing
```

### Other
```
POST   /api/gate-pass                  # Issue gate pass
GET    /api/gate-pass                  # List gate passes
POST   /api/phone/verify               # Phone verification
GET    /api/account/activity           # View account activity log
```

## 🏛️ Architecture Decisions

### 1. Multi-Tenant Data Isolation
- `owner` field on all tenant-scoped models (Hostel, Room, Booking, Bill, etc.)
- Middleware-enforced ownership checks on every relevant route
- Consistent security across all endpoints — easy to maintain and audit

### 2. Service Layer
- Business logic separated from controllers into `services/`
- Controllers handle HTTP concerns only; services handle domain logic
- Improves testability and reusability

### 3. Centralized Validation
- All input schemas live in `validations/`
- Both frontend (form-level) and backend (middleware-level) validation
- Covers emails, passwords, dates, booking constraints, billing values

### 4. Atomic Operations
- Counter model with atomic increments for booking/bill IDs
- Prevents race conditions in concurrent booking scenarios
- MongoDB `findOneAndUpdate` with atomic operators throughout

### 5. Audit & Activity Logging
- **AuditLog**: Immutable records of all superadmin security actions
- **ActivityLog**: Per-user activity history
- Helps with compliance, debugging, and security reviews

### 6. Frontend Design System
- Shared UI primitives (`Button`, `Input`, `Badge`, `Spinner`, `Skeleton`, `EmptyState`) in `components/ui/`
- Global design tokens in `index.css` (colors, spacing, shadows, radii)
- `AuthLayout` for authentication pages, `DashboardLayout` for app pages
- Components use design tokens — consistent, no ad-hoc styles

## 🧪 Testing

### Manual Testing Flow

1. **Register as Resident** → Verify email via OTP
2. **Apply for Ownership** → Check application status
3. **Login as Superadmin** → Approve application
4. **Login as New Owner** → Create hostel, add rooms
5. **Create Staff** → Verify staff can only see owner's data
6. **Register Another Owner** → Verify data isolation (can't see first owner's data)
7. **Register as Resident** → Browse, book, and review a hostel

### Data Isolation Test

```javascript
// Owner A creates Hostel A
// Owner B creates Hostel B

// Test: Owner A should ONLY see Hostel A
// Test: Owner B should ONLY see Hostel B
// Test: Staff of Owner A should ONLY see Hostel A
// Test: Superadmin should see ALL hostels
// Test: Resident bookings are isolated to their own user
```

## 🚀 Deployment

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use a strong, random `JWT_SECRET` (32+ characters)
- [ ] Configure production MongoDB (MongoDB Atlas recommended)
- [ ] Set up email service (SendGrid / AWS SES) and update `EMAIL_USER` / `EMAIL_PASS`
- [ ] Configure `FRONTEND_URL` and CORS for your production domain
- [ ] Set up SSL certificates
- [ ] Run seed script to create the superadmin account
- [ ] Set up process manager (PM2)
- [ ] Set up monitoring (New Relic, Datadog)
- [ ] Configure automated backups for MongoDB
- [ ] Set up centralized logging (Winston + Loggly / Papertrail)

### Deployment Commands

```bash
# Build frontend for production
cd frontend
npm run build
# Serve the `dist/` folder via Nginx or a static host (Vercel, Netlify)

# Start backend with PM2
cd backend
pm2 start server.js --name hostel-backend

# Or with Docker
docker-compose up -d
```

## 📝 License

MIT License — See LICENSE file for details.

## 👥 Contributors

- Your Name — Initial work and full-stack implementation

## 🙏 Acknowledgments

- Built with production-grade best practices
- Designed for scalability, security, and multi-tenancy
- Architecture inspired by leading SaaS platforms

---

**Version:** 2.0.0
**Status:** Production-Ready
**Last Updated:** 2026-03-03
