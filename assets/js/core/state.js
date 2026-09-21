








import { CONFIG } from '../config.js';

 
export const state = {
    userSettings: { ...CONFIG.DEFAULT_USER_SETTINGS },
     
    allModules: [],
    allAdapters: [],
    allCliExtensions: [],
     
    versionNotified: false,
};




export function loadUserSettings() {
    try {
        const savedSettings = localStorage.getItem(CONFIG.STORAGE_KEYS.SETTINGS);
        if (savedSettings) {
            const parsedSettings = JSON.parse(savedSettings);

            if (!parsedSettings.version || parsedSettings.version !== CONFIG.SETTINGS_VERSION) {
                localStorage.removeItem(CONFIG.STORAGE_KEYS.SETTINGS);
                state.userSettings = { ...CONFIG.DEFAULT_USER_SETTINGS };
                return;
            }

            state.userSettings = { ...CONFIG.DEFAULT_USER_SETTINGS, ...parsedSettings };
        }
    } catch (e) {
        console.warn('Failed to load user settings:', e);
        state.userSettings = { ...CONFIG.DEFAULT_USER_SETTINGS };
    }
}




export function saveUserSettings() {
    try {
        state.userSettings.version = CONFIG.SETTINGS_VERSION;
        localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(state.userSettings));
    } catch (e) {
        console.warn('Failed to save user settings:', e);
    }
}
