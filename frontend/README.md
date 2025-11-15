# Innovate4AI Frontend

A modern web application built with Vite, React, Firebase, and shadcn/ui components.

## Features

- 🔐 **Authentication**: Email/password and Google Sign-In
- 👥 **Role-based Registration**: Support for Student, Teacher, and Individual roles
- 📱 **Modern UI**: Built with shadcn/ui and Tailwind CSS
- 🔥 **Firebase Integration**: Firestore database with Firebase Authentication
- 👤 **User Profiles**: View and edit user profile information

## Tech Stack

- **Build Tool**: Vite (fast development server)
- **Framework**: React 18
- **Routing**: React Router v6
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Authentication**: Firebase Auth
- **Database**: Cloud Firestore
- **Form Handling**: React Hook Form + Zod

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A Firebase project (see Firebase Setup below)

### Installation

1. Install dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

2. Set up environment variables:

Copy `.env.example` to `.env` and fill in your Firebase configuration:

```bash
cp .env.example .env
```

**Note**: In Vite, environment variables must be prefixed with `VITE_` to be accessible in the browser.

3. Run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Firebase Setup

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** > **Get started**
2. Enable **Email/Password** sign-in method:
   - Click on "Email/Password"
   - Toggle "Enable"
   - Click "Save"
3. Enable **Google** sign-in method:
   - Click on "Google"
   - Toggle "Enable"
   - Enter your project support email
   - Click "Save"

### Step 3: Create Firestore Database

1. Go to **Firestore Database** > **Create database**
2. Choose **Start in test mode** (for development)
3. Select a location for your database
4. Click "Enable"

### Step 4: Set Firestore Security Rules

Update your Firestore security rules to allow authenticated users to read/write their own data:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own user document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Step 5: Get Firebase Configuration

1. Go to **Project Settings** (gear icon) > **General**
2. Scroll down to "Your apps" section
3. Click the web icon (`</>`) to add a web app
4. Register your app (you can skip hosting setup for now)
5. Copy the Firebase configuration object
6. Add these values to your `.env.local` file:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Step 6: Configure Authorized Domains (for Google Sign-In)

1. Go to **Authentication** > **Settings** > **Authorized domains**
2. Add `localhost` if not already present (for development)
3. Add your production domain when deploying

## Project Structure

```
frontend/
├── src/
│   ├── pages/             # React Router pages
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   └── ProfilePage.tsx
│   ├── components/
│   │   ├── auth/          # Authentication components
│   │   │   ├── auth-form.tsx
│   │   │   └── role-selection-dialog.tsx
│   │   └── ui/            # shadcn/ui components
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── lib/
│   │   ├── firebaseConfig.ts
│   │   └── utils.ts
│   ├── App.tsx            # Main app component with routes
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── index.html             # HTML entry point
├── vite.config.ts         # Vite configuration
└── package.json
```

## User Data Structure

Users are stored in Firestore with the following structure:

- **Document ID**: Firebase Auth UID (same as `uid` field)
- **Document Fields**:
  - `uid` (string): Firebase Auth UID (also used as document ID)
  - `email` (string): User's email address
  - `name` (string): User's full name
  - `role` (string): One of "student", "teacher", or "individual"
  - `createdAt` (timestamp): Account creation timestamp

## Features in Detail

### Authentication

- **Email/Password**: Traditional email and password authentication
- **Google Sign-In**: One-click Google authentication
- **Role Selection**: New Google users are prompted to select their role

### Registration

- **Role-based**: Users must select a role (Student, Teacher, or Individual) during registration
- **Validation**: Form validation using Zod schemas
- **Password Confirmation**: Password matching validation

### Profile Page

- **View Profile**: Display user information including name, email, UID, and role
- **Edit Profile**: Update user name (other fields are protected)
- **Sign Out**: Logout functionality

## Building for Production

```bash
npm run build
npm run preview  # Preview the production build locally
```

The built files will be in the `dist/` directory.

## Environment Variables

All Firebase configuration should be stored in `.env` (not committed to git). See `.env.example` for the required variables.

**Important**: In Vite, environment variables must be prefixed with `VITE_` to be accessible in the browser. Use `import.meta.env.VITE_*` to access them.

## License

MIT

