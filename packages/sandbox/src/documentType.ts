export type DocumentType =
  | "article"
  | "email_thread_collection"
  | "meeting_transcript";

// Routing is driven by a filename convention rather than content sniffing:
//   foo.md           -> article
//   foo.email.md     -> email_thread_collection
//   foo.transcript.md -> meeting_transcript
// The "type suffix" is the second-to-last segment when split on ".".
export function detectDocumentTypeFromFilename(filename: string): DocumentType {
  const parts = filename.split(".");
  if (parts.length < 2) return "article";

  const typeSuffix = parts[parts.length - 2];
  switch (typeSuffix) {
    case "email":
      return "email_thread_collection";
    case "transcript":
      return "meeting_transcript";
    default:
      return "article";
  }
}
