/**
 * Centralized theme configuration for consistent styling across the app
 * Supports both light and dark modes
 */

export const theme = {
  // Text colors
  text: {
    primary: 'text-gray-900 dark:text-gray-100',
    secondary: 'text-gray-600 dark:text-gray-400',
    muted: 'text-gray-500 dark:text-gray-500',
    inverse: 'text-white dark:text-gray-900',
    error: 'text-red-600 dark:text-red-400',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    info: 'text-blue-600 dark:text-blue-400',
  },

  // Backgrounds
  bg: {
    primary: 'bg-white dark:bg-gray-800',
    secondary: 'bg-gray-50 dark:bg-gray-900',
    muted: 'bg-gray-100 dark:bg-gray-700',
    inverse: 'bg-gray-900 dark:bg-white',
  },

  // Borders
  border: {
    default: 'border-gray-300 dark:border-gray-600',
    muted: 'border-gray-200 dark:border-gray-700',
    strong: 'border-gray-400 dark:border-gray-500',
  },

  // Form inputs
  input: {
    base: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700',
    label: 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1',
    select: 'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700',
    placeholder: 'placeholder-gray-400 dark:placeholder-gray-500',
  },

  // Buttons
  button: {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600',
    secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600',
    danger: 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600',
    success: 'bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600',
    ghost: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700',
  },

  // Cards
  card: {
    base: 'bg-white dark:bg-gray-800 rounded-lg shadow-lg',
    padding: 'p-6',
    full: 'bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6',
  },

  // Badges/Status
  badge: {
    success: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    error: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
    warning: 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/30',
    info: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    neutral: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-700',
  },

  // Operation colors (for ModuleSettings)
  operation: {
    addOwner: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    removeOwner: 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/30',
    replaceOwner: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
    changeThreshold: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
  },

  // Interactive states
  interactive: {
    hover: 'hover:bg-gray-50 dark:hover:bg-gray-700',
    active: 'active:bg-gray-100 dark:active:bg-gray-600',
    focus: 'focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400',
    disabled: 'opacity-50 cursor-not-allowed',
  },

  // Transitions
  transition: {
    default: 'transition-colors duration-200',
    fast: 'transition-all duration-150',
    slow: 'transition-all duration-300',
  },
} as const;

// Helper function to combine theme classes with custom classes
export function themeClass(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
