/**
 * ============================================================================================
 * WebSocket Packet Parser & Game Stats HUD Logger Extension
 * ============================================================================================
 * 
 * ■ 機能概要:
 *   - 0キーのデバッグGUIを表示しなくても裏でゲーム内部の精密プレイヤー座標 (XYZ), Yaw/Pitch, FPS, Ping 等を全自動フック。
 *   - Voxiom.io 等の WebSocket 通信パケットもキャプチャ可能。
 *   - すべての情報を 1: num, 2: num, 3: num... の連番形式で画面左端中央のHUDに表示。
 *   - TXTダウンロード保存 / 全データコピー / ショートカットキー ([ ] ], [P], [S], [H]) 対応。
 * ============================================================================================
 */

console.log("[WS Packet Logger] ロード完了 - ゲーム内部フック & WebSocketキャプチャ開始");

// グローバル状態管理
window.wsLoggerState = {
    isPaused: false,
    sourceMode: 'GAME_STATS', // 'GAME_STATS' (ゲーム内部直フック座標) または 'WS_RECV' (WebSocket通信データ)
    gameStatsValues: [],
    gameStatsCaptured: false,
    lastParsedValues: [],
    packetCount: 0,
    currentDirection: 'RECV',
    logHistory: []
};

/**
 * --------------------------------------------------------------------------------------------
 * 0. ゲーム内部デバッグクラスの全自動フック (GUI非表示のまま座標・FPS・Ping等を完全横取り)
 * --------------------------------------------------------------------------------------------
 */
Object.defineProperty(Object.prototype, 'pVX', {
    get() {
        return this._pVX;
    },
    set(fn) {
        this._pVX = function() {
            // 元の 0キーのデバッグ画面 (pVZ) は非表示のまま隠す
            if (this.pVZ && this.pVZ.style) {
                this.pVZ.style.display = 'none';
            }

            if (this.pVE) {
                // 1: Pos X, 2: Pos Y, 3: Pos Z, 4: Block X ... の順番で整形
                const values = [
                    this.pVE ? (Number.isInteger(this.pVE.pdd) ? this.pVE.pdd : parseFloat(this.pVE.pdd.toFixed(3))) : 0, // 1: Pos X
                    this.pVE ? (Number.isInteger(this.pVE.pdp) ? this.pVE.pdp : parseFloat(this.pVE.pdp.toFixed(3))) : 0, // 2: Pos Y
                    this.pVE ? (Number.isInteger(this.pVE.pdS) ? this.pVE.pdS : parseFloat(this.pVE.pdS.toFixed(3))) : 0, // 3: Pos Z
                    this.pVi ? this.pVi.pdd : 0, // 4: Block X
                    this.pVi ? this.pVi.pdp : 0, // 5: Block Y
                    this.pVi ? this.pVi.pdS : 0, // 6: Block Z
                    this.pVB ? this.pVB.pdd : 0, // 7: Chunk X
                    this.pVB ? this.pVB.pdp : 0, // 8: Chunk Y
                    this.pVB ? this.pVB.pdS : 0, // 9: Chunk Z
                    this.pVF ? this.pVF.pdd : 0, // 10: Velocity X
                    this.pVF ? this.pVF.pdp : 0, // 11: Velocity Y
                    this.pVF ? this.pVF.pdS : 0, // 12: Velocity Z
                    typeof this.pVh === 'number' ? parseFloat(this.pVh.toFixed(3)) : 0, // 13: Yaw
                    typeof this.pVD === 'number' ? parseFloat(this.pVD.toFixed(3)) : 0, // 14: Pitch
                    this.pVK || 0, // 15: Total Chunks Loaded
                    typeof this.pVM === 'number' ? parseFloat(this.pVM.toFixed(2)) : 0, // 16: FPS
                    this.pVG || 0, // 17: Latency ms
                    typeof this.pVP === 'number' ? parseFloat(this.pVP.toFixed(2)) : 0, // 18: Download bps
                    typeof this.pVI === 'number' ? parseFloat(this.pVI.toFixed(2)) : 0  // 19: Upload bps
                ];

                window.wsLoggerState.gameStatsValues = values;
                window.wsLoggerState.gameStatsCaptured = true;

                if (window.wsLoggerState.sourceMode === 'GAME_STATS' && !window.wsLoggerState.isPaused) {
                    window.wsLoggerState.packetCount++;
                    window.wsLoggerState.lastParsedValues = values;
                    const now = performance.now();
                    if (!window._lastWsHudRenderTime || now - window._lastWsHudRenderTime >= 750) {
                        window._lastWsHudRenderTime = now;
                        renderHUD(values);
                    }
                }
            }

            return fn.apply(this, arguments);
        };
    },
    configurable: true
});

