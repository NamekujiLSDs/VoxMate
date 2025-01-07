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
        console.log(id);

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
                    document.getElementById('crosshair').setAttribute('src', 'vmc://' + crosshairPath);
                } else if (value === 'list') {
                    let crosshairPath = await ipcRenderer.invoke('getSetting', 'localCrosshairList');
                    crosshairPath = await ipcRenderer.invoke('localCrosshairFullPath', crosshairPath);
                    document.getElementById('crosshairPreviewImage').setAttribute('src', 'vmc://' + crosshairPath);
                    document.getElementById('crosshair').setAttribute('src', 'vmc://' + crosshairPath);
                };
                break;
            case 'localCrosshairList':
                let filePath = await ipcRenderer.invoke('localCrosshairFullPath', value);
                document.getElementById('crosshairPreviewImage').setAttribute('src', 'vmc://' + filePath);
                document.getElementById('crosshair').setAttribute('src', 'vmc://' + filePath);
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
    customCssChange: async (id, value) => {
        let enable = await ipcRenderer.invoke('getSetting', 'enableCustomCss') || true;
        let cssType = await ipcRenderer.invoke('getSetting', 'cssType') || "url";
        switch (id) {
            case 'enableCustomCss':
                switch (value) {
                    case true:
                        switch (cssType) {
                            case 'url':
                                let cssUrl = await ipcRenderer.invoke('getSetting', 'cssUrl');
                                document.getElementById('customCss').href = cssUrl;
                                break
                            case 'local':
                                let cssPath = await ipcRenderer.invoke('getSetting', 'cssPath');
                                document.getElementById('customCss').href = "vmc://" + cssPath;
                                break;
                            case 'list':
                                let cssListPath = await ipcRenderer.invoke('getSetting', 'localCssList');
                                cssListPath = await ipcRenderer.invoke('localCssFullPath', cssListPath)
                                enable ? document.getElementById('customCss').href = "vmc://" + cssListPath : "";
                                break
                        }
                        break
                    case false:
                        document.getElementById('customCss').href = "";
                        break;
                }
                break;
            case 'cssType':
                switch (value) {
                    case 'url':
                        let cssUrl = await ipcRenderer.invoke('getSetting', 'cssUrl');
                        enable ? document.getElementById('customCss').href = cssUrl : "";
                        break
                    case 'local':
                        let cssPath = await ipcRenderer.invoke('getSetting', 'cssPath');
                        enable ? document.getElementById('customCss').href = "vmc://" + cssPath : "";
                        break;
                    case 'list':
                        let cssListPath = await ipcRenderer.invoke('getSetting', 'localCssList');
                        cssListPath = await ipcRenderer.invoke('localCssFullPath', cssListPath)
                        enable ? document.getElementById('customCss').href = "vmc://" + cssListPath : "";
                        break
                }
                break;
            case 'cssUrl':
                cssType === "url" && enable ? document.getElementById("customCss").href = value : "";
                break
            case 'localCssList':
                let listPath = await ipcRenderer.invoke('getSetting', 'localCssList')
                listPath = await ipcRenderer.invoke('localCssFullPath', listPath)
                cssType === "list" && enable ? document.getElementById("customCss").href = "vmc://" + listPath : "";
                break;
        }
    },
    openSwapperFolder: () => {
        ipcRenderer.send("openExplorer", "swapper")
    },
    openLocal: (name) => {
        ipcRenderer.send('openFile', name)
    },
    openTutorial: (val) => {
        ipcRenderer.send("openTutorial", val)
    },
    clearCache: () => {
        ipcRenderer.send('clear-cache')
    },
    resetAllData: () => {
        ipcRenderer.send('clear-all-data-and-restart')
    },
    importSetting: () => {
        ipcRenderer.send('importSetting')
    },
    exportSetting: () => {
        let set = localStorage.getItem("persist:root")
        console.log(set)
        ipcRenderer.send('exportSetting', set)
    },
    joinGame: async () => {
        let v = document.getElementById('joinGame').value
        console.log(v)
        console.log(new URL(v).hostname)
        let hostName = new URL(v).hostname
        if (hostName === 'voxiom.io') {
            location.href = v
            location.reload()
        } else if (v.startsWith('#')) {
            v = v.slice(1)
            console.log(v)
            fetch(`https://voxiom.io/find?region=3&game_mode=ctg&version=135&tag=${v}`, {
                "method": "GET",
            })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.json(); // JSONレスポンスをパース
                })
                .then(data => {
                    if (data.success && data.tag === v) {
                        location.href = "https://voxiom.io/#" + v
                        location.reload()
                    }
                })
                .catch(error => {
                    console.error('Fetch error:', error);
                });
        }
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
ipcRenderer.on('localPath', async (e, id, val, fileName) => {
    let type
    switch (id) {
        case 'crosshairPath':
            type = await ipcRenderer.invoke('getSetting', 'crosshairType');
            type === 'local' ? document.getElementById('crosshairPreviewImage').setAttribute('src', 'vmc://' + val) : '';
            type === 'local' ? document.getElementById('crosshair').setAttribute('src', 'vmc://' + val) : '';
            break;
        case 'cssPath':
            type = await ipcRenderer.invoke('getSetting', 'cssType');
            type === 'local' ? document.getElementById('customCss').href = 'vmc://' + val : "";
            document.getElementById('cssName').innerText = fileName
            break;
    }
})

// ページがロードされた際にipcMainからいろいろ引っ張る
document.addEventListener('DOMContentLoaded', async () => {
    let settingStyle = await ipcRenderer.invoke('loadSettingStylesheets')
    document.body.insertAdjacentHTML('afterbegin', settingStyle)
    let crosshair = await ipcRenderer.invoke('crosshairDom')
    document.getElementById('app').insertAdjacentHTML('afterbegin', crosshair)
    refreshCrosshairCss()
    let cssDom = await ipcRenderer.invoke('cssDom')
    document.body.insertAdjacentHTML('afterbegin', cssDom[0])
    let ver = await ipcRenderer.invoke('version')
    document.body.insertAdjacentHTML('afterbegin', `<div id="version" style="position:fixed;right:0;bottom:0;font-size:12px;color:white;text-shadow:0 0 2px black;z-index:1">VoxMate - ${ver}</div>`)
})

ipcRenderer.on('importSettingValue', (e, val) => {
    console.log(e)
    console.log(val)
}) 