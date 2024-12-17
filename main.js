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
const { exec } = require('child_process')

const defaultSwapList = require('./assets/json/swapper-default.json')
const defaultBlockList = require('./assets/json/adblock-default.json').urls

//Skip checkForUpdates
Object.defineProperty(app, 'isPackaged', {
    get() {
        return true;
    }
});

// [N]ms秒待つ関数
const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

//ウィンドウの原型を作る
let splashWindow, gameWindow, dummyWindow
let appVersion = app.getVersion()
//カスタムプロトコルの登録
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
        width: config.get('windowWidth', 1536),
        height: config.get('windowHeight', 864),
        fullscreen: config.get('fullscreen', true),
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
        config.get('maxsize') ? gameWindow.maximize() : '';
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
    //新しいwindowで開かせない
    gameWindow.webContents.on('new-window', (e, url) => {
        switch (url) {
            case 'https://voxiom.io/auth/discord':
                gameWindow.webContents.loadURL(url);
                e.preventDefault();
                break;
            case 'https://voxiom.io/auth/google':
                gameWindow.webContents.loadURL(url);
                e.preventDefault();
                break;
            case 'https://voxiom.io/auth/facebook':
                gameWindow.webContents.loadURL(url);
                e.preventDefault();
                break;
            default:
                if (url.startsWith("https://www.youtube.com/")
                    || url.startsWith("https://www.twitch.tv/")
                    || url.startsWith("https://discord.gg/")
                    || url.startsWith("https://x.com/")
                    || url.startsWith("https://twitter.com/")
                    || url.startsWith("https://twitter.com/")
                    || url.startsWith("https://reddit.com/")
                    || url.startsWith("https://voxiom.io/assets/")
                    || url.startsWith("https://cuberealm.io/")) {
                    shell.openExternal(url)
                    e.preventDefault()
                    break
                }
        }
    })

    //ちょっと制限
    gameWindow.webContents.on('will-navigate', (e, url) => {
        if (url.startsWith("https://voxiom.io/assets/")) {
            shell.openExternal(url)
            e.preventDefault()
        }
    });

}

//ウィンドウの位置やサイズを保存する
const storeWindowPos = () => {
    let { x, y, width, height } = gameWindow.getBounds()
    gameWindow.isFullScreen() ? '' : config.set('windowHeight', height || 1080);
    gameWindow.isFullScreen() ? '' : config.set('windowWidth', width || 1920);
    gameWindow.isFullScreen() ? '' : config.set('windowHeight', height || 1080); config.set('windowX', x || 0);
    gameWindow.isFullScreen() ? '' : config.set('windowY', y || 0);
    config.set('fullscreen', gameWindow.isFullScreen())
    config.set('maxsize', gameWindow.isMaximized())
}

//設定用DOMを送信する
ipcMain.handle('settingDom', async () => {
    let dom = await vmcTool.settingWindow()
    return await dom
})

