const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const crypto = require('crypto');
const { app } = require('electron');
const { config } = require('../utils/config');

const parseUserscriptHeader = (content, filename) => {
    const meta = {
        filename,
        name: filename,
        version: '1.0',
        description: 'No description provided.',
        author: 'Unknown',
        requires: [],
        runAt: 'document-idle',
        matches: []
    };
    const headerMatch = content.match(/\/\/\s*==UserScript==([\s\S]*?)\/\/\s*==\/UserScript==/);
    if (!headerMatch) return meta;

    const lines = headerMatch[1].split('\n');
    for (const line of lines) {
        const match = line.match(/\/\/\s*@([\w-]+)\s+(.+)/);
        if (match) {
            const [, key, val] = match;
            const cleanKey = key.trim().toLowerCase();
            const cleanVal = val.trim();
            if (cleanKey === 'name') meta.name = cleanVal;
            else if (cleanKey === 'version') meta.version = cleanVal;
            else if (cleanKey === 'description') meta.description = cleanVal;
            else if (cleanKey === 'author') meta.author = cleanVal;
            else if (cleanKey === 'require') meta.requires.push(cleanVal);
            else if (cleanKey === 'run-at') meta.runAt = cleanVal;
            else if (cleanKey === 'match') meta.matches.push(cleanVal);
        }
    }
    return meta;
};

const getCachePath = (url, cacheDir) => {
    const hash = crypto.createHash('md5').update(url).digest('hex');
    return path.join(cacheDir, `${hash}.js`);
};

const fetchRequireScript = (url, cacheDir) => {
    return new Promise((resolve) => {
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, { recursive: true });
        }
        const cacheFile = getCachePath(url, cacheDir);
        if (fs.existsSync(cacheFile)) {
            try {
                const cachedContent = fs.readFileSync(cacheFile, 'utf8');
                return resolve(cachedContent);
            } catch (e) {}
        }

        const client = url.startsWith('https') ? https : http;
        const req = client.get(url, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                res.resume();
                // Location は相対パスの場合があるため元URL基準で解決する
                return fetchRequireScript(new URL(res.headers.location, url).href, cacheDir).then(resolve);
            }
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200 && data) {
                    try {
                        fs.writeFileSync(cacheFile, data, 'utf8');
                    } catch (e) {}
                }
                resolve(data);
            });
        });
        // 応答しないサーバーで全ユーザースクリプトの起動が止まらないようタイムアウトを設ける
        req.setTimeout(10000, () => req.destroy(new Error('timeout')));
        req.on('error', (err) => {
            console.error(`Failed to fetch @require script (${url}):`, err);
            resolve('');
        });
    });
};

// @match パターン (例: https://voxiom.io/*, *://*/*) を正規表現にして URL と照合する。
// @match が無いスクリプトは従来どおり全ページ対象。
const matchesUrl = (meta, url) => {
    if (!meta.matches.length) return true;
    return meta.matches.some(p => {
        // 正規表現の特殊文字をエスケープしてから、ワイルドカード * を .* に置き換える
        const re = new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*') + '$');
        return re.test(url);
    });
};

const getScriptFolder = () => path.join(app.getPath('documents'), './vmc-swap/userscript');

// 有効なユーザースクリプトの (file, content, meta) 一覧
const readEnabledScripts = () => {
    const folder = getScriptFolder();
    if (!config.get('enableUserScripts', true) || !fs.existsSync(folder)) return [];
    const list = [];
    for (const file of fs.readdirSync(folder).filter(f => f.endsWith('.user.js'))) {
        if (!config.get(`userscript_${file}`, true)) continue;
        try {
            const content = fs.readFileSync(path.join(folder, file), 'utf8');
            if (content) list.push({ file, content, meta: parseUserscriptHeader(content, file) });
        } catch (err) {
            console.error(`Error reading userscript (${file}):`, err);
        }
    }
    return list;
};

// ページのスクリプトより前に注入済みのファイル名 (webContents ごと、ページ読込ごとに作り直す)
const injectedAtStart = new WeakMap();

// @run-at document-start のスクリプトを、プリロードからページ読込前に同期注入するために返す。
// 通常の注入(did-finish-load)ではゲームが先に初期化済みで、Object.prototype / WebGL フック系の
// スクリプト(skycolor 等)が間に合わないため。@require は同期で取れるキャッシュ済みのものだけ使い、
// 未キャッシュのスクリプトは従来どおり did-finish-load で読み込む。
const getDocumentStartScripts = (webContents, url) => {
    const cacheDir = path.join(getScriptFolder(), '.cache');
    const scripts = [];
    const injected = new Set();
    for (const { file, content, meta } of readEnabledScripts()) {
        if (meta.runAt !== 'document-start' || !matchesUrl(meta, url)) continue;
        let code = '';
        let ready = true;
        for (const reqUrl of meta.requires) {
            const cacheFile = getCachePath(reqUrl, cacheDir);
            if (!fs.existsSync(cacheFile)) { ready = false; break; }
            code += fs.readFileSync(cacheFile, 'utf8') + '\n;\n';
        }
        if (!ready) continue;
        scripts.push({ file, code: code + content });
        injected.add(file);
    }
    injectedAtStart.set(webContents, injected);
    return scripts;
};

// 起動時に @require をキャッシュへ先読みする (初回起動でも次回以降 document-start で注入できるように)
const prefetchRequires = async () => {
    try {
        const cacheDir = path.join(getScriptFolder(), '.cache');
        for (const { meta } of readEnabledScripts()) {
            for (const reqUrl of meta.requires) await fetchRequireScript(reqUrl, cacheDir);
        }
    } catch (err) {
        console.error('Error prefetching userscript requires:', err);
    }
};

const getUserScriptsList = () => {
    try {
        const scriptFolderPath = path.join(app.getPath('documents'), './vmc-swap/userscript');
        if (!fs.existsSync(scriptFolderPath)) return [];

        const files = fs.readdirSync(scriptFolderPath);
        const userJsFiles = files.filter(file => file.endsWith('.user.js'));

        const list = [];
        for (const file of userJsFiles) {
            const filePath = path.join(scriptFolderPath, file);
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const meta = parseUserscriptHeader(content, file);
                meta.enabled = config.get(`userscript_${file}`, true);
                list.push(meta);
            } catch (err) {
                console.error(`Error reading userscript (${file}):`, err);
            }
        }
        return list;
    } catch (error) {
        console.error('Error fetching userscripts list:', error);
        return [];
    }
};

// document-start で注入しなかったスクリプトを、ページ読込完了後に実行する (従来のタイミング)
const loadUserScripts = async (webContents) => {
    try {
        const cacheDir = path.join(getScriptFolder(), '.cache');
        const alreadyInjected = injectedAtStart.get(webContents) || new Set();
        const pageUrl = webContents.getURL();

        for (const { file, content, meta } of readEnabledScripts()) {
            // document-start で注入済み / @match に合わないスクリプトは実行しない
            if (alreadyInjected.has(file) || !matchesUrl(meta, pageUrl)) continue;

            let fullScript = '';
            for (const reqUrl of meta.requires) {
                const reqCode = await fetchRequireScript(reqUrl, cacheDir);
                if (reqCode) fullScript += reqCode + '\n;\n';
            }

            webContents.executeJavaScript(fullScript + content)
                .catch(error => console.error(`Error executing userscript (${file}):`, error));
        }
    } catch (error) {
        console.error('Error loading userscripts:', error);
    }
};

module.exports = {
    getUserScriptsList,
    loadUserScripts,
    getDocumentStartScripts,
    prefetchRequires
};
