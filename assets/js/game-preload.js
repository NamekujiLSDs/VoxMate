const { contextBridge, ipcRenderer, ipcMain } = require('electron')

//ゲーム側からの関数をフックする
contextBridge.exposeInMainWorld('vmc', {
    //設定を閉じる
    closeSetting: () => {
        document.getElementById('settingWindow').classList.toggle('settingHidden')
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
            case "crosshairType":
                console.log(id, value)
                if (value === 'url') {
                    let crosshairUrl = await ipcRenderer.invoke('getSetting', 'crosshairUrl') || 'https://namekujilsds.github.io/CROSSHAIR/img/Cross-lime.png';
                    await document.getElementById('crosshairPreviewImage').setAttribute('src', crosshairUrl);
                    // await document.getElementById('crosshair').setAttribute('src', crosshairUrl);
                    await console.log(crosshairUrl);
                    await console.log("url")
                } else if (value === 'local') {
                    let crosshairPath = await ipcRenderer.invoke('getSetting', 'crosshairPath') || await 'vmc://' + await ipcRenderer.invoke('dirName', './assets/img/Cross-lime.png');
                    await document.getElementById('crosshairPreviewImage').setAttribute('src', crosshairPath);
                    // await document.getElementById('crosshair').setAttribute('src', crosshairPath);
                    await console.log(crosshairPath);
                    await console.log("local");
                };
            case "crosshairUrl":
                let nowType = await ipcRenderer.invoke('getSetting', 'crosshairType');
                if (nowType === 'url') {
                    await document.getElementById('crosshairPreviewImage').setAttribute('src', value);
                    // await document.getElementById('crosshair').setAttribute('src', value);
                }
            case "openLocalCrosshair":
                let path = ipcRenderer.invoke.openFile('localCrosshair');
            case "crosshairWidthNum": ;
            case "crosshairWidth": ;
            case "crosshairHeightNum": ;
            case "crosshairHeight": ;
            case "crosshairOpacityNum": ;
            case "crosshairOpacity": ;
            case "crosshairRenderType": ;
        }
    }
})

//設定を開く
ipcRenderer.on('openSetting', () => {
    document.getElementById("settingWindow").classList.toggle("settingHidden")
})
//ページをリロード
ipcRenderer.on('reload', () => {
    location.reload()
})
//ESCを処理
//ページをリロード
ipcRenderer.on('escape', () => {
    document.exitPointerLock()
})

//ページがロードされた際にipcMainからいろいろ引っ張る
document.addEventListener('DOMContentLoaded', async () => {
    let settingDom = await ipcRenderer.invoke('settingDom')
    let settingTabDom = await ipcRenderer.invoke('settingTabChange', "onload")
    await console.log(settingDom)
    await console.log(settingTabDom)
    await document.getElementById("app").insertAdjacentHTML("afterbegin", settingDom);
    document.getElementById("menuBody").innerHTML = await settingTabDom;
})
