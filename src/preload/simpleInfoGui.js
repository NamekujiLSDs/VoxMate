const injectSimpleInfoGui = () => {
    const script = document.createElement('script');
    script.textContent = `
    (function() {
        if (window.__simpleInfoGuiInjected) return;
        window.__simpleInfoGuiInjected = true;

        console.log("[SimpleInfoGUI] Initializing Voxiom Stats HUD...");

        window.simpleInfoSettings = {
            enabled: true,
            position: 'top-left',
            marginTop: 60,
            marginLeft: 20,
            showFPS: true,
            showPing: true,
            showPos: true,
            showBlockPos: false,
            showChunkPos: false,
            showVelocity: false,
            showAngles: false,
            showChunks: false,
            showNetBps: false
        };

        let currentData = {
            fps: 0,
            ping: 0,
            posX: 0, posY: 0, posZ: 0,
            blockX: 0, blockY: 0, blockZ: 0,
            chunkX: 0, chunkY: 0, chunkZ: 0,
            velX: 0, velY: 0, velZ: 0,
            yaw: 0, pitch: 0,
            chunksLoaded: 0,
            downloadBps: 0, uploadBps: 0
        };

        let lastRenderTime = 0;
        const RENDER_INTERVAL_MS = 750;

        document.addEventListener('vmc-info-update', (e) => {
            if (!e.detail) return;
            Object.assign(window.simpleInfoSettings, e.detail);
            updateHUDStyle();
            lastRenderTime = 0;
            renderHUD();
        });

        // 0. Hook Voxiom internal debug statistics
        Object.defineProperty(Object.prototype, 'pVX', {
            get() {
                return this._pVX;
            },
            set(fn) {
                this._pVX = function() {
                    const s = window.simpleInfoSettings;
                    const isEnabled = s && s.enabled;

                    if (this.pVZ && this.pVZ.style) {
                        if (isEnabled) {
                            this.pVZ.style.display = 'none';
                        } else if (this._pVr) {
                            this.pVZ.style.display = '';
                        }
                    }

                    if (this.pVE) {
                        currentData.posX = this.pVE ? (Number.isInteger(this.pVE.pdd) ? this.pVE.pdd : parseFloat(this.pVE.pdd.toFixed(2))) : 0;
                        currentData.posY = this.pVE ? (Number.isInteger(this.pVE.pdp) ? this.pVE.pdp : parseFloat(this.pVE.pdp.toFixed(2))) : 0;
                        currentData.posZ = this.pVE ? (Number.isInteger(this.pVE.pdS) ? this.pVE.pdS : parseFloat(this.pVE.pdS.toFixed(2))) : 0;

                        currentData.blockX = this.pVi ? this.pVi.pdd : 0;
                        currentData.blockY = this.pVi ? this.pVi.pdp : 0;
                        currentData.blockZ = this.pVi ? this.pVi.pdS : 0;

                        currentData.chunkX = this.pVB ? this.pVB.pdd : 0;
                        currentData.chunkY = this.pVB ? this.pVB.pdp : 0;
                        currentData.chunkZ = this.pVB ? this.pVB.pdS : 0;

                        currentData.velX = this.pVF ? parseFloat(this.pVF.pdd.toFixed(2)) : 0;
                        currentData.velY = this.pVF ? parseFloat(this.pVF.pdp.toFixed(2)) : 0;
                        currentData.velZ = this.pVF ? parseFloat(this.pVF.pdS.toFixed(2)) : 0;

                        currentData.yaw = typeof this.pVh === 'number' ? parseFloat(this.pVh.toFixed(1)) : 0;
                        currentData.pitch = typeof this.pVD === 'number' ? parseFloat(this.pVD.toFixed(1)) : 0;

                        currentData.chunksLoaded = this.pVK || 0;
                        currentData.fps = typeof this.pVM === 'number' ? Math.round(this.pVM) : 0;
                        currentData.ping = this.pVG || 0;

                        currentData.downloadBps = typeof this.pVP === 'number' ? parseFloat(this.pVP.toFixed(1)) : 0;
                        currentData.uploadBps = typeof this.pVI === 'number' ? parseFloat(this.pVI.toFixed(1)) : 0;

                        if (isEnabled) {
                            const now = performance.now();
                            if (now - lastRenderTime >= RENDER_INTERVAL_MS) {
                                lastRenderTime = now;
                                renderHUD();
                            }
                        }
                    }

                    return fn.apply(this, arguments);
                };
            },
            configurable: true
        });

        Object.defineProperty(Object.prototype, 'pVr', {
            get() {
                const s = window.simpleInfoSettings;
                if (s && s.enabled) {
                    return true;
                }
                return typeof this._pVr !== 'undefined' ? this._pVr : false;
            },
            set(val) {
                this._pVr = val;
            },
            configurable: true
        });

        function createHUDContainer() {
            let container = document.getElementById('simple-info-gui');
            const parentElem = document.getElementById('app') || document.body || document.documentElement;

            if (container) {
                if (container.parentNode !== parentElem) {
                    parentElem.appendChild(container);
                }
                return container;
            }

            container = document.createElement('div');
            container.id = 'simple-info-gui';
            container.style.position = 'absolute';
            container.style.zIndex = '10';
            container.style.pointerEvents = 'none';
            container.style.fontFamily = "'Consolas', 'Menlo', 'Monaco', 'Courier New', monospace";
            container.style.fontSize = '13px';
            container.style.fontWeight = 'bold';
            container.style.color = '#ffffff';
            container.style.textShadow = '1px 1px 2px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000, 0 2px 4px rgba(0,0,0,0.8)';
            container.style.padding = '0';
            container.style.background = 'transparent';
            container.style.border = 'none';
            container.style.boxShadow = 'none';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '2px';

            parentElem.appendChild(container);
            updateHUDStyle();
            return container;
        }

        function updateHUDStyle() {
            const container = document.getElementById('simple-info-gui');
            if (!container) return;

            const s = window.simpleInfoSettings;
            if (!s.enabled) {
                container.style.display = 'none';
                return;
            } else {
                container.style.display = 'flex';
            }

            container.style.top = '';
            container.style.bottom = '';
            container.style.left = '';
            container.style.right = '';

            const mTop = (s.marginTop ?? 60) + 'px';
            const mLeft = (s.marginLeft ?? 20) + 'px';

            switch (s.position) {
                case 'top-right':
                    container.style.top = mTop;
                    container.style.right = mLeft;
                    break;
                case 'bottom-left':
                    container.style.bottom = mTop;
                    container.style.left = mLeft;
                    break;
                case 'bottom-right':
                    container.style.bottom = mTop;
                    container.style.right = mLeft;
                    break;
                case 'top-left':
                default:
                    container.style.top = mTop;
                    container.style.left = mLeft;
                    break;
            }
        }

        function renderHUD() {
            const container = createHUDContainer();
            const s = window.simpleInfoSettings;

            if (!s.enabled) {
                container.style.display = 'none';
                return;
            }

            let lines = [];
            const shadowStyle = 'text-shadow: 1px 1px 2px #000, -1px -1px 2px #000, 1px -1px 2px #000, -1px 1px 2px #000;';
            if (s.showFPS) lines.push(\`<span style="color:#2dd4bf; \${shadowStyle}">FPS:</span> <span style="color:#ffffff;">\${currentData.fps}</span>\`);
            if (s.showPing) lines.push(\`<span style="color:#f43f5e; \${shadowStyle}">Ping:</span> <span style="color:#ffffff;">\${currentData.ping} ms</span>\`);
            if (s.showPos) lines.push(\`<span style="color:#a855f7; \${shadowStyle}">Pos:</span> <span style="color:#ffffff;">\${currentData.posX}, \${currentData.posY}, \${currentData.posZ}</span>\`);
            if (s.showBlockPos) lines.push(\`<span style="color:#eab308; \${shadowStyle}">Block:</span> <span style="color:#ffffff;">\${currentData.blockX}, \${currentData.blockY}, \${currentData.blockZ}</span>\`);
            if (s.showChunkPos) lines.push(\`<span style="color:#0284c7; \${shadowStyle}">Chunk:</span> <span style="color:#ffffff;">\${currentData.chunkX}, \${currentData.chunkY}, \${currentData.chunkZ}</span>\`);
            if (s.showVelocity) lines.push(\`<span style="color:#10b981; \${shadowStyle}">Vel:</span> <span style="color:#ffffff;">\${currentData.velX}, \${currentData.velY}, \${currentData.velZ}</span>\`);
            if (s.showAngles) lines.push(\`<span style="color:#ec4899; \${shadowStyle}">Angles:</span> <span style="color:#ffffff;">Yaw \${currentData.yaw}° / Pitch \${currentData.pitch}°</span>\`);
            if (s.showChunks) lines.push(\`<span style="color:#f59e0b; \${shadowStyle}">Chunks:</span> <span style="color:#ffffff;">\${currentData.chunksLoaded}</span>\`);
            if (s.showNetBps) lines.push(\`<span style="color:#6366f1; \${shadowStyle}">Net:</span> <span style="color:#ffffff;">↓ \${currentData.downloadBps} B/s | ↑ \${currentData.uploadBps} B/s</span>\`);

            if (lines.length === 0) {
                container.style.display = 'none';
            } else {
                container.style.display = 'flex';
                container.innerHTML = lines.map(line => \`<div>\${line}</div>\`).join('');
            }
        }

        renderHUD();
    })();
    `;
    (document.head || document.documentElement).appendChild(script);
};

module.exports = {
    injectSimpleInfoGui
};
