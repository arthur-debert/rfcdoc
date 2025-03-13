/**
 * Format Document Command - Headless Backend
 * 
 * This module provides functionality for formatting documents
 * in the headless backend environment.
 */

/**
 * Command result interface
 * This interface defines the shape of the result returned by command functions
 */
interface CommandResult<T> {
  success: boolean;
  result?: T;
  error?: any;
}

/**
 * Format lines according to the RFC specification
 * @param lines - The lines to format
 * @returns - The formatted lines
 */
function formatLines(lines: string[]): string[] {
  const formattedLines: string[] = [];
  let inSection = false;
  let inList = false;
  let inCodeBlock = false;
  let inQuote = false;
  let inMetadata = false;
  let inNumberedList = false;
  let skipNextLine = false;
  
  for (let i = 0; i < lines.length; i++) {
    // Skip this line if it was marked to be skipped
    if (skipNextLine) {
      skipNextLine = false;
      continue;
    }
    
    let line = lines[i];
    
    // Trim trailing whitespace 
    line = line.trimRight();
    
    // Check for section headers
    if (isSection(line)) {
      inSection = true;
      inList = false;
      inNumberedList = false;
      inCodeBlock = false;
      inQuote = false;
      inMetadata = false;
      
      // Ensure there's a blank line before sections (except at the start of the document)
      if (i > 0 && formattedLines[formattedLines.length - 1] !== '') {
        formattedLines.push('');
      }
      
      formattedLines.push(line);
      
      // Ensure there's a blank line after section headers
      formattedLines.push('');
      
      // Skip the next line if it's already blank to avoid double blank lines
      if (i < lines.length - 1 && lines[i + 1].trim() === '') {
        skipNextLine = true;
      }
      
      // Continue to the next line
      continue;
    }
    
    // Check for metadata
    if (isMetadata(line)) {
      inMetadata = true;
      inSection = false;
      inNumberedList = false;
      inList = false;
      inCodeBlock = false;
      inQuote = false;
      
      // Format metadata with consistent spacing
      const [key, value] = splitMetadata(line);
      if (key && value) {
        // Always format metadata with consistent spacing
        formattedLines.push(`${key.padEnd(14)}${value}`);
      } else {
        formattedLines.push(line);
      }
      continue;
    }
    
    // Check for lists
    const listType = getListType(line);
    if (listType !== 'none') {
      // Set the appropriate list state
      inList = true;      
      inNumberedList = (listType === 'numbered');
      inCodeBlock = false;
      inSection = false;
      inQuote = false;
      
      // For numbered lists, don't add blank lines between items
      formattedLines.push(line);
      continue;
    }
    
    // Check for code blocks (indented with 4 spaces)
    if (line.startsWith('    ') && !line.startsWith('     ')) {
      inCodeBlock = true;
      inNumberedList = false;
      inList = false;
      inQuote = false;
      
      formattedLines.push(line);
      continue;
    }
    
    // Check for quotes
    if (line.startsWith('>')) {
      inQuote = true;
      inNumberedList = false;
      inList = false;
      inCodeBlock = false;
      
      formattedLines.push(line);
      continue;
    }
    
    // Handle blank lines
    if (line.trim() === '') {
      inList = false;
      inNumberedList = false;
      inCodeBlock = false;
      inQuote = false;
      
      formattedLines.push('');
      continue;
    }
    
    // Handle regular text
    formattedLines.push(line.trimRight());
  }
  
  return formattedLines;
}

/**
 * Check if a line is a section header
 * @param line - The line to check
 * @returns - Whether the line is a section header
 */
function isSection(line: string): boolean {
  // Check for numbered sections (e.g., "1. Section Name")
  if (/^\d+(\.\d+)*\.\s+\S/.test(line)) {
    return true;
  }
  
  // Check for uppercase sections (e.g., "SECTION NAME")
  if (/^[A-Z][A-Z\s\-]+$/.test(line)) {
    return true;
  }
  
  // Check for alternative sections (e.g., ": Section Name")
  if (/^:\s+\S/.test(line)) {
    return true;
  }
  
  return false;
}

/**
 * Split a metadata line into key and value
 * @param line - The metadata line
 * @returns - The key and value, or null if not a valid metadata line
 */
function splitMetadata(line: string): [string | null, string | null] {
  // Match any line that starts with a word followed by any amount of whitespace
  const match = line.match(/^([A-Za-z][A-Za-z\s]+?)(?:\s{2,})(.+)$/);
  if (match) {
    return [match[1].trim(), match[2].trim()];
  }
  return [null, null];
}

/**
 * Check if a line is a list item
 * @param line - The line to check
 * @returns - The type of list item ('none', 'bullet', 'numbered', 'lettered', 'roman')
 */
function getListType(line: string): 'none' | 'bullet' | 'numbered' | 'lettered' | 'roman' {
  // Check for bullet lists (e.g., "- Item")
  if (/^\s*-\s+\S/.test(line)) {
    return 'bullet';
  }
  
  // Check for numbered lists (e.g., "1. Item")
  if (/^\s*\d+\.\s+\S/.test(line)) {
    return 'numbered';
  }
  
  // Check for lettered lists (e.g., "a. Item")
  if (/^\s*[a-z]\.\s+\S/.test(line)) {
    return 'lettered';
  }
  
  // Check for roman numeral lists (e.g., "i. Item")
  if (/^\s*[ivxlcdm]+\.\s+\S/.test(line)) {
    return 'roman';
  }
  
  return 'none';
}

/**
 * Check if a line is a list item
 * @param line - The line to check
 * @returns - Whether the line is a list item
 */
function isList(line: string): boolean {
  return getListType(line) !== 'none';
}

/**
 * Format a document according to the RFC specification
 * @param text - The document text to format
 * @returns - The formatted document text
 */
export function formatDocument(text: string): string {
  // Get the document text as lines
  const lines = text.split('\n');

  // Apply formatting rules
  const formattedLines = formatLines(lines);

  // Return the formatted text
  return formattedLines.join('\n');
}

/**
 * Format a document according to the RFC specification
 * @param text - The document text
 * @param filePath - The path of the document
 * @returns - The result of the formatting
 */
export async function formatDocumentCommand(
  text: string,
  filePath: string
): Promise<CommandResult<string>> {
  // Only process RFC files
  if (!filePath.endsWith('.rfc')) {
    return {
      success: false,
      error: 'Format Document command is only available for .rfc files'
    };
  }

  try {
    // Format the document
    const formattedText = formatDocument(text);
    
    return {
      success: true,
      result: formattedText
    };
  } catch (error) {
    // Handle any errors
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: `Error formatting document: ${errorMessage}`
    };
  }
}

// For backward compatibility
export function isMetadata(line: string): boolean {
  const [key, value] = splitMetadata(line);
  return key !== null && value !== null;
}