# Firebase Storage Structure

This document describes the Firebase Storage folder structure for lesson presentation files.

## Prerequisites

Before using Storage, make sure you have:
1. ✅ Enabled Firebase Storage in Firebase Console
2. ✅ Set up Storage security rules (see `storage.rules` file)
3. ✅ **Configured CORS for Storage** (REQUIRED for PDF viewing - see below)
4. ✅ Added `VITE_FIREBASE_STORAGE_BUCKET` to your `.env` file

### Configuring CORS

The PDF viewer requires CORS headers to fetch files from Firebase Storage. To configure CORS:

1. **Install Google Cloud SDK** (if not already installed):
   - Download from: https://cloud.google.com/sdk/docs/install
   - Follow the installation instructions for your operating system

2. **Authenticate and set your project**:
   ```bash
   gcloud auth login
   gcloud config set project innovate4ai
   ```

3. **Apply CORS configuration**:
   ```bash
   gsutil cors set cors.json gs://innovate4ai.firebasestorage.app
   ```

4. **Verify CORS is configured**:
   ```bash
   gsutil cors get gs://innovate4ai.firebasestorage.app
   ```

   You should see output similar to:
   ```json
   [{"origin": ["*"], "method": ["GET", "HEAD"], "responseHeader": ["Content-Type", "Content-Length", "Content-Range"], "maxAgeSeconds": 3600}]
   ```

**Important**: The `cors.json` file is in your project root. It allows GET and HEAD requests from any origin, which is necessary for the PDF viewer to work. For production, you may want to restrict the `origin` array to your specific domain(s).

## Folder Structure

Presentation files (PDF/PPT) are stored in the following structure:

```
{teacherUid}/{grade}/{lessonId}/presentation.{ext}
```

### Example:
```
abc123xyz789/5/lessonId123/presentation.pdf
abc123xyz789/5/lessonId123/presentation.pptx
```

Where:
- `{teacherUid}` - The Firebase Auth UID of the teacher who created the lesson
- `{grade}` - The grade level as an integer (e.g., `5` for Grade 5, `6` for Grade 6)
- `{lessonId}` - The Firestore document ID of the lesson
- `presentation.{ext}` - The file name (always `presentation.pdf`, `presentation.pptx`, or `presentation.ppt`)

## Manual Upload Instructions

If you want to manually upload a file to test, follow these steps:

1. Go to Firebase Console → Storage
2. Navigate to or create the folder structure: `{teacherUid}/{grade}/`
3. Create a subfolder with a lesson ID (you can use an existing lesson ID from Firestore)
4. Upload your PDF or PPT file and name it exactly:
   - `presentation.pdf` for PDF files
   - `presentation.pptx` or `presentation.ppt` for PowerPoint files

### Example Manual Upload Path:
```
your-teacher-uid/5/your-lesson-id/presentation.pdf
```

5. After uploading, copy the download URL from Storage
6. Update the lesson document in Firestore:
   - Go to `lessons` collection
   - Find the lesson document
   - Add/update:
     - `presentationFileUrl`: Paste the download URL
     - `presentationFileType`: `"pdf"` or `"ppt"`

## Code Usage

The code automatically:
1. Creates the lesson document in Firestore first (to get the `lessonId`)
2. Uploads the file to: `{teacherUid}/{grade}/{lessonId}/presentation.{ext}`
3. Updates the lesson document with the `presentationFileUrl` and `presentationFileType`

## File Naming Convention

- Always use `presentation.pdf`, `presentation.pptx`, or `presentation.ppt` as the filename
- The file extension determines the type (`.pdf`, `.ppt`, or `.pptx`)
- The code automatically detects the file type based on the extension
- **Important**: The filename must match exactly (case-sensitive) for security rules to work

## Accessing Files

Files are accessed via their download URL, which is stored in the Firestore lesson document as `presentationFileUrl`. The code retrieves this URL and uses it to display the file in the PDF/PPT viewer.

## Security Rules

The Storage security rules ensure:
- Only authenticated users can read files
- Only teachers can upload files
- Teachers can only upload to their own folder (`{teacherUid}`)
- Only files named `presentation.pdf`, `presentation.pptx`, or `presentation.ppt` can be uploaded
- Teachers can delete their own files

See `storage.rules` file for the complete rules.

