# Firebase Setup Guide

> **Note**: For detailed information about the Firestore database structure, see [FIREBASE_STRUCTURE.md](./FIREBASE_STRUCTURE.md)

This guide will walk you through setting up Firebase for the Innovate4AI frontend application.

## Prerequisites

- A Google account
- Access to [Firebase Console](https://console.firebase.google.com/)

## Step-by-Step Setup

### 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Add project"** or select an existing project
3. Enter a project name (e.g., "innovate4ai")
4. (Optional) Enable Google Analytics
5. Click **"Create project"**
6. Wait for the project to be created, then click **"Continue"**

### 2. Enable Authentication

1. In the Firebase Console, click on **"Authentication"** in the left sidebar
2. Click **"Get started"** if you see it
3. Go to the **"Sign-in method"** tab

#### Enable Email/Password Authentication

1. Click on **"Email/Password"**
2. Toggle **"Enable"** to ON
3. Click **"Save"**

#### Enable Google Authentication

1. Click on **"Google"**
2. Toggle **"Enable"** to ON
3. Select a **Project support email** (usually your email)
4. Click **"Save"**

### 3. Create Firestore Database

1. Click on **"Firestore Database"** in the left sidebar
2. Click **"Create database"**
3. Select **"Start in test mode"** (for development)
   - ⚠️ **Important**: For production, you'll need to set up proper security rules
4. Choose a **location** for your database (select the closest region)
5. Click **"Enable"**

### 4. Set Up Firestore Security Rules

1. In Firestore Database, go to the **"Rules"** tab
2. Replace the default rules with the rules from `firestore.rules` file in the project root, or copy the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user is a teacher
    function isTeacher() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'teacher';
    }
    
    // Helper function to check if user is a student
    function isStudent() {
      return isAuthenticated() && 
             exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'student';
    }
    
    // Users collection
    match /users/{userId} {
      // Allow users to read their own data or any authenticated user to read (for teacher-student relationships)
      allow read: if isAuthenticated();
      
      // Allow users to create/update their own data
      allow create: if isAuthenticated() && 
                       request.auth.uid == userId &&
                       request.resource.data.uid == userId;
      
      // Allow users to update their own data
      // OR allow students to update teacher documents to enroll themselves
      allow update: if isAuthenticated() && (
                       // User updating their own document
                       request.auth.uid == userId ||
                       // Student enrolling with a teacher (only modifying enrolledStudents field)
                       (isStudent() && 
                        resource.data.role == 'teacher' &&
                        // Only allow changes to enrolledStudents field
                        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['enrolledStudents']) &&
                        // Ensure the new array contains all old values (no removals)
                        (resource.data.enrolledStudents == null || 
                         request.resource.data.enrolledStudents.hasAll(resource.data.enrolledStudents)) &&
                        // Ensure the student's UID is being added
                        request.resource.data.enrolledStudents.hasAny([request.auth.uid]))
                     );
      
      allow delete: if isAuthenticated() && 
                       request.auth.uid == userId;
    }
    
    // Lessons collection
    match /lessons/{lessonId} {
      // Allow read if user is authenticated
      allow read: if isAuthenticated();
      
      // Allow create if user is a teacher and sets themselves as the teacherId
      allow create: if isTeacher() && 
                       request.resource.data.teacherId == request.auth.uid;
      
      // Allow update/delete if user is the teacher who owns the lesson
      allow update: if isAuthenticated() && 
                       resource.data.teacherId == request.auth.uid;
      
      allow delete: if isAuthenticated() && 
                       resource.data.teacherId == request.auth.uid;
    }
  }
}
```

3. Click **"Publish"**

**Note**: If you're using Firebase CLI, you can also deploy the rules from the `firestore.rules` file:
```bash
firebase deploy --only firestore:rules
```

### 5. Get Firebase Configuration

1. Click on the **gear icon** (⚙️) next to "Project Overview" in the left sidebar
2. Select **"Project settings"**
3. Scroll down to the **"Your apps"** section
4. Click the **web icon** (`</>`) to add a web app
5. Register your app:
   - Enter an app nickname (e.g., "Innovate4AI Web")
   - (Optional) Check "Also set up Firebase Hosting"
   - Click **"Register app"**
6. Copy the Firebase configuration object that appears

### 6. Configure Environment Variables

1. In your project root (`frontend/` directory), create a file named `.env`
2. Add the following variables with your Firebase config values:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

**Note**: In Vite, environment variables must be prefixed with `VITE_` to be accessible in the browser.

**Example:**
```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBOYfEHuMuqIyXORb858W_Zodxyduyojek
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=innovate4ai-12345.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=innovate4ai-12345
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=innovate4ai-12345.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### 7. Configure Authorized Domains (for Google Sign-In)

1. Go to **Authentication** > **Settings** > **Authorized domains**
2. Make sure `localhost` is listed (it should be by default)
3. When deploying to production, add your production domain here

## Verification

After completing the setup:

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:3000/login`

3. Try creating an account with email/password

4. Check Firestore Database to verify a user document was created:
   - Go to **Firestore Database** > **Data**
   - You should see a `users` collection
   - Click on it to see user documents with UID as document ID

## Data Structure

Users are stored in Firestore with this structure:

**Collection**: `users`
**Document ID**: Firebase Auth UID
**Document Fields**:
```json
{
  "uid": "firebase_auth_uid",
  "email": "user@example.com",
  "name": "User Name",
  "role": "student" | "teacher" | "individual",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## Troubleshooting

### "Firebase: Error (auth/unauthorized-domain)"
- Make sure `localhost` is in your authorized domains
- Go to Authentication > Settings > Authorized domains

### "Firebase: Error (auth/popup-blocked)"
- Make sure popups are not blocked in your browser
- Try using a different browser

### "Permission denied" or "Missing or insufficient permissions" when accessing Firestore
- Check your Firestore security rules in the Firebase Console (Rules tab)
- Make sure the rules are published (click "Publish" after editing)
- Verify the user is authenticated (`request.auth != null`)
- For lessons queries, ensure the rules allow reading lessons for authenticated users
- Check that the `teacherId` field matches the authenticated user's UID when creating/updating lessons
- If using queries with `where` clauses, ensure the security rules allow the query pattern
- Make sure you've updated the rules from the default "test mode" rules to the proper rules shown in step 4

### Environment variables not working
- Make sure the file is named `.env` (in the `frontend/` directory)
- Restart your development server after adding environment variables
- Variables must start with `VITE_` to be accessible in the browser
- Access variables using `import.meta.env.VITE_*` in your code

## Production Considerations

Before deploying to production:

1. **Update Firestore Security Rules**: Replace test mode rules with proper security rules
2. **Add Production Domain**: Add your production domain to authorized domains
3. **Enable App Check**: Consider enabling Firebase App Check for additional security
4. **Set Up Monitoring**: Enable Firebase Performance Monitoring and Crashlytics
5. **Review Quotas**: Check Firebase pricing and quotas for your expected usage

## Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication Guide](https://firebase.google.com/docs/auth)
- [Cloud Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

