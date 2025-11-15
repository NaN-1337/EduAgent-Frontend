import { storage } from "./firebaseConfig";
import { ref, uploadBytes, getDownloadURL, UploadResult, listAll } from "firebase/storage";

/**
 * MOCK: Use the same presentation file for all lessons
 * 
 * Option 1 (RECOMMENDED): Set the full download URL directly
 * To get the download URL:
 * 1. Go to Firebase Console → Storage
 * 2. Navigate to: 1jTUyxRHWcN0OH9ybEuwI1K0dSD2/6/
 * 3. Click on the PDF file
 * 4. Copy the COMPLETE download URL (must include ?alt=media&token=...)
 * 5. Paste it below
 * 
 * Option 2: Leave empty and the code will try to find the file automatically
 */
export const MOCK_PRESENTATION_FILE_URL = "https://firebasestorage.googleapis.com/v0/b/innovate4ai.firebasestorage.app/o/1jTUyxRHWcN0OH9ybEuwI1K0dSD2%2F6%2FUnique%20Agentic%20AI%20Project%20Idea_%20_EduAgent_%20%E2%80%93%20The%20Autonomous%20Lesson%20Builder.pdf?alt=media&token=b8c969e1-820f-40fc-8a96-33ae76fdf5f8"; // Set the complete download URL here (with token)
export const MOCK_PRESENTATION_FILE_TYPE: "pdf" = "pdf";

/**
 * Get the mock presentation file URL by searching in the storage folder
 * This will find any PDF file in the specified folder and return its download URL
 */
export async function getMockPresentationFileURL(): Promise<string | null> {
  try {
    // Search in the folder: 1jTUyxRHWcN0OH9ybEuwI1K0dSD2/6/
    const folderRef = ref(storage, "1jTUyxRHWcN0OH9ybEuwI1K0dSD2/6");
    const listResult = await listAll(folderRef);
    
    // Find the first PDF file
    const pdfFile = listResult.items.find(item => 
      item.name.toLowerCase().endsWith('.pdf')
    );
    
    if (pdfFile) {
      const downloadURL = await getDownloadURL(pdfFile);
      return downloadURL;
    }
    
    return null;
  } catch (error) {
    console.error("Error finding mock presentation file:", error);
    return null;
  }
}

/**
 * Get download URL from a gs:// storage path using Firebase SDK
 * This ensures we get a valid URL with the proper token
 * @param gsPath - The gs:// path (e.g., "gs://bucket/path/to/file")
 * @returns Promise with the download URL
 */
export async function getDownloadURLFromGSPath(gsPath: string): Promise<string> {
  // Remove gs:// prefix
  const pathWithoutPrefix = gsPath.replace(/^gs:\/\//, "");
  
  // Split bucket and file path (bucket is not needed, we just need the file path)
  const [, ...pathParts] = pathWithoutPrefix.split("/");
  const filePath = pathParts.join("/");
  
  if (!filePath) {
    throw new Error("File path is empty. The gs:// path must include the filename.");
  }
  
  // Use Firebase SDK to get the download URL (this includes the token)
  const storageRef = ref(storage, filePath);
  const downloadURL = await getDownloadURL(storageRef);
  return downloadURL;
}

/**
 * Upload a file to Firebase Storage
 * @param file - The file to upload
 * @param path - The storage path (e.g., "lessons/lessonId/presentation.pdf")
 * @returns Promise with the download URL
 */
export async function uploadFile(
  file: File,
  path: string
): Promise<string> {
  try {
    const storageRef = ref(storage, path);
    const snapshot: UploadResult = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || "";
}

/**
 * Check if file is PDF
 */
export function isPDF(filename: string): boolean {
  return getFileExtension(filename) === "pdf";
}