// GUI非表示状態でもゲーム内部で毎フレームデータ計算を行わせるフック
Object.defineProperty(Object.prototype, 'pVr', {
    get() {
        return true; // 常にデータ計算・更新を維持
    },
    set(val) {
        this._pVr = val;
    },
    configurable: true
});

/**
 * --------------------------------------------------------------------------------------------
 * 1. Msgpack 解読デコーダー (軽量・完全実装)
 * --------------------------------------------------------------------------------------------
 */
function decodeMsgpack(buffer) {
    try {
        const u8 = new Uint8Array(buffer.buffer || buffer, buffer.byteOffset || 0, buffer.byteLength);
        const view = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
        let offset = 0;

        function read() {
            if (offset >= view.byteLength) return null;
            const byte = view.getUint8(offset++);

            if (byte <= 0x7f) return byte;
            if ((byte & 0xf0) === 0x80) return readMap(byte & 0x0f);
            if ((byte & 0xf0) === 0x90) return readArray(byte & 0x0f);
            if ((byte & 0xe0) === 0xa0) return readStr(byte & 0x1f);
            if (byte >= 0xe0) return byte - 0x100;

            switch (byte) {
                case 0xc0: return null;
                case 0xc2: return false;
                case 0xc3: return true;
                case 0xca: { const v = view.getFloat32(offset); offset += 4; return v; }
                case 0xcb: { const v = view.getFloat64(offset); offset += 8; return v; }
                case 0xcc: { const v = view.getUint8(offset); offset += 1; return v; }
                case 0xcd: { const v = view.getUint16(offset); offset += 2; return v; }
                case 0xce: { const v = view.getUint32(offset); offset += 4; return v; }
                case 0xd0: { const v = view.getInt8(offset); offset += 1; return v; }
                case 0xd1: { const v = view.getInt16(offset); offset += 2; return v; }
                case 0xd2: { const v = view.getInt32(offset); offset += 4; return v; }
                case 0xd9: return readStr(view.getUint8(offset++));
                case 0xda: { const len = view.getUint16(offset); offset += 2; return readStr(len); }
                case 0xdb: { const len = view.getUint32(offset); offset += 4; return readStr(len); }
                case 0xdc: { const len = view.getUint16(offset); offset += 2; return readArray(len); }
                case 0xdd: { const len = view.getUint32(offset); offset += 4; return readArray(len); }
                case 0xde: { const len = view.getUint16(offset); offset += 2; return readMap(len); }
                case 0xdf: { const len = view.getUint32(offset); offset += 4; return readMap(len); }
                case 0xc4: return readBin(view.getUint8(offset++));
                case 0xc5: { const len = view.getUint16(offset); offset += 2; return readBin(len); }
                case 0xc6: { const len = view.getUint32(offset); offset += 4; return readBin(len); }
            }
            return null;
        }

        function readArray(len) {
            const arr = [];
            for (let i = 0; i < len; i++) arr.push(read());
            return arr;
        }

        function readMap(len) {
            const map = {};
            for (let i = 0; i < len; i++) {
                const k = read();
                const v = read();
                if (k !== null && k !== undefined) map[String(k)] = v;
            }
            return map;
        }

        function readStr(len) {
            let str = "";
            for (let i = 0; i < len; i++) str += String.fromCharCode(view.getUint8(offset++));
            return str;
        }

        function readBin(len) {
            const arr = [];
            for (let i = 0; i < len; i++) arr.push(view.getUint8(offset++));
            return arr;
        }

        return read();
    } catch (e) {
        return null;
    }
}

