/**
 * 全局共享可变状态
 *
 * 之前 ErisPulseApp IIFE 内部的闭包私有变量（被多个功能模块共享的）
 * 提升到这里，通过显式 import 访问，避免模块间隐式耦合。
 *
 * 仅放「被多个模块读写」的状态；只被单个模块使用的状态仍留在该模块内部。
 */

import { CONFIG } from '../config.js';

// 用户设置（设置 / 文档 / 市场等多模块共享）
export const state = {
    userSettings: { ...CONFIG.DEFAULT_USER_SETTINGS },
    // 模块市场数据（marketplace 渲染 + submit 去重校验共享）
    allModules: [],
    allAdapters: [],
    // 文档版本更新提示节流（nav 在线恢复时重置，docs 后台检查时置位）
    versionNotified: false,
};

/**
 * 从 localStorage 读取用户设置并合并到 state.userSettings
 */
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

/**
 * 将 state.userSettings 写入 localStorage
 */
export function saveUserSettings() {
    try {
        state.userSettings.version = CONFIG.SETTINGS_VERSION;
        localStorage.setItem(CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(state.userSettings));
    } catch (e) {
        console.warn('Failed to save user settings:', e);
    }
}
