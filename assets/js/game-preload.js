const { contextBridge, ipcRenderer, ipcMain } = require('electron')

//ゲーム側からの関数をフックする
contextBridge.exposeInMainWorld('vmc', {
    //設定を閉じる
    closeSetting: () => {
        document.getElementById('settingWindow').classList.toggle('settingShow')
    },
    //設定画面の切り替え
    showSetting: async (v) => {
        let settingDom = await ipcRenderer.invoke('settingTabChange', v);
        //クラス表示の切り替え。.menuSelectedを探して消す。そしてつける
        document.getElementsByClassName('menuSelected')[0].classList.toggle('menuSelected');
        document.getElementById(v).classList.toggle('menuSelected')
        //設定ウィンドウの中身を設定する
        document.getElementById('menuBody').innerHTML = await settingDom
    },
    //設定の保存
    saveSetting: (name, value) => {
        ipcRenderer.send('saveSettingValue', name, value)
    },
    crosshairChange: async (id, value) => {
        switch (id) {
            case "enableCustomCrosshair":
                value ? document.getElementById('crosshair').classList.remove('hidden') : document.getElementById('crosshair').classList.add('hidden');
                break;
            case "crosshairType":
                if (value === 'url') {
                    let crosshairUrl = await ipcRenderer.invoke('getSetting', 'crosshairUrl') || 'https://namekujilsds.github.io/CROSSHAIR/img/Cross-lime.png';
                    document.getElementById('crosshairPreviewImage').setAttribute('src', crosshairUrl);
                    document.getElementById('crosshair').setAttribute('src', crosshairUrl);
                } else if (value === 'local') {
                    let crosshairPath = await ipcRenderer.invoke('getSetting', 'crosshairPath') || await ipcRenderer.invoke('dirName', './assets/img/Cross-lime.png');
                    document.getElementById('crosshairPreviewImage').setAttribute('src', 'vmc://' + crosshairPath);
                    document.getElementById('crosshair').setAttribute('src', crosshairPath);
                };
                break;
            case "crosshairUrl":
                let nowType = await ipcRenderer.invoke('getSetting', 'crosshairType');
                if (nowType === 'url') {
                    document.getElementById('crosshairPreviewImage').setAttribute('src', value);
                    document.getElementById('crosshair').setAttribute('src', value);
                };
                break;
            case "crosshairWidthNum":
                document.getElementById('crosshairWidth').value = value
                ipcRenderer.send('saveSettingValue', 'crosshairWidthNum', value)
                ipcRenderer.send('saveSettingValue', 'crosshairWidth', value)
                refreshCrosshairCss()
                break;
            case "crosshairWidth":
                document.getElementById('crosshairWidthNum').value = value
                ipcRenderer.send('saveSettingValue', 'crosshairWidthNum', value)
                ipcRenderer.send('saveSettingValue', 'crosshairWidth', value)
                refreshCrosshairCss()
                break;
            case "crosshairHeightNum":
                document.getElementById('crosshairHeight').value = value
                ipcRenderer.send('saveSettingValue', 'crosshairHeightNum', value)
                ipcRenderer.send('saveSettingValue', 'crosshairHeight', value)
                refreshCrosshairCss()
                break;
            case "crosshairHeight":
                document.getElementById('crosshairHeightNum').value = value
                ipcRenderer.send('saveSettingValue', 'crosshairHeightNum', value)
                ipcRenderer.send('saveSettingValue', 'crosshairHeight', value)
                refreshCrosshairCss()
                break;
            case "crosshairOpacityNum":
                document.getElementById('crosshaiOpacity').value = value
                ipcRenderer.send('saveSettingValue', 'crosshairOpacityNum', value)
                ipcRenderer.send('saveSettingValue', 'crosshairOpacity', value)
                refreshCrosshairCss()
                break;
            case "crosshairOpacity":
                document.getElementById('crosshairOpacityNum').value = value
                ipcRenderer.send('saveSettingValue', 'crosshairOpacityNum', value)
                ipcRenderer.send('saveSettingValue', 'crosshairOpacity', value)
                refreshCrosshairCss()
                break;
            case "crosshairRenderType":
                refreshCrosshairCss()
                break;
        }
    },
    crosshairSizeSet: () => {
        let crosshair = document.getElementById('crosshair');
        let w = crosshair.naturalWidth;
        let h = crosshair.naturalHeight
        document.getElementById('crosshairWidth').value = w
        document.getElementById('crosshairWidthNum').value = w
        document.getElementById('crosshairHeight').value = h
        document.getElementById('crosshairHeightNum').value = h
        ipcRenderer.send('saveSettingValue', 'crosshairWidth', w)
        ipcRenderer.send('saveSettingValue', 'crosshairWidthNum', w)
        ipcRenderer.send('saveSettingValue', 'crosshairHeight', h)
        ipcRenderer.send('saveSettingValue', 'crosshairHeightNum', h);
        refreshCrosshairCss()
    },
    openLocal: (name) => {
        ipcRenderer.send('openFile', name)
    }
})

//crosshairのcssを設定する
const refreshCrosshairCss = async () => {
    let w = await ipcRenderer.invoke('getSetting', 'crosshairWidth') || 20;
    let h = await ipcRenderer.invoke('getSetting', 'crosshairHeight') || 20;
    let o = await ipcRenderer.invoke('getSetting', 'crosshairOpacity') || 1;
    let r = await ipcRenderer.invoke('getSetting', 'crosshairRenderType') || 'pixelated';
    let css = `
    #crosshair {
    position:fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width:${w}px ;
    height:${h}px ;
    opacity: ${o};
    image-rendering: ${r};
}`;
    document.getElementById('crosshairCss').innerText = css
}

//設定を開く
ipcRenderer.on('openSetting', async () => {
    if (!document.getElementById('settingWindow')) {
        let settingDom = await ipcRenderer.invoke('settingDom')
        let settingTabDom = await ipcRenderer.invoke('settingTabChange', "onload")
        await document.getElementById("app").insertAdjacentHTML("afterbegin", settingDom);
        document.getElementById("menuBody").innerHTML = await settingTabDom;
    } else {
        document.getElementById("settingWindow").classList.toggle("settingShow")
    }
})

//ページをリロード
ipcRenderer.on('reload', () => {
    location.reload()
})

//ローカルファイルのパスを受け取り
ipcRenderer.on('localPath', async (e, id, val) => {
    switch (id) {
        case 'crosshairPath':
            let type = await ipcRenderer.invoke('getSetting', 'crosshairType');
            type === 'local' ? document.getElementById('crosshairPreviewImage').setAttribute('src', 'vmc://' + val) : '';
            type === 'local' ? document.getElementById('crosshair').setAttribute('src', 'vmc://' + val) : '';
    }
})

// ページがロードされた際にipcMainからいろいろ引っ張る
document.addEventListener('DOMContentLoaded', async () => {
    let settingStyle = await ipcRenderer.invoke('loadSettingStylesheets')
    document.body.insertAdjacentHTML('afterbegin', settingStyle)
    let crosshair = await ipcRenderer.invoke('crosshairDom')
    document.getElementById('app').insertAdjacentHTML('afterbegin', crosshair)
    refreshCrosshairCss()
})