/**
 * --------------------------------------------------------------------------------------------
 * 2. パース結果をフラットな値の配列（1: val, 2: val...）に再帰変換
 * --------------------------------------------------------------------------------------------
 */
function flattenValues(obj, list = []) {
    if (obj === null || obj === undefined) return list;

    if (typeof obj === 'number') {
        const formatted = Number.isInteger(obj) ? obj : parseFloat(obj.toFixed(3));
        list.push(formatted);
        return list;
    }

    if (typeof obj === 'boolean' || typeof obj === 'string') {
        list.push(obj);
        return list;
    }

    if (Array.isArray(obj)) {
        for (const item of obj) {
            flattenValues(item, list);
        }
        return list;
    }

    if (typeof obj === 'object') {
        for (const key of Object.keys(obj)) {
            flattenValues(obj[key], list);
        }
        return list;
    }

    return list;
}

/**
 * データのパースメイン処理
 */
function parseDataToValueList(rawPayload) {
    if (!rawPayload) return [];

    let decoded = null;

    if (rawPayload instanceof ArrayBuffer || ArrayBuffer.isView(rawPayload)) {
        const u8 = new Uint8Array(rawPayload.buffer || rawPayload, rawPayload.byteOffset || 0, rawPayload.byteLength);
        
        decoded = decodeMsgpack(u8);

        if (decoded === null || decoded === undefined || (typeof decoded === 'number' && u8.length > 4)) {
            const list = [];
            if (u8.length >= 12 && (u8.length % 4 === 0)) {
                const f32 = new Float32Array(u8.buffer, u8.byteOffset, u8.length / 4);
                for (let i = 0; i < f32.length; i++) {
                    const val = f32[i];
                    if (!isNaN(val) && isFinite(val)) {
                        list.push(Number.isInteger(val) ? val : parseFloat(val.toFixed(3)));
                    }
                }
                if (list.length > 0) return list;
            }

            for (let i = 0; i < u8.length; i++) list.push(u8[i]);
            return list;
        }
    } 
    else if (typeof rawPayload === 'string') {
        try {
            decoded = JSON.parse(rawPayload);
        } catch (e) {
            decoded = rawPayload;
        }
    }

    return flattenValues(decoded);
}

/**
 * --------------------------------------------------------------------------------------------
 * 3. WebSocket フック処理 (WS_RECV モード用)
 * --------------------------------------------------------------------------------------------
 */
const RealWebSocket = window.WebSocket;

window.WebSocket = function (...args) {
    const ws = new RealWebSocket(...args);

    ws.addEventListener('message', (event) => {
        if (window.wsLoggerState.isPaused) return;
        if (window.wsLoggerState.sourceMode !== 'WS_RECV') return;

        if (event.data instanceof Blob) {
            event.data.arrayBuffer().then((buffer) => {
                processPacket(buffer);
            });
        } else {
            processPacket(event.data);
        }
    });

    return ws;
};

window.WebSocket.prototype = RealWebSocket.prototype;
window.WebSocket.CONNECTING = RealWebSocket.CONNECTING;
window.WebSocket.OPEN = RealWebSocket.OPEN;
window.WebSocket.CLOSING = RealWebSocket.CLOSING;
window.WebSocket.CLOSED = RealWebSocket.CLOSED;

function processPacket(data) {
    const values = parseDataToValueList(data);
    if (!values || values.length === 0) return;

    window.wsLoggerState.packetCount++;
    window.wsLoggerState.lastParsedValues = values;

    const now = performance.now();
    if (!window._lastWsHudRenderTime || now - window._lastWsHudRenderTime >= 750) {
        window._lastWsHudRenderTime = now;
        renderHUD(values);
    }
}

/**
 * --------------------------------------------------------------------------------------------
 * 4. 画面左端中央 (left: 15px, top: 50%) HUD レンダリング
 * --------------------------------------------------------------------------------------------
 */
