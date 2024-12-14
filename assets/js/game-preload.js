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
        console.log(name)
        console.log(value)
        ipcRenderer.send('saveSettingValue', name, value)
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