//設定用CSSを送信する
ipcMain.handle('loadSettingStylesheets', () => {
    return vmcTool.loadSettingStylesheets()
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
ipcMain.on('openFile', (e, v) => {
    switch (v) {
        case 'crosshairPath':
            dialog.showOpenDialog(
                gameWindow,
                {
                    properties: ['openFile'],
                    filters: [{
                        name: 'crosshair image',
                        extensions: ['png', 'apng', 'gif']
                    }
                    ]
                }
            ).then(result => {
                if (!result.canceled) {
                    gameWindow.webContents.send('localPath', v, result.filePaths[0])
                    config.set(v, result.filePaths[0])
                }
            })
            break
        case 'cssPath':
            dialog.showOpenDialog(
                gameWindow,
                {
                    properties: ['openFile'],
                    filters: [{
                        name: 'cascade style sheet',
                        extensions: ['css'],
                    }
                    ]
                }
            ).then(result => {
                if (!result.canceled) {
                    gameWindow.webContents.send('localPath', v, result.filePaths[0], path.basename(result.filePaths[0]))
                    config.set(v, result.filePaths[0])
                }
            })
            break;
    }

})

//crosshair dom
ipcMain.handle('crosshairDom', () => {
    return vmcTool.crosshairDom()
})

//custom css dom
ipcMain.handle('cssDom', () => {
    let cssDom = vmcTool.CustomCssDom()
    return cssDom
})

//フォルダを開く
ipcMain.on("openExplorer", () => {
    let swapFolder = path.join(app.getPath('documents'), './vmc-swap')
    exec(`start ${swapFolder}`, (err, stdout, stderr) => {
        if (err) {
            return;
        }
        if (stderr) {
            return;
        }
    })
})


//チュートリアルを開く
ipcMain.on("openTutorial", (e, val) => {
    switch (val) {
        case 'resourceSwapper':
            shell.openExternal("https://namekujilsds.github.io/VMC/tutorial#swapper")
            break;
        case 'adBlock':
            shell.openExternal("https://namekujilsds.github.io/VMC/tutorial#adblock")
            break;
    }
})

//Chromium flagの設定
vmcTool.flagSwitch()

// リソーススワッパー & Adblocker
app.on('ready', async () => {
    let swapperFolder = path.join(app.getPath("documents"), './vmc-swap')
    let userSwapList
    let userBlockList
    let userSwapperExist = fs.existsSync(path.join(app.getPath('documents'), './vmc-swap/swapper-user.json'))
    if (userSwapperExist) {
        userSwapList = JSON.parse(fs.readFileSync(path.join(app.getPath('documents'), './vmc-swap/swapper-user.json')))
    } else {
        userSwapList = null
    }
    let userBlockExist = fs.existsSync(path.join(app.getPath('documents'), './vmc-swap/adblock-user.json'))
    if (userBlockExist) {
        userBlockList = await JSON.parse(fs.readFileSync(path.join(app.getPath('documents'), './vmc-swap/adblock-user.json')))
        userBlockList = userBlockList.urls
    } else {
        userBlockList = null
    }
    let swapEnable = config.get("enableResourceSwapper", true)
    let swapDef = config.get('useDefSwapList', true)
    let swapUser = config.get('useUserSwapList', true)
    let blockEnable = config.get('enableAdBlocker', true)
    let blockDef = config.get('useDefAdBlockList', true)
    let blockUser = config.get('useUserAdBlockList', true)

    const urls = defaultBlockList

    session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
        const url = details.url
        const swapper = async (url) => {
            if (swapEnable) {
                if (swapDef && swapUser) {
                    if (userSwapperExist !== null && userSwapperExist !== undefined && userSwapperExist) {
                        if (userSwapList[url] !== null && userSwapList[url] !== undefined) {
                            let fileExists = fs.existsSync(path.join(swapperFolder, userSwapList[url]))
                            if (fileExists) {
                                callback({ redirectURL: "vmc://" + path.join(swapperFolder, userSwapList[url]) })
                            } else if (!fileExists) {
                                if (defaultSwapList[url] !== null && defaultSwapList[url] !== undefined) {
                                    let fileExists = fs.existsSync(path.join(swapperFolder, defaultSwapList[url]))
                                    if (fileExists) {
                                        callback({ redirectURL: "vmc://" + path.join(swapperFolder, defaultSwapList[url]) })
                                    } else {
                                        callback({})
                                    }
                                }
                            }
                        } else if (defaultSwapList[url] !== null && defaultSwapList[url] !== undefined) {
                            let fileExists = fs.existsSync(path.join(swapperFolder, defaultSwapList[url]))
                            if (fileExists) {
                                callback({ redirectURL: "vmc://" + path.join(swapperFolder, defaultSwapList[url]) })
                            } else {
                                callback({})
                            }
                        } else {
                            callback({})
                        }
                    } else if (defaultSwapList[url] !== null && defaultSwapList[url] !== undefined) {
                        let fileExists = fs.existsSync(path.join(swapperFolder, defaultSwapList[url]))
                        if (fileExists) {
                            callback({ redirectURL: "vmc://" + path.join(swapperFolder, defaultSwapList[url]) })
                        } else {
                            callback({})
                        }
                    } else {
                        callback({})
                    }
                } else if (swapDef) {
                    if (defaultSwapList[url] !== null && defaultSwapList[url] !== undefined) {
                        let fileExists = fs.existsSync(path.join(swapperFolder, defaultSwapList[url]))
                        if (fileExists) {
                            callback({ redirectURL: "vmc://" + path.join(swapperFolder, defaultSwapList[url]) })
                        } else {
                            callback({})
                        }
                    }
                } else if (swapUser) {
                    if (userSwapperExist !== null && userSwapperExist !== undefined && userSwapperExist) {
                        if (userSwapList[url] !== null && userSwapList[url] !== undefined) {
                            let fileExists = fs.existsSync(path.join(swapperFolder, userSwapList[url]))
                            if (fileExists) {
                                callback({ redirectURL: "vmc://" + path.join(swapperFolder, userSwapList[url]) })
                            } else {
                                callback({})
                            }
                        }
                    } else {
                        callback({})
                    }
                }
            } else if (!swapEnable) {
                callback({})
            } else {
                callback({})
            }
        }
        if (blockEnable) {
            if (blockDef && blockUser) {
                if (userBlockList !== null && userBlockList !== undefined && userBlockExist) {
                    const userShouldBlock = userBlockList.some(domain => url.includes(domain))
                    if (userShouldBlock) {
                        callback({ cancel: true })
                    } else {
                        if (defaultBlockList !== null && defaultBlockList !== undefined) {
                            const defShouldBlock = urls.some(domain => url.includes(domain))
                            if (defShouldBlock) {
                                callback({ cancel: true })
                            } else {
                                swapper(url)
                            }
                        }
                    }
                } else if (defaultBlockList !== null && defaultBlockList !== undefined) {
                    const defShouldBlock = urls.some(domain => url.includes(domain))
                    if (defShouldBlock) {
                        callback({ cancel: true })
                    } else {
                        swapper(url)
                    }
                } else {
                    swapper(url)
                }
            }
            else if (blockDef) {
                if (defaultBlockList !== null && defaultBlockList !== undefined) {
                    const defShouldBlock = defUrls.some(domain => url.includes(domain))
                    if (defShouldBlock) {
                        callback({ cancel: true })
                    } else {
                        swapper(url)
                    }
                }
            }
            else if (blockUser) {
                if (userBlockList !== null && userBlockList !== undefined && userBlockExist) {
                    const userShouldBlock = userBlockList.some(domain => url.includes(domain))
                    if (userShouldBlock) {
                        callback({ cancel: true })
                    } else {
                        swapper(url)
                    }
                } else {
                    swapper(url)
                }
            }
        } else {
            swapper(url)
        }

    });
})
//キャッシュの削除
ipcMain.on('clear-cache', async () => {
    const response = await dialog.showMessageBox(gameWindow, {
        type: 'question',
        buttons: ['OK', 'Cancel'],
        defaultId: 1,
        message: `Do you really want to delete the cache?\nAfter deletion, the client will restart.`
    });
    if (response.response === 0) { // OKが選ばれた場合
        // キャッシュを削除
        session.defaultSession.clearCache().then(() => {
            // アプリを再起動
            app.relaunch();
            app.quit();
        }).catch(err => {
        });
    }
});

//データの全削除
ipcMain.on('clear-all-data-and-restart', async () => {
    const response = await dialog.showMessageBox({
        type: 'question',
        buttons: ['OK', 'Cancel'],
        defaultId: 1,
        message: 'Delete all application data.\nAre you sure?'
    });
    if (response.response === 0) { // OKが選ばれた場合
        try {
            // キャッシュを削除
            await session.defaultSession.clearCache();
            // ローカルストレージやIndexedDBのデータを削除
            await session.defaultSession.clearStorageData();
            // セッションのクッキーを削除
            await session.defaultSession.clearAuthCache();
            // アプリを再起動
            app.relaunch();
            app.quit();
        } catch (err) {
        }
    }
});

//アプリの準備ができたらスプラッシュを起動
app.on('ready', () => {
    vmcTool.createSwapFolder()
    vmcTool.isFirstTime()
    createSplash()
})

//アプリを閉じるときの挙動を設定
app.on('quit', () => {
    gameWindow.destroy()
    dummyWindow.destroy()
})