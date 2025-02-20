export type FileFormat = "txt" | "md" | "json" | "xml";

export interface Prompt {
  name: string;
  content: string;
  format: FileFormat;
}

export function getFileExtension(filename: string): FileFormat | null {
  const match = filename.match(/\.([^.]+)$/);
  if (!match) return null;
  const ext = match[1].toLowerCase();
  if (ext === "txt" || ext === "md" || ext === "json" || ext === "xml") {
    return ext as FileFormat;
  }
  return null;
}

export function formatPromptContent(content: string, format: FileFormat): string {
  const escapedContent = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

  switch (format) {
    case "json":
      return JSON.stringify({ prompt: content }, null, 2);
    case "xml":
      return `<?xml version="1.0" encoding="UTF-8"?>\n<prompt>${escapedContent}</prompt>`;
    case "md":
      return `# Prompt\n\n${content}`;
    case "txt":
    default:
      return content;
  }
}

export function extractPromptContent(content: string, format: FileFormat): string {
  try {
    switch (format) {
      case "json":
        const jsonData = JSON.parse(content);
        return jsonData.prompt || "";
      case "xml":
        const match = content.match(/<prompt>(.*?)<\/prompt>/s);
        if (!match) return content;
        return match[1]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'");
      case "md":
        return content.replace(/^#\s*Prompt\s*\n+/, "").trim();
      case "txt":
      default:
        return content;
    }
  } catch {
    return content;
  }
}
