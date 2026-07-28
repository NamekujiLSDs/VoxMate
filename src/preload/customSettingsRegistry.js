const RESERVED_TAB_IDS = Object.freeze([
    'quickSetting',
    'renderingSetting',
    'skySetting',
    'crosshairSetting',
    'cssSetting',
    'swapperSetting',
    'adblockSetting',
    'infoSetting',
    'userscriptSetting',
    'performanceSetting'
]);

const RESERVED_SETTING_IDS = Object.freeze([
    'settingWindow',
    'menuHider',
    'settingContainer',
    'menuItemHolder',
    'menuBodyHolder',
    'menuBody',
    'menuBodyTitle',
    'menuBodyItem',
    'menuButton',
    'joinHolder',
    'inviteHolder',
    'serverHookHolder',
    'crosshairPreview',
    'crosshairPreviewTitle',
    'previewBody',
    'crosshairPreviewImage',
    'fileNameDisplay',
    'cssName',
    'warn',
    'joinGame',
    'inviteGame',
    'serverHooker',
    'enableSkyColor',
    'skyMode',
    'skyColor',
    'skyRgbSpeed',
    'crosshairRenderType',
    'disableGpuVsync',
    'angleBackend',
    'inProcess',
    'enableGpuRasterization',
    'enableZerocopy',
    'enableCustomCrosshair',
    'crosshairType',
    'crosshairUrl',
    'localCrosshairList',
    'crosshairWidth',
    'crosshairHeight',
    'crosshairOpacity',
    'enableCustomCss',
    'useTailwindCss',
    'cssType',
    'cssUrl',
    'localCssList',
    'enableResourceSwapper',
    'useDefSwapList',
    'useUserSwapList',
    'enableAdBlocker',
    'useDefAdBlockList',
    'useUserAdBlockList',
    'unlimitedFps',
    'enableRawInput',
    'enableDesynchronized',
    'discordRpc',
    'enableQuic',
    'enablePointerLockOptions',
    'enableHeavyAdIntervention',
    'ignoreGpuBlocklist',
    'enableV8Opt',
    'enableParallelShader',
    'enableAudioOpt',
    'enableSimpleInfo',
    'infoPosition',
    'infoMarginTop',
    'infoMarginLeft',
    'infoShowFPS',
    'infoShowPing',
    'infoShowPos',
    'infoShowBlockPos',
    'infoShowChunkPos',
    'infoShowVelocity',
    'infoShowAngles',
    'infoShowChunks',
    'infoShowNetBps'
]);

const DEFAULT_CATEGORY_NAME = 'UserScript Dynamic Settings';

const getReservedTabIds = () => [...RESERVED_TAB_IDS];

const isReservedTabId = (tabId) => {
    return typeof tabId === 'string' && RESERVED_TAB_IDS.includes(tabId);
};

const isReservedSettingId = (settingId) => {
    return typeof settingId === 'string' && RESERVED_SETTING_IDS.includes(settingId);
};

const validateTabRegistration = (tabConfig, existingTabs = new Map()) => {
    if (!tabConfig || typeof tabConfig !== 'object') {
        return { ok: false, reason: 'Tab config must be an object.' };
    }

    const tabId = typeof tabConfig.id === 'string' ? tabConfig.id.trim() : '';
    if (!tabId) {
        return { ok: false, reason: 'Tab id is required.' };
    }

    if (existingTabs.has(tabId)) {
        return { ok: false, reason: `Tab id "${tabId}" is already registered.` };
    }

    if (isReservedTabId(tabId)) {
        return { ok: false, reason: `Tab id "${tabId}" is reserved by VoxMate.` };
    }

    return { ok: true, tabId };
};

const validateSettingRegistration = (settingConfig, existingSettings = new Map()) => {
    if (!settingConfig || typeof settingConfig !== 'object') {
        return { ok: false, reason: 'Setting config must be an object.' };
    }

    const id = typeof settingConfig.id === 'string' ? settingConfig.id.trim() : '';
    if (!id) {
        return { ok: false, reason: 'Setting id is required.' };
    }

    if (existingSettings.has(id)) {
        return { ok: false, reason: `Setting id "${id}" is already registered.` };
    }

    return { ok: true, id };
};

module.exports = {
    RESERVED_TAB_IDS,
    RESERVED_SETTING_IDS,
    DEFAULT_CATEGORY_NAME,
    getReservedTabIds,
    isReservedTabId,
    isReservedSettingId,
    validateTabRegistration,
    validateSettingRegistration
};
