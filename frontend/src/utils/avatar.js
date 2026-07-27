/**
 * Utility function to generate a consistent avatar URL for users, tutors, and admins.
 * Uses stored avatar image if available, otherwise fallbacks to UI-Avatars with standardized styling.
 *
 * @param {string|null} avatarUrl - The raw avatar URL from database or API
 * @param {string|null} name - Full name or username of the user/tutor
 * @param {string} [role='user'] - Role of the account ('user', 'tutor', 'admin')
 * @returns {string} - Full valid image URL to be used directly in <img src="..." />
 */
export const getAvatarUrl = (avatarUrl, name = 'User', role = 'user') => {
  if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim() !== '') {
    if (
      avatarUrl.startsWith('data:image/') ||
      avatarUrl.startsWith('http://') ||
      avatarUrl.startsWith('https://')
    ) {
      return avatarUrl;
    }
    // Handle relative paths from backend
    return `http://localhost:3001${avatarUrl}`;
  }

  // Fallback to UI-Avatars generator with clean, professional colors
  const cleanName = (name || 'User').toString().trim();
  const encodedName = encodeURIComponent(cleanName);

  // Default color themes based on role or universally elegant blue
  let background = 'dbeafe'; // Tailwind blue-100
  let color = '1d4ed8';      // Tailwind blue-700

  if (role === 'tutor') {
    background = 'e0e7ff';   // Tailwind indigo-100
    color = '4338ca';        // Tailwind indigo-700
  } else if (role === 'admin') {
    background = 'f3e8ff';   // Tailwind purple-100
    color = '7e22ce';        // Tailwind purple-700
  }

  return `https://ui-avatars.com/api/?name=${encodedName}&background=${background}&color=${color}&bold=true&size=128`;
};
