const { ipcRenderer } = require('electron')


ipcRenderer.on('status', (e, v) => {
    document.getElementById("stat").textContent = v
})
ipcRenderer.on('ver', (e, v) => {
    document.getElementById("ver").textContent = v
})