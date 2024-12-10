const { electron, BrowserWindow, ipcMain, protocol, app, Menu, webContents } = require('electron')
const path = require('path')
//Skip checkForUpdates...の問題を修正するためのもの
Object.defineProperty(app, 'isPackaged', {
    get() {
        return true;
    }
});

//カスタムプロトコルの登録
app.on('ready', () => {
    protocol.registerFileProtocol('vmc', (request, callback) =>
        callback(decodeURI(request.url.replace(/^vmc:\//, '')))
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

//ウィンドウの原型を作る
let splashWindow, gameWindow, appVersion = app.getVersion()

const createSplash = () => {
    splashWindow = new BrowserWindow({})
    splashWindow.loadFile(path.join(__dirname), './assets/html/splash.html')
}

app.on('ready', () => {
    createSplash()
})