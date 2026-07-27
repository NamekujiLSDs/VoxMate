const { registerSettingHandlers } = require('./settingHandlers');
const { registerSystemHandlers } = require('./systemHandlers');

const registerAllIpcHandlers = (baseDir, settingsTemplate, getGameWindow) => {
    registerSettingHandlers(baseDir, settingsTemplate, getGameWindow);
    registerSystemHandlers(getGameWindow);
};

module.exports = {
    registerAllIpcHandlers
};
