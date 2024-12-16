const { app, protocol } = require('electron')
const store = require('electron-store');
const log = require('electron-log');
const config = new store()
const path = require('path')

app.on('ready', () => {
    protocol.registerFileProtocol('vmc', (request, callback) =>
        callback(decodeURI(request.url.toString().replace(/^vmc:\//, '')))
    )
})
protocol.registerSchemesAsPrivileged([
    {
        scheme: 'vmc',
        privileges: {
            secure: true,
            corsEnabled: true
        }
    }
])

exports.clientTools = class {
    loadSettingStylesheets() {
        return `<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@200..800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" />
    <link rel="stylesheet" href="vmc://${path.join(__dirname, "../css/settings.css")}">`
    }
    settingWindow() {
        return `
            <div id="settingWindow" class="settingShow">
                <div id="menuItemHolder">
                    <div id="quickSetting"
                        class="menuItem ${config.get('lastOpen', 'quickSetting') === 'quickSetting' ? 'menuSelected' : ''}"
                        onclick="window.vmc.showSetting(this.id);window.vmc.saveSetting('lastOpen',this.id)">
                        <div class="menuItemIcon">
                            <span class="material-symbols-outlined">
                                rocket_launch
                            </span>
                        </div>
                        <div class="menuItemTitle">Quick Setting</div>
                    </div>
                    <div class="menuSplitter"></div>
                    <div id="crosshairSetting"
                        class="menuItem ${config.get('lastOpen', 'quickSetting') === 'crosshairSetting' ? 'menuSelected' : ''}"
                        onclick="window.vmc.showSetting(this.id);window.vmc.saveSetting('lastOpen',this.id)">
                        <div class="menuItemIcon">
                            <span class="material-symbols-outlined">
                                point_scan
                            </span>
                        </div>
                        <div class="menuItemTitle">Crosshair</div>
                    </div>
                    <div class="menuSplitter"></div>
                    <div id="cssSetting"
                        class="menuItem ${config.get('lastOpen', 'quickSetting') === 'cssSetting' ? 'menuSelected' : ''}"
                        onclick="window.vmc.showSetting(this.id);window.vmc.saveSetting('lastOpen',this.id)">
                        <div class="menuItemIcon">
                            <span class="material-symbols-outlined">
                                code_blocks
                            </span>
                        </div>
                        <div class="menuItemTitle">CSS</div>
                    </div>
                    <div class="menuSplitter"></div>
                    <div id="swapperSetting"
                        class="menuItem ${config.get('lastOpen', 'quickSetting') === 'swapperSetting' ? 'menuSelected' : ''}"
                        onclick="window.vmc.showSetting(this.id);window.vmc.saveSetting('lastOpen',this.id)">
                        <div class="menuItemIcon">
                            <span class="material-symbols-outlined">
                                swap_horiz
                            </span>
                        </div>
                        <div class="menuItemTitle">Swapper</div>
                    </div>
                    <div class="menuSplitter"></div>
                    <div id="adblockSetting"
                        class="menuItem ${config.get('lastOpen', 'quickSetting') === 'adblockSetting' ? 'menuSelected' : ''}"
                        onclick="window.vmc.showSetting(this.id);window.vmc.saveSetting('lastOpen',this.id)">
                        <div class="menuItemIcon">
                            <span class="material-symbols-outlined">
                                security
                            </span>
                        </div>
                        <div class="menuItemTitle">Ad Blocker</div>
                    </div>
                    <div class="menuSplitter"></div>
                    <div id="performanceSetting"
                        class="menuItem ${config.get('lastOpen', 'quickSetting') === 'performanceSetting' ? 'menuSelected' : ''}"
                        onclick="window.vmc.showSetting(this.id);window.vmc.saveSetting('lastOpen',this.id)">
                        <div class="menuItemIcon">
                            <span class="material-symbols-outlined">
                                manufacturing
                            </span>
                        </div>
                        <div class="menuItemTitle">Advanced</div>
                    </div>
                </div>
                <div id="menuBodyHolder" >
                    <div id="menuHider" onclick="window.vmc.closeSetting()"></div>
                    <div id="menuBody">
                    </div>
                </div>
            </div>`
    }
    settingDom(name) {
        switch (name) {
            case "onload":
                return this.settingDom(config.get('lastOpen', 'quickSetting'));
            case "quickSetting":
                return `<div id="menuBodyTitle">
                <span class="material-symbols-outlined">
                    rocket_launch
                </span>
                Quick Setting
            </div>
            <div class="horizonalLine"></div>
            <div id="menuBodyItem">
                Enable Custom Crosshair
                <input type="checkbox" name="enableCustomCrosshair" id="enableCustomCrosshair"
                    oninput="window.vmc.saveSetting(this.id,this.checked);window.vmc.crosshairChange(this.id,this.value)"
                    ${config.get('enableCustomCrosshair', true) ? "checked" : ""}>
            </div>
            <div class="horizonalLine"></div>
            <div id="menuBodyItem">
                Enable Custom CSS
                <input type="checkbox" name="enableCustomCss" id="enableCustomCss"
                    oninput="window.vmc.saveSetting(this.id,this.checked);window.vmc.customCssChange(this.id,this.checked)"
                    ${config.get('enableCustomCss', true) ? "checked" : ""}>
            </div>
            <div class="horizonalLine"></div>
            <div id="menuBodyItem">
                Enable Resource Swapper
                <input type="checkbox" name="enableResourceSwapper" id="enableResourceSwapper"
                    oninput="window.vmc.saveSetting(this.id,this.checked)"
                    ${config.get('enableResourceSwapper', true) ? "checked" : ""}>
            </div>
            <div class="horizonalLine"></div>
            <div id="menuBodyItem">
                Enable Ad Blocker
                <input type="checkbox" name="enableAdBlocker" id="enableAdBlocker"
                    oninput="window.vmc.saveSetting(this.id,this.checked)"
                    ${config.get('enableAdBlocker', true) ? "checked" : ""}>
            </div>
            <div class="horizonalLine"></div>
            <div id="menuBodyItem">
                Enable Unlimited FPS
                <input type="checkbox" name="unlimitedFps" id="unlimitedFps"
                    oninput="window.vmc.saveSetting(this.id,this.checked)"
                    ${config.get('unlimitedFps', true) ? "checked" : ""}>
            </div>
            <div class="horizonalLine"></div>

            <div id="menuBodyItem">
                Export Game Settings
                <input type="button" id="menuButton" value="EXPORT" onclick="window.vmc.exportSetting()">
            </div>
            <div class="horizonalLine"></div>

            <div id="menuBodyItem">
                Import Game Settings
                <input type="button" id="menuButton" value="IMPORT" onclick="window.vmc.exportSetting()">
            </div>
            <div class="horizonalLine"></div>`;
            case "crosshairSetting":
                return `<div id="menuBodyTitle">
                <span class="material-symbols-outlined">
                    point_scan
                </span>
                Crosshair Setting
            </div>
            <div id="crosshairPreview">
                <div id="crosshairPreviewTitle">Crosshair Preview</div>
                <div id="previewBody">
                    <img id="crosshairPreviewImage"
                        src="${config.get('crosshairType', 'url') === 'url' ? config.get('crosshairUrl', 'https://namekujilsds.github.io/CROSSHAIR/img/Cross-lime.png') : 'vmc://' + config.get('crosshairPath', path.join(__dirname, '../img/Cross-lime.png'))}">
                </div>
            </div>
            <div id="menuBodyItem">
                Enable Custom Crosshair
                <input type="checkbox" name="enableCustomCrosshair" id="enableCustomCrosshair"
                    oninput="window.vmc.saveSetting(this.id ,this.checked);window.vmc.crosshairChange(this.id,this.value)"
                    ${config.get('enableCustomCrosshair', true) ? "checked" : ""}>
            </div>
            <div class="horizonalLine"></div>
            <div id="menuBodyItem">
                Crosshair Type
                <select name="crosshairType" id="crosshairType"
                    oninput="window.vmc.saveSetting(this.id,this.value);window.vmc.crosshairChange(this.id,this.value)">
                    <option value="url" ${config.get('crosshairType', 'url') === 'url' ? 'selected' : ''}>URL
                    </option>
                    <option value="local" ${config.get('crosshairType', 'url') === 'local' ? 'selected' : ''}>Local
                        File
                    </option>
                </select>
            </div>
            <div class="horizonalLine"></div>
            <div id="menuBodyItem">
                Crosshair URL
                <input type="url" name="crosshairUrl" id="crosshairUrl"
                    onchange="window.vmc.saveSetting(this.id ,this.value);window.vmc.crosshairChange(this.id,this.value)"
                    value="${config.get('crosshairUrl', 'https://namekujilsds.github.io/CROSSHAIR/img/Cross-lime.png')}">
            </div>
            <div class="horizonalLine"></div>
            <div id="menuBodyItem">
                Local Crosshair File
                <input type="button" name="openLocaCrosshair" id="menuButton" value="OPEN"
                    onclick="window.vmc.openLocal('crosshairPath')">
            </div>
            <div class="horizonalLine"></div>
            <div id="menuBodyItem">
                Auto Set Size
                <input type="button" name="autoSetSize" id="menuButton" value="SET"
                    onclick="window.vmc.crosshairSizeSet()">
            </div>
            <div class="horizonalLine"></div>
            <div id="menuBodyItem">
                Crosshair width
                <div id="rangeNumHolder">
                    <input type="number" class="sizeInput" name="crosshairWidthNum" id="crosshairWidthNum"
                        oninput="window.vmc.crosshairChange(this.id,this.value)"
                        value="${config.get('crosshairWidth', '20')}" min="0" max="1024" step="1">
                        <input type="range" name="crosshairWidth" id="crosshairWidth"
                            value="${config.get('crosshairWidth', '20')}"
                            oninput="window.vmc.saveSetting(this.id,this.value);window.vmc.crosshairChange(this.id,this.value)"
                            min="0" max="1024" step="1">
                        </div>
                </div>
                <div class="horizonalLine"></div>
                <div id="menuBodyItem">
                    Crosshair Height
                    <div id="rangeNumHolder">
                        <input type="number" class="sizeInput" name="crosshairHeightNum" id="crosshairHeightNum"
                            oninput="window.vmc.crosshairChange(this.id,this.value)"
                            value="${config.get('crosshairHeight', '20')}" min="0" max="1024" step="1">
                            <input type="range" name="crosshairHeight" id="crosshairHeight"
                                value="${config.get('crosshairHeight', '20')}"
                                oninput="window.vmc.saveSetting(this.id,this.value);window.vmc.crosshairChange(this.id,this.value)"
                                min="0" max="1024" step="1">
                            </div>
                    </div>
                    <div class="horizonalLine"></div>
                    <div id="menuBodyItem">
                        Crosshair Opacity
                        <div id="rangeNumHolder">
                            <input type="number" class="sizeInput" name="crosshairOpacityNum" id="crosshairOpacityNum"
                                oninput="window.vmc.crosshairChange(this.id,this.value)"
                                value="${config.get('crosshairOpacity', '1')}" min="0" max="1" step=".1">
                                <input type="range" name="crosshairOpacity" id="crosshairOpacity"
                                    value="${config.get('crosshairOpacity', '1')}"
                                    oninput="window.vmc.saveSetting(this.id,this.value);window.vmc.crosshairChange(this.id,this.value)"
                                    min="0" max="1" step=".1">
                                </div>
                        </div>
                        <div class="horizonalLine"></div>
                        <div id="menuBodyItem">
                            Crosshair Rendering Method
                            <select name="crosshairRenderType" id="crosshairRenderType"
                                oninput="window.vmc.saveSetting(this.id,this.value);window.vmc.crosshairChange(this.id,this.value)">
                                <option value="pixelated" ${config.get('crosshairRenderType', 'pixelated') === 'pixelated'
                        ? 'selected' : ''}>
                                    Pixelated
                                </option>
                                <option value="crisp-edges" ${config.get('crosshairRenderType', 'pixelated') === 'crisp-edges'
                        ? 'selected' : ''}>
                                    Crisp Edges
                                </option>
                            </select>
                        </div>
                        <div class="horizonalLine"></div>`;
            case "cssSetting":
                return `<div id="menuBodyTitle">
                            <span class="material-symbols-outlined">
                                code_blocks
                            </span>
                            CSS Setting
                        </div>
                        <div id="menuBodyItem">
                            Enable Custom CSS
                            <input type="checkbox" name="enableCustomCss" id="enableCustomCss"
                                oninput="window.vmc.saveSetting(this.id ,this.checked);window.vmc.customCssChange(this.id,this.checked)"
                                ${config.get('enableCustomCss', true) ? "checked" : ""}>
                        </div>
                        <div class="horizonalLine"></div>
                        <div id="menuBodyItem">
                            CSS Type
                            <select name="cssType" id="cssType"
                                oninput="window.vmc.saveSetting(this.id,this.value);window.vmc.customCssChange(this.id,this.value)">
                                <option value="url" ${config.get('cssType', 'url') === 'url' ? 'selected' : ''}>URL
                                </option>
                                <option value="local" ${config.get('cssType', 'url') === 'local' ? 'selected' : ''}>Local
                                    File
                                </option>
                            </select>
                        </div>
                        <div class="horizonalLine"></div>
                        <div id="menuBodyItem">
                            Custom CSS URL
                            <input type="url" name="cssUrl" id="cssUrl"
                                onchange="window.vmc.saveSetting(this.id ,this.value);window.vmc.customCssChange(this.id,this.value)"
                                value="${config.get('cssUrl', '')}">
                        </div>
                        <div class="horizonalLine"></div>
                        <div id="menuBodyItem">
                            Local CSS File
                            <div id="fileNameDisplay">
                                <div id="cssName" class="filename">
                                    Current : ${config.get('cssPath', "").length > 0 ? path.basename(config.get('cssPath')) : "NONE"}
                                </div>
                                    <input type="button" name="openLocaCss" id="menuButton" value="OPEN"
                                onclick="window.vmc.openLocal('cssPath')">
                            </div>
                        </div>
                        <div class="horizonalLine"></div>`;
            case "swapperSetting":
                return `<div id="menuBodyTitle">
                            <span class="material-symbols-outlined">
                                swap_horiz
                            </span>
                            Resorce Swapper
                        </div>
                        <div class="horizonalLine"></div>
                        <div id="menuBodyItem" class="requireRestart">*Require Restart Client</div>
                        <div class="horizonalLine"></div>
                        <div id="menuBodyItem">
                            Enable Resource Swapper
                            <input type="checkbox" name="enableResourceSwapper" id="enableResourceSwapper"
                                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('enableResourceSwapper',
                    true) ? "checked" : ""}>
                        </div>
                        <div class="horizonalLine"></div>
                        <div id="menuBodyItem">
                            Use Default Swapper List
                            <input type="checkbox" name="useDefSwapList" id="useDefSwapList"
                                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('useDefSwapList', true)
                        ? "checked" : ""}>
                        </div>
                        <div class="horizonalLine"></div>
                        <div id="menuBodyItem">
                            Use User Swapper List
                            <input type="checkbox" name="useUserSwapList" id="useUserSwapList"
                                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('useUserSwapList', true)
                        ? "checked" : ""}>
                        </div>
                        <div class="horizonalLine"></div>
                        <div id="menuBodyItem">
                            Open Swapper Folder
                            <input type="button" id="menuButton" value="OPEN" onclick="window.vmc.openSwapperFolder()">
                        </div>
                        <div class="horizonalLine"></div>
                        <div id="menuBodyItem">
                            Open Tutorial <div id="warn">*Open in browser</div>
                            <input type="button" id="menuButton" value="OPEN" onclick="window.vmc.openTutorial('resourceSwapper')">
                        </div>
                        <div class="horizonalLine"></div>`;
            case "adblockSetting":
                return `<div id="menuBodyTitle">
                            <span class="material-symbols-outlined">
                                security
                            </span>
                            Ad Blocker
                        </div>
                        <div class="horizonalLine"></div>
                        <div id="menuBodyItem" class="requireRestart">
                            *Require Restart Client
                        </div>
                        <div class="horizonalLine"></div>
                        <div id="menuBodyItem">
                            Enable Ad Blocker
                            <input type="checkbox" name="enableAdBlocker" id="enableAdBlocker"
                                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('enableAdBlocker', true)
                        ? "checked" : ""}>
                        </div>
                        <div class="horizonalLine"></div>
                        <div id="menuBodyItem">
                            Use Default Adblock List
                            <input type="checkbox" name="useDefAdBlockList" id="useDefAdBlockList"
                                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('useDefAdBlockList', true)
                        ? "checked" : ""}>
                        </div>
                        <div class="horizonalLine"></div>
                        <div id="menuBodyItem">
                            Use User Adblock List
                            <input type="checkbox" name="useUserAdBlockList" id="useUserAdBlockList"
                                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('useUserAdBlockList', true)
                        ? "checked" : ""}>
                        </div>
                        <div class="horizonalLine"></div>
                        <div id="menuBodyItem">
                            Open Tutorial <div id="warn">*Open in browser</div>
                            <input type="button" id="menuButton" value="OPEN" onclick="window.vmc.openTutorial('adBlock')">
                        </div>
                        <div class="horizonalLine"></div>`;
            case "performanceSetting":
                return `<div id="menuBodyTitle">
                            <span class="material-symbols-outlined">
                                manufacturing
                            </span>
                            Performance Settings
                        </div>
                        <div class="horizonalLine"></div>
                        <div id="menuBodyItem" class="requireRestart">
                            *Require Restart Client
                        </div>
                        <div class="horizonalLine"></div>
                        <div id="menuBodyItem">
                            Enable Unlimited FPS
                            <input type="checkbox" name="unlimitedFps" id="unlimitedFps"
                                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('unlimitedFps', true)
                        ? "checked" : ""}>
                        </div>
                        <div class="horizonalLine"></div>
                        <div id="menuBodyItem">
                            Enable Discord RPC
                            <input type="checkbox" name="discordRpc" id="discordRpc"
                                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('discordRpc', true)
                        ? "checked" : ""}>
                        </div>
                        <div class="horizonalLine"></div>
                        <div id="menuBodyItem">
                            Disable GPU Vsync
                            <input type="checkbox" name="disableGpuVsync" id="disableGpuVsync"
                                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('disableGpuVsync', true)
                        ? "checked" : ""}>
                        </div>
                        <div class="horizonalLine"></div>
                        <div id="menuBodyItem">
                            Change Angle Backend
                            <select name="angleBackend" id="angleBackend" onchange="window.vmc.saveSetting(this.id,this.value)">
                                <option value="default" ${config.get('angleBackend', 'default') === "default" ? 'selected' : ''}>Default</option>
                                <option value="opengl" ${config.get('angleBackend', 'default') === "opengl" ? 'selected' : ''}>openGL</option>
                                <option value="d3d11" ${config.get('angleBackend', 'default') === "d3d11" ? 'selected' : ''}>D3D11</option>
                                <option value="d3d9" ${config.get('angleBackend', 'default') === "d3d9" ? 'selected' : ''}>D3D9</option>
                                <option value="d3d11on12" ${config.get('angleBackend', 'default') === "d3d11on12" ? 'selected' : ''}>D3D11on12</option>
                            </select>
                        </div>
                        <div class="horizonalLine"></div>

                        <div id="menuBodyItem">
                            Enable In-process-gpu
                            <input type="checkbox" name="inProcess" id="inProcess"
                                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('inProcess', true)
                        ? "checked" : ""}>
                        </div>
                        <div class="horizonalLine"></div>

                        <div id="menuBodyItem">
                            Enable QUIC
                            <input type="checkbox" name="enableQuic" id="enableQuic"
                                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('enableQuic', true)
                        ? "checked" : ""}>
                        </div>
                        <div class="horizonalLine"></div>

                        <div id="menuBodyItem">
                            Enable GPU Rasterization
                            <input type="checkbox" name="enableGpuRasterization" id="enableGpuRasterization"
                                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('enableGpuRasterization',
                            true) ? "checked" : ""}>
                        </div>
                        <div class="horizonalLine"></div>

                        <div id="menuBodyItem">
                            Enable Pointer Lock Options
                            <input type="checkbox" name="enablePointerLockOptions" id="enablePointerLockOptions"
                                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('enablePointerLockOptions',
                                true) ? "checked" : ""}>
                        </div>
                        <div class="horizonalLine"></div>

                        <div id="menuBodyItem">
                            Enable Heavy Ad Intervention
                            <input type="checkbox" name="enableHeavyAdIntervention" id="enableHeavyAdIntervention"
                                oninput="window.vmc.saveSetting(this.id,this.checked);"
                                ${config.get('enableHeavyAdIntervention', true) ? "checked" : ""}>
                        </div>
                        <div class="horizonalLine"></div>
                        <div id="menuBodyItem">
                            Ignore GPU Blocklist
                            <input type="checkbox" name="ignoreGpuBlocklist" id="ignoreGpuBlocklist"
                                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('ignoreGpuBlocklist', true)
                        ? "checked" : ""}>
                        </div>
                        <div class="horizonalLine"></div>
                        <div id="menuBodyItem">
                            Enable Zero Copy
                            <input type="checkbox" name="enableZerocopy" id="enableZerocopy"
                                oninput="window.vmc.saveSetting(this.id,this.checked);" ${config.get('enableZerocopy', true)
                        ? "checked" : ""}>
                        </div>
                        <div class="horizonalLine"></div>

                        <div id="menuBodyItem">
                            Clear Cache
                            <input type="button" value="CLEAR" onclick="window.vmc.clearCache()">
                        </div>
                        <div class="horizonalLine"></div>

                        <div id="menuBodyItem">
                            Reset All Data
                            <input type="button" value="RESET" onclick="window.vmc.resetAllData()">
                        </div>
                        <div class="horizonalLine"></div>`;
        }
    }
    flagSwitch() {
        app.commandLine.appendSwitch(config.get('unlimitedFps', true) ? 'disable-frame-rate-limit' : '');
        app.commandLine.appendSwitch(config.get('disableGpuVsync', true) ? 'disable-gpu-vsync' : '');
        app.commandLine.appendSwitch(config.get('inProcess', true) ? 'in-process-gpu' : '');
        app.commandLine.appendSwitch(config.get('enableQuic', true) ? 'enable-quic' : '');
        app.commandLine.appendSwitch(config.get('enableGpuRasterization', true) ? 'enable-gpu-rasterization' : '');
        app.commandLine.appendSwitch(config.get('enablePointerLockOptions', true) ? 'enable-pointer-lock-options' : '');
        app.commandLine.appendSwitch(config.get('enableHeavyAdIntervention', true) ? 'enable-heavy-ad-intervention' : '');
        app.commandLine.appendSwitch(config.get('ignoreGpuBlocklist', true) ? 'ignore-gpu-blocklist' : '');
        app.commandLine.appendSwitch(config.get('enableZerocopy', true) ? 'enable-zero-copy' : '');
        app.commandLine.appendSwitch('use-angle', config.get('angleBackend', 'default'));
        console.log(config.get('unlimitedFps'))
        console.log(config.get('disableGpuVsync'))
        console.log(config.get('inProcess'))
        console.log(config.get('enableQuic'))
        console.log(config.get('enableGpuRasterization'))
        console.log(config.get('enablePointerLockOptions'))
        console.log(config.get('enableHeavyAdIntervention'))
        console.log(config.get('ignoreGpuBlocklist'))
        console.log(config.get('enableZerocopy'))
        console.log(config.get('angleBackend'))
    }
    crosshairDom() {
        let crosshairurl
        switch (config.get('crosshairType', 'url')) {
            case 'url':
                crosshairurl = config.get('crosshairUrl', "https://namekujilsds.github.io/CROSSHAIR/img/Cross-lime.png");
                break
            case 'local':
                crosshairurl = config.get('crosshairPath', path.join(__dirname, '../img/Cross-lime.png'));
                crosshairurl = 'vmc://' + crosshairurl
                break
        }
        return `<img src="${crosshairurl}" id="crosshair">
        <style id='crosshairCss'></style>`
    }
    CustomCssDom() {
        let enable = config.get('enableCustomCss')
        let type = config.get('cssType')
        let link, fineName
        switch (type) {
            case 'local':
                link = 'vmc://' + config.get('cssPath');
                break;
            case 'url':
                link = config.get('cssUrl')
                break;
        }
        let dom = enable ? `<link rel="stylesheet" id="customCss" href="${link}">` : '<link rel="stylesheet" id="customCss" href="">';
        console.log(dom)
        fineName = config.get('cssPath', "").length > 0 ? path.basename(config.get('cssPath')) : "NONE"
        return [dom, fineName]
    }
    exportSetting(v) { }

    test() {
    }
}