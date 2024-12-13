const { contextBridge, ipcRenderer, ipcMain } = require('electron')

//ゲーム側からの関数をフックする
contextBridge.exposeInMainWorld('vmc', {
    //設定を閉じる
    closeSetting: () => {
        document.getElementById('settingWindow').classList.toggle('hidden')
    },
    //設定画面の切り替え
    showSetting: async (v) => {
        let settingDom = await ipcRenderer.invoke('getSettingWindowDom', v);
        //クラス表示の切り替え。.menuSelectedを探して消す。そしてつける
        document.getElementsByClassName('menuSelected')[0].classList.toggle('.menuSelected');
        document.getElementById(v).classList.toggle('menuSelected')
        //設定ウィンドウの中身を設定する
        document.getElementById('menuBodyHolder').innerHTML = await settingDom
    },
    //設定の保存
    saveSetting: (name, value) => { }
})

//設定を開く
ipcRenderer.on('openSetting', () => {
    document.getElementById('settingWindow').classList.toggle('settingVisible')
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
document.addEventListener('pointerlockchange', (event) => {
    console.log(event)
    ipcRenderer.send('console', event)
});

document.addEventListener('pointerlockerror', (event) => {
    console.log(event)
    ipcRenderer.send('console', event)
});

//ページがロードされた際にipcMainからいろいろ引っ張る
document.addEventListener('DOMContentLoaded', async () => {
    let settingDom = await ipcRenderer.invoke('settingDom')
    await console.log(settingDom)
})