function createHUD() {
    if (document.getElementById('ws-parser-hud')) return;
    if (!document.body) {
        setTimeout(createHUD, 100);
        return;
    }

    const container = document.createElement('div');
    container.id = 'ws-parser-hud';

    // 画面左端中央配置
    container.style.position = 'fixed';
    container.style.left = '15px';
    container.style.top = '50%';
    container.style.transform = 'translateY(-50%)';

    // UI デザイン
    container.style.width = '270px';
    container.style.maxHeight = '500px';
    container.style.backgroundColor = 'rgba(10, 14, 24, 0.93)';
    container.style.color = '#00ffcc';
    container.style.fontFamily = 'Consolas, "Courier New", monospace';
    container.style.fontSize = '12px';
    container.style.zIndex = '9999999';
    container.style.borderRadius = '8px';
    container.style.border = '1px solid #00ffcc';
    container.style.boxShadow = '0 0 16px rgba(0, 255, 204, 0.35)';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.overflow = 'hidden';

    container.innerHTML = `
        <div style="padding: 8px 10px; background: rgba(0, 255, 204, 0.12); border-bottom: 1px solid #00ffcc; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-weight: bold; color: #00ffcc; font-size: 13px; display: flex; align-items: center; gap: 6px;">
                <span>📡 Voxiom Logger</span>
            </div>
            <div style="display: flex; gap: 3px;">
                <button id="ws-pause-btn" title="更新停止/再開 [P]" style="background: #1e293b; color: #00ffcc; border: 1px solid #00ffcc; border-radius: 4px; padding: 2px 6px; font-size: 10px; cursor: pointer;">⏸️</button>
                <button id="ws-copy-btn" title="全データコピー" style="background: #1e293b; color: #00ffcc; border: 1px solid #00ffcc; border-radius: 4px; padding: 2px 6px; font-size: 10px; cursor: pointer;">📋</button>
                <button id="ws-save-btn" title="現在のパケット/座標をTXT保存 [S]" style="background: #00ffcc; color: #000; font-weight: bold; border: none; border-radius: 4px; padding: 2px 6px; font-size: 10px; cursor: pointer;">💾 TXT</button>
                <button id="ws-save-hist-btn" title="過去全ログ(履歴)をTXT保存 [H]" style="background: #9933ff; color: #fff; font-weight: bold; border: none; border-radius: 4px; padding: 2px 6px; font-size: 10px; cursor: pointer;">📜 履歴</button>
            </div>
        </div>

        <!-- データソース切り替えタブ (ゲーム直フック座標 vs WSパケット) -->
        <div style="display: flex; gap: 3px; padding: 4px 10px; background: rgba(0,0,0,0.5); border-bottom: 1px solid #222;">
            <button id="mode-game-stats" style="flex:1; padding: 3px; font-size: 10px; background: #00ffcc; color: #000; border: none; border-radius: 3px; font-weight: bold; cursor: pointer;">📊 Game Stats (直フック)</button>
            <button id="mode-ws-recv" style="flex:1; padding: 3px; font-size: 10px; background: #1e293b; color: #aaa; border: 1px solid #333; border-radius: 3px; cursor: pointer;">📡 WS Recv (通信)</button>
        </div>

        <div style="padding: 4px 10px; background: rgba(0, 0, 0, 0.4); border-bottom: 1px solid #222; font-size: 10px; color: #aaa; display: flex; justify-content: space-between;">
            <span id="ws-count-label">Updates: 0</span>
            <span id="ws-fields-label">Items: 0</span>
        </div>

        <div id="ws-data-list" style="flex: 1; overflow-y: auto; padding: 8px 10px; display: flex; flex-direction: column; gap: 3px; font-size: 11px;">
            <div style="color: #666; text-align: center; margin-top: 20px;">データ待機中... (ゲーム開始で表示)</div>
        </div>

        <div style="padding: 3px 8px; background: rgba(0,0,0,0.6); border-top: 1px solid #222; font-size: 9px; color: #888; text-align: center;">
            [<span style="color:#00ffcc;">]</span>] UI切替 \| [<span style="color:#00ffcc;">P</span>] 停止 \| [<span style="color:#00ffcc;">S</span>] TXT保存 \| [<span style="color:#00ffcc;">H</span>] 履歴
        </div>
    `;

    document.body.appendChild(container);

    const btnStats = document.getElementById('mode-game-stats');
    const btnWs = document.getElementById('mode-ws-recv');

    function setSourceMode(mode) {
        window.wsLoggerState.sourceMode = mode;
        btnStats.style.background = mode === 'GAME_STATS' ? '#00ffcc' : '#1e293b';
        btnStats.style.color = mode === 'GAME_STATS' ? '#000' : '#aaa';
        btnWs.style.background = mode === 'WS_RECV' ? '#00ffcc' : '#1e293b';
        btnWs.style.color = mode === 'WS_RECV' ? '#000' : '#aaa';

        if (mode === 'GAME_STATS' && window.wsLoggerState.gameStatsValues.length > 0) {
            renderHUD(window.wsLoggerState.gameStatsValues);
        }
    }

    btnStats.addEventListener('click', () => setSourceMode('GAME_STATS'));
    btnWs.addEventListener('click', () => setSourceMode('WS_RECV'));

    // 一時停止/再開ボタン
    const pauseBtn = document.getElementById('ws-pause-btn');
    pauseBtn.addEventListener('click', () => {
        window.wsLoggerState.isPaused = !window.wsLoggerState.isPaused;
        pauseBtn.innerText = window.wsLoggerState.isPaused ? '▶️' : '⏸️';
        pauseBtn.style.backgroundColor = window.wsLoggerState.isPaused ? '#ff0055' : '#1e293b';
        pauseBtn.style.color = window.wsLoggerState.isPaused ? '#fff' : '#00ffcc';
    });

    // コピーボタン
    document.getElementById('ws-copy-btn').addEventListener('click', () => {
        if (!window.wsLoggerState.lastParsedValues) return;
        const text = window.wsLoggerState.lastParsedValues.map((v, i) => `${i + 1}: ${v}`).join('\n');
        navigator.clipboard.writeText(text).then(() => {
            alert('コピーしました！');
        });
    });

    // 現在のデータをTXTダウンロード保存
    document.getElementById('ws-save-btn').addEventListener('click', () => {
        if (!window.wsLoggerState.lastParsedValues || window.wsLoggerState.lastParsedValues.length === 0) {
            alert('保存対象のデータがありません。');
            return;
        }

        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        let content = `========================================\n`;
        content += `Voxiom.io Game Stats / Packet Log (${window.wsLoggerState.sourceMode})\n`;
        content += `Update #: ${window.wsLoggerState.packetCount}\n`;
        content += `Timestamp: ${now}\n`;
        content += `Total Items: ${window.wsLoggerState.lastParsedValues.length}\n`;
        content += `========================================\n\n`;

        content += window.wsLoggerState.lastParsedValues.map((v, i) => `${i + 1}: ${v}`).join('\n');

        downloadTxtFile(`voxiom_stats_${Date.now()}.txt`, content);
    });

    // ログ履歴をTXTダウンロード保存
    document.getElementById('ws-save-hist-btn').addEventListener('click', () => {
        const history = window.wsLoggerState.logHistory || [];
        if (history.length === 0) {
            alert('保存対象のログ履歴がありません。');
            return;
        }

        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        let content = `========================================\n`;
        content += `Voxiom.io Full Log History\n`;
        content += `Exported: ${now}\n`;
        content += `Total Buffered Entries: ${history.length}\n`;
        content += `========================================\n\n`;

        for (const item of history) {
            content += `--- [Update #${item.count} | ${item.timestamp} | Items: ${item.values.length}] ---\n`;
            content += item.values.map((v, i) => `${i + 1}: ${v}`).join('\n');
            content += `\n\n`;
        }

        downloadTxtFile(`voxiom_history_${Date.now()}.txt`, content);
    });
}

