import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export async function readFileContent(
  file: File,
  setFileContent: (content: string | null) => void
) {
  try {
    const content = await file.text();
    setFileContent(content);
  } catch (error) {
    console.error("Error reading file:", error);
    setFileContent(null);
  }
}

export function formatFileSize(size: number) {
  if (size < 1024) {
    return size + " bytes";
  } else if (size >= 1024 && size < 1048576) {
    return (size / 1024).toFixed(1) + " KB";
  } else if (size >= 1048576 && size < 1073741824) {
    return (size / 1048576).toFixed(1) + " MB";
  } else {
    return (size / 1073741824).toFixed(1) + " GB";
  }
}

export function slugify(str: string) {
  return str
    .toLowerCase() // Convert the string to lowercase
    .replace(/[^\w\s-]/g, "") // Remove all non-word characters (except hyphens and underscores)
    .replace(/\s+/g, "-") // Replace all spaces with hyphens
    .replace(/--+/g, "-") // Replace multiple consecutive hyphens with a single hyphen
    .trim(); // Trim leading and trailing spaces (if any)
}
