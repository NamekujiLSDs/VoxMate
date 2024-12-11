
const { contextBridge, ipcRenderer, ipcMain } = require('electron')
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
document.addEventListener("pointerlockchange", (event) => {
    console.log(event)
    ipcRenderer.send('console', event)
});

document.addEventListener("pointerlockerror", (event) => {
    console.log(event)
    ipcRenderer.send('console', event)
});

//ページがロードされた際にipcMainからいろいろ引っ張る
document.addEventListener('DOMContentLoaded', async () => {
    let settingDom = await ipcRenderer.invoke("settingDom")
    await console.log(settingDom)
})