/**
 * TXTファイル生成＆自動ダウンロードユーティリティ
 */
function downloadTxtFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function renderHUD(values) {
    createHUD();

    // 履歴バッファに記録 (最大100件まで保持)
    window.wsLoggerState.logHistory = window.wsLoggerState.logHistory || [];
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    window.wsLoggerState.logHistory.push({
        count: window.wsLoggerState.packetCount,
        timestamp: timestamp,
        values: [...values]
    });
    if (window.wsLoggerState.logHistory.length > 100) {
        window.wsLoggerState.logHistory.shift();
    }

    const dataList = document.getElementById('ws-data-list');
    const countLabel = document.getElementById('ws-count-label');
    const fieldsLabel = document.getElementById('ws-fields-label');

    if (!dataList) return;

    if (countLabel) countLabel.innerText = `Updates: ${window.wsLoggerState.packetCount}`;
    if (fieldsLabel) fieldsLabel.innerText = `Items: ${values.length}`;

    // 描画保護（最大150件まで表示）
    const MAX_DISPLAY_ITEMS = 150;
    const renderCount = Math.min(values.length, MAX_DISPLAY_ITEMS);

    // インデックス項目のラベル補足（Game Stats モード時）
    const statsLabels = [
        "Pos X", "Pos Y", "Pos Z",
        "Block X", "Block Y", "Block Z",
        "Chunk X", "Chunk Y", "Chunk Z",
        "Velocity X", "Velocity Y", "Velocity Z",
        "Yaw", "Pitch", "Chunks Loaded",
        "FPS", "Latency (ms)", "Download (bps)", "Upload (bps)"
    ];

    let html = '';
    for (let i = 0; i < renderCount; i++) {
        const indexNum = i + 1;
        const val = values[i];
        const labelNote = (window.wsLoggerState.sourceMode === 'GAME_STATS' && statsLabels[i]) ? ` <span style="color:#666; font-size:9px;">(${statsLabels[i]})</span>` : '';
        
        let valColor = '#ffffff';
        if (typeof val === 'number') valColor = '#00ffcc';
        else if (typeof val === 'boolean') valColor = '#ffcc00';
        else if (typeof val === 'string') valColor = '#ff77ff';

        html += `
            <div style="display: flex; gap: 8px; border-bottom: 1px solid rgba(255, 255, 255, 0.05); padding-bottom: 2px;">
                <span style="color: #666; font-weight: bold; min-width: 28px; text-align: right;">${indexNum}:</span>
                <span style="color: ${valColor}; word-break: break-all;">${val}${labelNote}</span>
            </div>
        `;
    }

    if (values.length > MAX_DISPLAY_ITEMS) {
        html += `
            <div style="color: #ffaa00; font-size: 10px; text-align: center; padding: 4px; border-top: 1px dashed #ffaa00; margin-top: 4px;">
                ...他 ${values.length - MAX_DISPLAY_ITEMS} 件省略 (描画保護)
            </div>
        `;
    }

    dataList.innerHTML = html;
}

