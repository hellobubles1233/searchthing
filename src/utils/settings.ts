// Settings interface that defines all available user preferences
export interface UserSettings {
  defaultBang?: string;  // The user's preferred default bang (e.g., "g" for Google)
  // Add more settings here as needed
}

// Default settings values
export const DEFAULT_SETTINGS: UserSettings = {
  defaultBang: undefined,
};

// Settings key in cookies
const SETTINGS_COOKIE_KEY = 'unduck_settings';

/**
 * Saves user settings to cookies
 * @param settings The settings object to save
 * @param expirationDays Number of days until the cookie expires (default: 365)
 */
export function saveSettings(settings: UserSettings, expirationDays = 365): void {
  try {
    // Create expiration date
    const date = new Date();
    date.setTime(date.getTime() + (expirationDays * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    
    // Serialize settings to JSON and store in cookie
    const settingsJson = JSON.stringify(settings);
    document.cookie = `${SETTINGS_COOKIE_KEY}=${encodeURIComponent(settingsJson)};${expires};path=/;SameSite=Strict`;
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

/**
 * Loads user settings from cookies
 * @returns The user settings object, or default settings if not found
 */
export function loadSettings(): UserSettings {
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === SETTINGS_COOKIE_KEY && value) {
        return { 
          ...DEFAULT_SETTINGS, 
          ...JSON.parse(decodeURIComponent(value))
        };
      }
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  
  return { ...DEFAULT_SETTINGS };
}

/**
 * Updates a specific setting value and saves to cookies
 * @param key The setting key to update
 * @param value The new value
 */
export function updateSetting<K extends keyof UserSettings>(
  key: K, 
  value: UserSettings[K]
): void {
  const currentSettings = loadSettings();
  currentSettings[key] = value;
  saveSettings(currentSettings);
} 