import toast from 'react-hot-toast';

/**
 * Enhanced clipboard copy function that works in sandboxed iframes (like Safe App)
 * Uses modern Clipboard API with fallback to document.execCommand
 */
export async function copyToClipboard(text: string, label?: string): Promise<boolean> {
  try {
    // Try modern Clipboard API first (requires clipboard-write permission)
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      if (label) {
        toast.success(`Copied ${label}!`);
      }
      return true;
    }
  } catch (error) {
    // Modern API failed, fall through to legacy method
    console.log('Clipboard API failed, using fallback:', error);
  }

  try {
    // Fallback using document.execCommand (works in sandboxed iframes)
    const textArea = document.createElement('textarea');
    textArea.value = text;
    // Position off-screen but keep it visible (display:none or visibility:hidden breaks copy)
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);

    // Select the text
    textArea.select();
    textArea.setSelectionRange(0, text.length);

    // Execute copy command
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);

    if (successful) {
      if (label) {
        toast.success(`Copied ${label}!`);
      }
      return true;
    } else {
      toast.error('Copy failed. Please copy manually.');
      return false;
    }
  } catch (error) {
    console.error('Copy failed:', error);
    toast.error('Copy failed. Please copy manually.');
    return false;
  }
}
