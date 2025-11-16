/**
 * Utility functions for generating PDF thumbnails
 * Uses pdfjs-dist to render the first page of a PDF as an image
 */

// Dynamically import pdfjs-dist to avoid SSR issues
let pdfjsLib: any = null;

async function getPdfjsLib() {
  if (!pdfjsLib) {
    pdfjsLib = await import("pdfjs-dist");
    // Set worker source - use the version from the imported library
    const version = pdfjsLib.version || "3.11.174";
    if (pdfjsLib.GlobalWorkerOptions) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/build/pdf.worker.min.js`;
    }
  }
  return pdfjsLib;
}

/**
 * Generate a thumbnail image URL from the first page of a PDF
 * @param pdfUrl - URL of the PDF file
 * @param width - Width of the thumbnail (default: 200)
 * @returns Promise with data URL of the thumbnail image
 */
export async function generatePdfThumbnail(
  pdfUrl: string,
  width: number = 200
): Promise<string | null> {
  try {
    const pdfjs = await getPdfjsLib();
    
    // Load the PDF document
    // pdfjs-dist exports getDocument as a named export
    const getDocument = pdfjs.getDocument || (pdfjs as any).default?.getDocument;
    if (!getDocument) {
      console.error("Could not find getDocument in pdfjs-dist");
      return null;
    }
    
    const loadingTask = getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    
    // Get the first page
    const page = await pdf.getPage(1);
    
    // Calculate scale to fit width
    const viewport = page.getViewport({ scale: 1.0 });
    const scale = width / viewport.width;
    const scaledViewport = page.getViewport({ scale });
    
    // Create a canvas to render the page
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    
    if (!context) {
      console.error("Could not get canvas context");
      return null;
    }
    
    canvas.height = scaledViewport.height;
    canvas.width = scaledViewport.width;
    
    // Render the page to the canvas
    const renderContext = {
      canvasContext: context,
      viewport: scaledViewport,
    };
    
    await page.render(renderContext).promise;
    
    // Convert canvas to data URL
    return canvas.toDataURL("image/png");
  } catch (error) {
    console.error("Error generating PDF thumbnail:", error);
    return null;
  }
}

