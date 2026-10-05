const { app } = require('electron');
const { config } = require('./config');

const applyChromiumFlags = () => {
    if (config.get('unlimitedFps', true)) {
        app.commandLine.appendSwitch('disable-frame-rate-limit');
        app.commandLine.appendSwitch('disable-gpu-vsync');
        app.commandLine.appendSwitch('max-gum-fps', '9999');
        app.commandLine.appendSwitch('disable-v8-idle-notification');
    }
    if (config.get('disableGpuVsync', true)) {
        app.commandLine.appendSwitch('disable-gpu-vsync');
    }
    if (config.get('enableRawInput', true)) {
        // requestPointerLock({ unadjustedMovement: true }) (Raw Input) を有効にする。
        // Electron 10 (Chromium 85) では 'enable-pointer-lock-options' スイッチは効かず、
        // Blink の PointerLockOptions 機能を直接有効にする必要がある (Electron 10.4.7 で動作確認済み)。
        // 参照: https://developer.mozilla.org/en-US/docs/Web/API/Element/requestPointerLock
        app.commandLine.appendSwitch('enable-blink-features', 'PointerLockOptions');
        app.commandLine.appendSwitch('enable-raw-pointer-events');
        app.commandLine.appendSwitch('disable-ipc-flooding-protection');
        app.commandLine.appendSwitch('enable-high-resolution-time');
        app.commandLine.appendSwitch('disable-input-resampling');
        app.commandLine.appendSwitch('disable-features', 'InputPredictor,ResamplingScrollEvents');
    }
    if (config.get('inProcess', false)) {
        app.commandLine.appendSwitch('in-process-gpu');
    }
    if (config.get('enableQuic', true)) {
        app.commandLine.appendSwitch('enable-quic');
    }
    if (config.get('enableGpuRasterization', true)) {
        app.commandLine.appendSwitch('enable-gpu-rasterization');
    }
    if (config.get('enablePointerLockOptions', true)) {
        // 上の enableRawInput と同じ理由で、効かない 'enable-pointer-lock-options' ではなくこちらを使う
        app.commandLine.appendSwitch('enable-blink-features', 'PointerLockOptions');
    }
    if (config.get('enableHeavyAdIntervention', true)) {
        app.commandLine.appendSwitch('enable-heavy-ad-intervention');
    }
    if (config.get('ignoreGpuBlocklist', true)) {
        app.commandLine.appendSwitch('ignore-gpu-blocklist');
    }
    if (config.get('enableZerocopy', true)) {
        app.commandLine.appendSwitch('enable-zero-copy');
    }
    if (config.get('enableParallelShader', true)) {
        app.commandLine.appendSwitch('enable-features', 'ParallelShaderCompile');
    }
    if (config.get('enableAudioOpt', true)) {
        app.commandLine.appendSwitch('audio-buffer-size', '512');
    }
    
    const angleBackend = config.get('angleBackend', 'default');
    if (angleBackend && angleBackend !== 'default') {
        app.commandLine.appendSwitch('use-angle', angleBackend);
    }
};

module.exports = {
    applyChromiumFlags
};
