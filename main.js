const { BrowserWindow, dialog, session, protocol, app, Menu, webContents, shell, ipcMain } = require('electron')
const path = require('path')
const store = require('electron-store')
const config = new store()
const shortcut = require('electron-localshortcut')
const { autoUpdater } = require('electron-updater')
const fs = require('fs')
const log = require('electron-log')
const clientTool = require('./assets/js/setting')
const { request } = require('http')
const { settings } = require('cluster')
const vmcTool = new clientTool.clientTools()

//Skip checkForUpdates
Object.defineProperty(app, 'isPackaged', {
    get() {
        return true;
    }
});

//nミリ秒待つ関数
const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));//timeはミリ秒

//ウィンドウの原型を作る
let splashWindow, gameWindow, dummyWindow
let appVersion = app.getVersion()
console.log(appVersion)
//カスタムプロトコルの登録
app.on('ready', () => {
    protocol.registerFileProtocol('vmc', (request, callback) =>
        callback(decodeURI(request.url.toString().replace(/^vmc:\//, '')))
        // console.log(request.url)
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
//スプラッシュウィンドウの作成
const createSplash = () => {
    splashWindow = new BrowserWindow({
        show: false,
        width: 800,
        height: 450,
        frame: false,
        resizable: false,
        alwaysOnTop: true,
        webPreferences: {
            preload: path.join(__dirname, './assets/js/splash-preload.js')
        }
    })
    //スプラッシュの表示するよ
    splashWindow.loadFile(path.join(__dirname, './assets/html/splash.html'))
    //自動アップデート機能はここから
    const update = async () => {
        let updateCheck = null
        autoUpdater.on('checking-for-update', () => {
            splashWindow.webContents.send('status', 'Checking for updates...')
            updateCheck = setTimeout(() => {
                splashWindow.webContents.send('status', 'Update check error!')
                setTimeout(() => {
                    createGame()
                }, 1000)
            }, 15000)
        })
        autoUpdater.on('update-available', i => {
            if (updateCheck) clearTimeout(updateCheck)
            splashWindow.webContents.send(
                'status',
                `Found new version v${i.version}!`
            )
        })
        autoUpdater.on('update-not-available', () => {
            if (updateCheck) clearTimeout(updateCheck)
            splashWindow.webContents.send(
                'status',
                'You are using the latest version!'
            )
            setTimeout(() => {
                createGame()
            }, 1000)
        })
        autoUpdater.on('error', e => {
            if (updateCheck) clearTimeout(updateCheck)
            splashWindow.webContents.send('status', 'Error!' + e.name)
            setTimeout(() => {
                createGame()
            }, 1000)
        })
        autoUpdater.on('download-progress', i => {
            if (updateCheck) clearTimeout(updateCheck)
            splashWindow.webContents.send('status', 'Downloading new version...')
        })
        autoUpdater.on('update-downloaded', i => {
            if (updateCheck) clearTimeout(updateCheck)
            splashWindow.webContents.send('status', 'Update downloaded')
            setTimeout(() => {
                autoUpdater.quitAndInstall()
            }, 1000)
        })
        autoUpdater.autoDownload = 'download'
        autoUpdater.allowPrerelease = false
        autoUpdater.checkForUpdates()
    }
    //アップデーターが動くよ
    splashWindow.webContents.on('did-finish-load', () => {
        splashWindow.webContents.send('ver', appVersion)
        splashWindow.show()
        update()
    })
}

//ゲームウィンドウの作成
const createGame = () => {
    gameWindow = new BrowserWindow({
        show: false,
        width: config.get('windowWidth') || 800,
        height: config.get('windowHeight') || 600,
        fullscreen: config.get('fullscreen') !== null ? config.get('fullscreen') : config.get('fullscreen') || true,
        webPreferences: {
            preload: path.join(__dirname, './assets/js/game-preload.js'),
            contextIsolation: true
        }
    })
    //フォーカスはずし用のウィンドウを作成
    dummyWindow = new BrowserWindow({ parent: gameWindow, show: false, width: 0, height: 0, frame: false, transparent: true });
    gameWindow.setPosition(config.get('windowX') || 0, config.get('windowY') || 0);
    // ゲームをロード
    gameWindow.loadURL('https://voxiom.io/');
    //メニュー非表示
    Menu.setApplicationMenu(null)
    //ロードが終わったらスプラッシュウィンドウを破壊してゲームを表示
    gameWindow.webContents.on('did-finish-load', () => {
        splashWindow.destroy();
        gameWindow.show();
    })
    //ショートカットキーの生成
    shortcut.register(gameWindow, 'Esc', async () => {
        gameWindow.webContents.send('escape')
        await dummyWindow.show();
        await dummyWindow.focus();
        await dummyWindow.hide();
        await sleep(100);
        await gameWindow.focus()
    })
    shortcut.register(gameWindow, 'F1', async () => {
        await dummyWindow.show();
        await dummyWindow.focus();
        await dummyWindow.hide();
        await gameWindow.focus()
        await gameWindow.webContents.send('openSetting')
    })
    shortcut.register(gameWindow, 'F11', () => {
        gameWindow.isFullScreen() ? gameWindow.setFullScreen(false) : gameWindow.setFullScreen(true)
    })
    shortcut.register(gameWindow, 'F5', () => {
        gameWindow.webContents.send('reload')
    })
    shortcut.register(gameWindow, 'F12', () => {
        gameWindow.webContents.openDevTools()
    })
    // ゲームウィンドウが破壊される前にサイズなどを保存
    gameWindow.on('close', () => {
        !gameWindow.isDestroyed() ? storeWindowPos() : '';
        dummyWindow.destroy();
    })
}

//ウィンドウの位置やサイズを保存する
const storeWindowPos = () => {
    let { x, y, width, height } = gameWindow.getBounds()
    console.log({ x, y, width, height })
    gameWindow.isFullScreen() ? '' : config.set('windowHeight', height || 1080);
    gameWindow.isFullScreen() ? '' : config.set('windowWidth', width || 1920);
    gameWindow.isFullScreen() ? '' : config.set('windowHeight', height || 1080); config.set('windowX', x || 0)
    gameWindow.isFullScreen() ? '' : config.set('windowY', y || 0)
    config.set('fullscreen', gameWindow.isFullScreen())
}

//設定用DOMを送信する
ipcMain.handle('settingDom', async () => {
    let dom = await vmcTool.settingWindow()
    return await dom
})

//設定のタブを変更する
ipcMain.handle('settingTabChange', async (e, name) => {
    let dom = await vmcTool.settingDom(name)
    return await dom
})

//設定の値を保存する
ipcMain.on('saveSettingValue', (e, n, v) => {
    config.set(n, v)
})

// 設定を個別で取得する
ipcMain.handle('getSetting', async (e, value) => {
    return await config.get(value)
})
//path.join + main.jsからの相対パスを返す
ipcMain.handle('dirName', (e, v) => {
    return path.join(__dirname, v)
})
//ローカルファイルを開いて、pathをreturnする
ipcMain.handle('openFile', (e, v) => {
    dialog
})
//Chromium flagの設定
vmcTool.flagSwitch()

//アプリの準備ができたらスプラッシュを起動
app.on('ready', () => {
    createSplash()
})

//アプリを閉じるときの挙動を設定
app.on('quit', () => {
    gameWindow.destroy()
    dummyWindow.destroy()
})