// 初期起動
createHUD();

/**
 * --------------------------------------------------------------------------------------------
 * 5. キーボードショートカットキー
 * --------------------------------------------------------------------------------------------
 *   - "]" (BracketRight) : HUDパネルの表示 / 非表示 トグル
 *   - "P" (KeyP)         : データ更新の 停止 (Pause) / 再開 (Resume)
 *   - "S" (KeyS)         : 現在のデータを TXT 保存
 *   - "H" (KeyH)         : 過去全ログ(履歴)を TXT 保存
 */
window.addEventListener('keydown', (e) => {
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT')) {
        return;
    }

    if (e.code === 'BracketRight' || e.key === ']') {
        const hud = document.getElementById('ws-parser-hud');
        if (hud) {
            hud.style.display = (hud.style.display === 'none') ? 'flex' : 'none';
        }
    }
    else if (e.code === 'KeyP' || e.key === 'p' || e.key === 'P') {
        const pauseBtn = document.getElementById('ws-pause-btn');
        if (pauseBtn) pauseBtn.click();
    }
    else if (e.code === 'KeyS' || e.key === 's' || e.key === 'S') {
        const saveBtn = document.getElementById('ws-save-btn');
        if (saveBtn) saveBtn.click();
    }
    else if (e.code === 'KeyH' || e.key === 'h' || e.key === 'H') {
        const histBtn = document.getElementById('ws-save-hist-btn');
        if (histBtn) histBtn.click();
    }
});






