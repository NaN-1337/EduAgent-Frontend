# EduAgent - Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Firebase Configuration](#firebase-configuration)
5. [Data Models](#data-models)
6. [Key Features](#key-features)
7. [Component Architecture](#component-architecture)
8. [API Integration](#api-integration)
9. [Translation System](#translation-system)
10. [Data Conversion System](#data-conversion-system)
11. [Workflows](#workflows)
12. [Common Issues and Solutions](#common-issues-and-solutions)
13. [Environment Variables](#environment-variables)

---

## Project Overview

**EduAgent** is a Romanian education platform that enables teachers to create AI-generated lessons and students to access and complete them. The platform supports:

- **Teachers**: Create lessons using AI, manage students, view lesson analytics
- **Students**: Enroll with teachers using codes, view lessons, track completion
- **Individual Users**: Basic account for future features

The application is built with React + TypeScript, uses Firebase for backend services, and integrates with a custom API for AI-powered lesson generation.

---

## Technology Stack

### Frontend
- **React 18.3.1** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router DOM** - Client-side routing
- **Tailwind CSS** - Styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icons
- **Framer Motion** - Animations
- **React Hook Form** - Form management
- **Zod** - Schema validation

### PDF Viewing
- **@react-pdf-viewer/core** - PDF rendering
- **@react-pdf-viewer/page-navigation** - PDF navigation
- **pdfjs-dist** - PDF.js library for PDF processing

### Backend Services
- **Firebase Authentication** - User authentication (Email/Password, Google)
- **Firebase Firestore** - NoSQL database
- **Firebase Storage** - File storage for PDF presentations

### External API
- **Custom RAG API** (http://localhost:5000) - AI lesson generation
  - `/api/generate-questions` - Generate clarifying questions
  - `/api/generate-lecture` - Generate lecture content (HTML)
  - `/api/generate-presentation` - Generate PDF presentation

---

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── auth/              # Authentication components
│   │   │   ├── auth-form.tsx
│   │   │   └── role-selection-dialog.tsx
│   │   ├── fact-check/        # Fact-checking UI (deprecated)
│   │   ├── layout/            # Layout components
│   │   │   └── Navbar.tsx
│   │   ├── lesson-editor/     # Lesson editing components
│   │   │   ├── ExportShareModal.tsx
│   │   │   ├── SlidesTab.tsx
│   │   │   ├── StudentSummaryTab.tsx
│   │   │   └── TeacherGuidelinesTab.tsx
│   │   ├── lesson-wizard/     # Lesson creation wizard
│   │   │   ├── Step1DefineLesson.tsx
│   │   │   ├── Step2Questions.tsx
│   │   │   ├── Step2Sources.tsx (deprecated)
│   │   │   ├── Step3Generation.tsx
│   │   │   ├── Step4FactCheck.tsx (deprecated)
│   │   │   ├── Step5Review.tsx
│   │   │   ├── TemplatePreviewDialog.tsx
│   │   │   └── ProgressIndicator.tsx
│   │   ├── pdf-viewer/        # PDF viewing components
│   │   │   └── PDFSlideViewer.tsx
│   │   ├── ui/                # Reusable UI components (shadcn/ui)
│   │   └── theme-toggle.tsx
│   │   └── language-toggle.tsx
│   ├── contexts/              # React contexts
│   │   ├── AuthContext.tsx    # Authentication state
│   │   ├── LanguageContext.tsx # i18n state
│   │   └── ThemeContext.tsx   # Theme state (light/dark)
│   ├── lib/                   # Utility libraries
│   │   ├── api.ts             # API client functions
│   │   ├── dataConverters.ts  # Data format converters
│   │   ├── firebaseConfig.ts  # Firebase initialization
│   │   ├── pdfThumbnail.ts    # PDF thumbnail generation
│   │   ├── routes.ts          # Route helpers
│   │   ├── storage.ts         # Firebase Storage utilities
│   │   ├── teacherCode.ts     # Teacher code generation
│   │   ├── translations.ts    # Translation definitions
│   │   └── utils.ts           # General utilities
│   ├── pages/                 # Page components
│   │   ├── LoginPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── individual/
│   │   │   └── IndividualDashboard.tsx
│   │   ├── student/
│   │   │   ├── JoinLessonPage.tsx
│   │   │   ├── StudentDashboard.tsx
│   │   │   ├── StudentLessonPlayer.tsx
│   │   │   └── StudentLessonsPage.tsx
│   │   └── teacher/
│   │       ├── FactCheckPanel.tsx (deprecated)
│   │       ├── LessonEditor.tsx
│   │       ├── LessonViewer.tsx
│   │       ├── MyLessons.tsx
│   │       ├── NewLessonPage.tsx
│   │       ├── StudentsView.tsx
│   │       └── TeacherDashboard.tsx
│   ├── App.tsx                # Main app component with routing
│   └── main.tsx               # Entry point
├── firestore.rules            # Firestore security rules
├── storage.rules              # Firebase Storage security rules
└── cors.json                  # CORS configuration for Storage
```

---

## Firebase Configuration

### Firestore Database

#### Collections

**`users` Collection**
- Stores user account information
- Document ID: User's Firebase Auth UID
- Fields:
  - `uid` (string, required): Firebase Auth UID
  - `email` (string, required): User email
  - `name` (string, required): User's full name
  - `role` (string, required): `"student"` | `"teacher"` | `"individual"`
  - `grade` (number, conditional): Integer grade level (e.g., `5` for Grade 5) - **only for students**
  - `teachingField` (string, conditional): Storage key (e.g., `"matematica"`) - **only for teachers**
  - `teacherCode` (string, conditional): 6-character alphanumeric code - **only for teachers**
  - `enrolledStudents` (array<string>, conditional): Array of student UIDs - **only for teachers**
  - `enrolledTeachers` (array<string>, conditional): Array of teacher UIDs - **only for students**
  - `completedLessons` (array<string>, conditional): Array of lesson IDs - **only for students**
  - `photoURL` (string, optional): Profile picture URL
  - `createdAt` (timestamp, required)
  - `updatedAt` (timestamp, required)
  - `emailVerified` (boolean, optional)

**`lessons` Collection**
- Stores lesson data
- Document ID: Auto-generated
- Fields:
  - `teacherId` (string, required): Teacher's UID
  - `title` (string, required): Lesson title
  - `subject` (string, required): Storage key (e.g., `"matematica"`)
  - `grade` (number, required): Integer grade level
  - `status` (string, required): `"draft"` | `"ready"` | `"factcheckneeded"` | `"factcheckpending"`
  - `studentSummary` (string, required): HTML content for students
  - `teacherGuidelines` (object, required):
    - `content` (string): HTML content
    - `objectives` (array<string>)
    - `questions` (array<string>)
    - `differentiation` (string)
    - `assessment` (string)
  - `slides` (array<object>, required): Array of slide objects
    - `id` (string): Unique slide ID
    - `title` (string): Slide title
    - `content` (string): Slide content
    - `slideIndex` (number): 0-based index
    - `speakerNote` (string): Teacher notes for this slide
  - `presentationFileUrl` (string, optional): Firebase Storage download URL
  - `presentationFileType` (string, optional): `"pdf"` (only PDF supported)
  - `template` (string, optional): Template name used (without .pdf extension)
  - `numberOfSlides` (number, optional): Number of slides requested
  - `createdAt` (timestamp, required)
  - `updatedAt` (timestamp, required)
  - `lastModified` (timestamp, required)

#### Security Rules

See `firestore.rules` for complete rules. Key points:
- Users can read their own data and any authenticated user can read users (for teacher-student relationships)
- Students can update teacher documents to add themselves to `enrolledStudents` array
- Teachers can create/update/delete their own lessons
- All authenticated users can read lessons

### Firebase Storage

#### Structure

```
{teacherUid}/{grade}/{lessonId}/presentation.pdf
```

**Example:**
```
abc123xyz789/5/lessonId123/presentation.pdf
```

**Templates:**
```
presentation_templates/{templateName}.pdf
```

#### Security Rules

See `storage.rules` for complete rules. Key points:
- Authenticated users can read files
- Only teachers can upload files
- Teachers can only upload to their own folder structure
- Only `presentation.pdf` files can be uploaded
- Templates are read-only for authenticated users

#### CORS Configuration

CORS must be configured for PDF viewing. See `cors.json` and `STORAGE_STRUCTURE.md` for setup instructions.

---

## Data Models

### User Data (Display Format)

```typescript
interface UserData {
  uid: string;
  email: string;
  name: string;
  role: "student" | "teacher" | "individual";
  grade?: string;              // Display: "Grade 5"
  teachingField?: string;      // Display: "Matematica" (translated)
  teacherCode?: string;        // "ABC123"
  enrolledStudents?: string[]; // Array of UIDs
  enrolledTeachers?: string[]; // Array of UIDs
  completedLessons?: string[]; // Array of lesson IDs
  photoURL?: string;
  createdAt?: any;
  updatedAt?: any;
  emailVerified?: boolean;
}
```

### User Data (Storage Format)

- `grade`: Stored as **integer** (e.g., `5` instead of `"Grade 5"`)
- `teachingField`: Stored as **key** (e.g., `"matematica"` instead of `"Matematica"`)

### Lesson Data

```typescript
interface Lesson {
  id: string;                  // Firestore document ID
  teacherId: string;
  title: string;
  subject: string;             // Storage key: "matematica"
  grade: number;               // Integer: 5
  status: "draft" | "ready" | "factcheckneeded" | "factcheckpending";
  studentSummary: string;      // HTML
  teacherGuidelines: {
    content: string;           // HTML
    objectives: string[];
    questions: string[];
    differentiation: string;
    assessment: string;
  };
  slides: Array<{
    id: string;
    title: string;
    content: string;
    slideIndex: number;
    speakerNote: string;
  }>;
  presentationFileUrl?: string;
  presentationFileType?: "pdf";
  template?: string;
  numberOfSlides?: number;
  createdAt: any;
  updatedAt: any;
  lastModified: any;
}
```

---

## Key Features

### Teacher Features

1. **Lesson Creation Wizard** (5 steps):
   - **Step 1**: Define lesson (title, grade, subject, number of slides, template selection)
   - **Step 2**: Answer clarifying questions from AI
   - **Step 3**: AI generation (lecture + presentation)
   - **Step 5**: Review and edit lesson (integrated editor)

2. **Lesson Management**:
   - View all lessons in dashboard
   - Edit lessons (student summary, teacher guidelines)
   - View lessons with PDF viewer
   - Delete lessons with confirmation
   - Mark lessons as "ready" (sent to students)

3. **Student Management**:
   - View enrolled students
   - Share teacher code for enrollment

4. **Template Selection**:
   - Choose from PDF templates in Storage
   - Preview templates in popup
   - Thumbnail display of first slide

### Student Features

1. **Enrollment**:
   - Enter teacher code to enroll
   - View enrolled teachers and their subjects

2. **Lesson Access**:
   - View lessons from enrolled teachers
   - Filter by grade
   - Track completion status

3. **Lesson Player**:
   - View lesson with PDF slides
   - Dynamic sidebar with slide-specific notes
   - Font size controls
   - Theme toggle

### Common Features

- **Authentication**: Email/Password and Google Sign-In
- **Internationalization**: Romanian (primary) and English
- **Theme**: Light/Dark mode
- **Responsive Design**: Mobile and desktop support

---

## Component Architecture

### Context Providers

**AuthContext** (`contexts/AuthContext.tsx`)
- Manages authentication state
- Fetches user data from Firestore
- Converts data from storage format to display format
- Provides `user`, `userData`, `loading`, `refreshUserData`

**LanguageContext** (`contexts/LanguageContext.tsx`)
- Manages current language (ro/en)
- Provides `t` object for translations
- Provides `language` and `setLanguage`

**ThemeContext** (`contexts/ThemeContext.tsx`)
- Manages theme (light/dark/system)
- Provides `theme`, `setTheme`, `actualTheme`

### Key Components

**PDFSlideViewer** (`components/pdf-viewer/PDFSlideViewer.tsx`)
- Renders PDF files with navigation
- Props: `fileUrl`, `currentPage?`, `onPageChange?`, `showNavigation?`
- Uses `@react-pdf-viewer/core` and `pageNavigationPlugin`

**Step5Review** (`components/lesson-wizard/Step5Review.tsx`)
- Final step of lesson creation wizard
- Integrated lesson editor/viewer
- PDF viewer with dynamic sidebar
- Tabs: Student Summary, Slides, Teacher Guidelines
- Save draft and mark as ready functionality

**LessonEditor** (`pages/teacher/LessonEditor.tsx`)
- Edit lesson content
- Rich text editor for student summary and teacher guidelines
- PDF viewer with slide-specific sidebar
- Unsaved changes detection with discard dialog

**StudentLessonPlayer** (`pages/student/StudentLessonPlayer.tsx`)
- Student view of lessons
- PDF viewer with dynamic sidebar
- Marks lesson as completed on view
- Teacher information display

---

## API Integration

### API Base URL

Configured via `VITE_API_BASE_URL` environment variable (default: `http://localhost:5000`)

### Endpoints

**1. Generate Questions** (`/api/generate-questions`)
- **Method**: POST
- **Request**:
  ```typescript
  {
    title: string;
    subject: string;  // Display format (e.g., "Matematica")
    grade: number;    // Integer (e.g., 5)
  }
  ```
- **Response**:
  ```typescript
  {
    success: boolean;
    data: {
      questions: Array<{
        id: number;
        question: string;
        type: "single-choice" | "yes-no";
        options: string[];
      }>;
    };
  }
  ```

**2. Generate Lecture** (`/api/generate-lecture`)
- **Method**: POST
- **Request**:
  ```typescript
  {
    title: string;
    subject: string;  // Storage key (e.g., "matematica")
    grade: number;
    questions: Question[];
    answers: Record<string, string>;  // question ID -> selected answer
  }
  ```
- **Response**:
  ```typescript
  {
    success: boolean;
    data: {
      student_version: string;  // HTML
      teacher_version: string;  // HTML
    };
  }
  ```

**3. Generate Presentation** (`/api/generate-presentation`)
- **Method**: POST
- **Request**:
  ```typescript
  {
    student_version: string;  // HTML from lecture API
    n_slides?: number;
    language?: string;        // "Romanian"
    template?: string;        // Template name without .pdf (e.g., "modern")
    tone?: string;            // "educational"
    verbosity?: string;       // "standard"
    export_as?: "pdf";
  }
  ```
- **Response**:
  ```typescript
  {
    success: boolean;
    data: {
      presentation: {
        id: string;
        download_url: string;
        edit_url: string;
        credits_consumed: number;
        n_slides: number;
        language: string;
        title: string;
      };
      slides: Array<{
        slide_index: number;
        layout: string;
        html_content: string;
        speaker_note: string;
        content: {
          title?: string;
          subtitle?: string;
          body?: string;
          bullets?: string[];
        };
      }>;
    };
  }
  ```

### Workflow

1. User answers questions in Step 2
2. Step 3 calls `generateLecture` with questions and answers
3. Step 3 calls `generatePresentation` with `student_version` from lecture
4. Step 3 downloads PDF from `download_url`
5. Step 3 uploads PDF to Firebase Storage
6. Step 3 creates lesson document in Firestore with all data

---

## Translation System

### Structure

Translations are defined in `lib/translations.ts` with the following structure:

```typescript
export type Language = "ro" | "en";

export interface Translations {
  common: { ... };
  navbar: { ... };
  auth: { ... };
  teacher: { ... };
  student: { ... };
  individual: { ... };
  // ... more sections
}

export const translations: Record<Language, Translations> = {
  ro: { ... },
  en: { ... },
};
```

### Usage

```typescript
import { useLanguage } from "@/contexts/LanguageContext";

function MyComponent() {
  const { t, language } = useLanguage();
  
  return <h1>{t.common.welcome}</h1>;
}
```

### Key Translation Keys

- `common.status.ready` → "Gata" (ro) / "Ready" (en)
- `common.status.sentToStudents` → "Trimisă la elevi" (ro) / "Sent to students" (en)
- `teacher.newLesson.step1.*` → Step 1 translations
- `teacher.lessonEditor.*` → Lesson editor translations
- `student.lessonPlayer.*` → Student lesson player translations

### Grade Display

Grades are displayed using translation keys:
- `translations[language].grades["Grade 5"]` → "Clasa a V-a" (ro) / "Grade 5" (en)

### Teaching Field Display

Teaching fields are displayed using translation keys:
- `translations[language].teachingFields["Mathematics"]` → "Matematica" (ro) / "Mathematics" (en)

---

## Data Conversion System

### Purpose

The system stores data in a normalized format in Firestore but displays it in a user-friendly format in the UI.

### Functions (`lib/dataConverters.ts`)

**Grade Conversion:**
- `gradeToStorage(gradeDisplay: string): number | null`
  - Converts `"Grade 5"` → `5`
- `gradeFromStorage(gradeStorage: number | string | null | undefined): string | null`
  - Converts `5` → `"Grade 5"`

**Teaching Field Conversion:**
- `teachingFieldToStorage(teachingFieldDisplay: string): string | null`
  - Converts `"Mathematics"` → `"matematica"`
- `teachingFieldFromStorage(teachingFieldStorage: string | null | undefined): string | null`
  - Converts `"matematica"` → `"Mathematics"` (English key for translations)

**Valid Teaching Field Keys (Storage Format):**
- `biologie`, `chimie`, `comunicare_in_limba_romana`, `fizica`, `geografie`, `informatica`, `informatica_si_tic`, `istoria_comunismului_din_romania`, `istorie`, `limba_si_literatura_romana`, `matematica`, `matematica_si_explorarea_mediului`, `stiinte`, `stiinte_ale_naturii`

**Lesson Conversion:**
- `convertLessonFromStorage(lessonData: any, translations: {...}): any`
  - Converts lesson data from storage format to display format

### Usage

**When Writing to Firestore:**
```typescript
import { gradeToStorage, teachingFieldToStorage } from "@/lib/dataConverters";

const userData = {
  grade: gradeToStorage("Grade 5"),           // → 5
  teachingField: teachingFieldToStorage("Mathematics"), // → "matematica"
};
```

**When Reading from Firestore:**
- `AuthContext` automatically converts user data
- Components use display format directly

---

## Workflows

### Teacher Creates Lesson

1. Navigate to `/teacher/new-lesson`
2. **Step 1**: Fill in title, select grade, subject (auto-filled from teacher's field), number of slides, template
3. **Step 2**: Answer clarifying questions from AI
4. **Step 3**: AI generates lecture and presentation
   - Calls `generateLecture` API
   - Calls `generatePresentation` API
   - Downloads PDF from API
   - Uploads PDF to Firebase Storage
   - Creates lesson document in Firestore
5. **Step 5**: Review and edit lesson
   - View PDF with slides
   - Edit student summary and teacher guidelines
   - Save draft or mark as ready

### Student Enrolls with Teacher

1. Navigate to `/student/join-lesson`
2. Enter teacher code (6 characters)
3. System finds teacher by code
4. Updates teacher's `enrolledStudents` array
5. Updates student's `enrolledTeachers` array

### Student Views Lesson

1. Navigate to `/student/lessons` or dashboard
2. Click on a lesson
3. Lesson player opens with PDF viewer
4. System marks lesson as completed in student's `completedLessons` array
5. Sidebar shows slide-specific teacher notes

### Teacher Edits Lesson

1. Navigate to `/teacher/lessons/:lessonId/edit`
2. Edit student summary or teacher guidelines using rich text editor
3. Save changes (updates Firestore)
4. If navigating away with unsaved changes, discard dialog appears

---

## Common Issues and Solutions

### 1. Firebase Permission Errors

**Error**: `FirebaseError: Missing or insufficient permissions`

**Solution**: 
- Check `firestore.rules` and `storage.rules`
- Ensure rules are deployed: `firebase deploy --only firestore:rules,storage:rules`
- Verify user is authenticated
- Check that user has correct role

### 2. PDF Not Loading (CORS Error)

**Error**: `403 (Forbidden)` or CORS errors

**Solution**:
- Configure CORS for Firebase Storage:
  ```bash
  gsutil cors set cors.json gs://innovate4ai.firebasestorage.app
  ```
- Verify `cors.json` exists in project root
- Check Storage security rules allow read access

### 3. Translation Errors

**Error**: `TypeError: t is not a function`

**Solution**:
- Ensure component uses `useLanguage()` hook
- Use object access: `t.common.loading` (not `t("common.loading")`)
- Check translation key exists in `translations.ts`

### 4. Data Format Mismatch

**Error**: Grade or teaching field not displaying correctly

**Solution**:
- Use `gradeToStorage()` and `teachingFieldToStorage()` when writing to Firestore
- Use `gradeFromStorage()` and `teachingFieldFromStorage()` when reading (handled by `AuthContext`)
- Check `dataConverters.ts` for correct mappings

### 5. Duplicate Lesson Creation

**Error**: Lessons created multiple times

**Solution**:
- Check `NewLessonPage.tsx` for `isCreatingLesson` guard
- Check `Step3Generation.tsx` for `hasCompleted` guard
- Ensure React StrictMode doesn't cause double renders in production

### 6. PDF Navigation Not Working

**Error**: Next/Previous buttons not working in template preview

**Solution**:
- Ensure `PDFSlideViewer` has `showNavigation={false}` in `TemplatePreviewDialog`
- Check that `currentPage` and `onPageChange` props are not interfering
- Verify `pageNavigationPlugin` is correctly initialized

### 7. Firestore Index Required

**Error**: `FirebaseError: The query requires an index`

**Solution**:
- Click the link in the error message to create the index
- Or manually create composite index in Firebase Console
- The app has fallback logic to query without `orderBy` if index is missing

---

## Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=innovate4ai
VITE_FIREBASE_STORAGE_BUCKET=innovate4ai.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# API Configuration
VITE_API_BASE_URL=http://localhost:5000
```

---

## Important Notes

1. **PDF Only**: The system only supports PDF files. PPT/PPTX support was removed.

2. **Step 4 Removed**: Fact-checking step (Step 4) was removed from the lesson creation wizard.

3. **Template Selection**: Templates are stored in `presentation_templates/` in Firebase Storage. Template names are translated and displayed with thumbnails.

4. **Rich Text Editor**: Uses `document.execCommand` for basic formatting. Teachers can edit student summary and teacher guidelines with text formatting (bold, italic, etc.).

5. **Theme Toggle**: Switches directly between light and dark (no system preference).

6. **Language Toggle**: Switches between Romanian (primary) and English.

7. **Status Values**: 
   - `"draft"` - Lesson is being created/edited
   - `"ready"` - Lesson is complete and sent to students (displays as "Trimisă la elevi" / "Sent to students")

8. **Teacher Code**: 6-character alphanumeric code (uppercase letters and numbers) generated automatically for each teacher.

9. **Completion Tracking**: Students' `completedLessons` array is updated when they view a lesson in the player.

10. **Unsaved Changes**: Lesson editor detects unsaved changes and prompts user before navigation.

---

## File References

- **Firestore Rules**: `firestore.rules`
- **Storage Rules**: `storage.rules`
- **CORS Config**: `cors.json`
- **Translations**: `frontend/src/lib/translations.ts`
- **Data Converters**: `frontend/src/lib/dataConverters.ts`
- **API Client**: `frontend/src/lib/api.ts`
- **Firebase Config**: `frontend/src/lib/firebaseConfig.ts`
- **Storage Utils**: `frontend/src/lib/storage.ts`

---

## Future Considerations

1. **Fact-Checking**: Currently removed but components exist. May be re-enabled in future.

2. **Individual Users**: Dashboard exists but functionality is minimal. May be expanded.

3. **Analytics**: Teacher dashboard shows basic lesson info. More analytics may be added.

4. **Export/Share**: `ExportShareModal` exists but functionality may need expansion.

5. **Rich Text Editor**: Current implementation is basic. May need upgrade to a more robust solution.

---

*Last Updated: Based on conversation history up to template preview navigation fix*

