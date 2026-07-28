const injectSkyChanger = () => {
    const script = document.createElement('script');
    script.textContent = `
    (function() {
        if (window.__skyChangerInjected) return;
        window.__skyChangerInjected = true;

        console.log("[Sky Color Changer] VoxMate Sky Color System ロード開始");

        window.mySkySettings = {
            enabled: true,
            mode: 'solid',
            color: { r: 1.0, g: 0.0, b: 0.0 },
            speed: 2
        };

        let actualRenderer = null;
        let realSetClearColor = null;
        let originalClearColor = null;
        let wasEnabled = true;
        let hue = 0;

        function hexToRgb(hex) {
            if (!hex || typeof hex !== 'string') return null;
            const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16) / 255.0,
                g: parseInt(result[2], 16) / 255.0,
                b: parseInt(result[3], 16) / 255.0
            } : null;
        }

        function hslToRgb(h, s, l) {
            let r, g, b;
            if (s === 0) {
                r = g = b = l;
            } else {
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                const hue2rgb = (p, q, t) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1/6) return p + (q - p) * 6 * t;
                    if (t < 1/2) return q;
                    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                    return p;
                };
                r = hue2rgb(p, q, h + 1/3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1/3);
            }
            return { r, g, b };
        }

        // F1設定画面からのパラメータ更新通知を受信 (document経由でContext Isolation越え)
        document.addEventListener('vmc-sky-update', (e) => {
            if (!e.detail) return;
            if (typeof e.detail.enabled === 'boolean') window.mySkySettings.enabled = e.detail.enabled;
            if (e.detail.mode) window.mySkySettings.mode = e.detail.mode;
            if (e.detail.color) {
                if (typeof e.detail.color === 'string') {
                    const rgb = hexToRgb(e.detail.color);
                    if (rgb) window.mySkySettings.color = rgb;
                } else if (typeof e.detail.color === 'object') {
                    window.mySkySettings.color = e.detail.color;
                }
            }
            if (typeof e.detail.speed !== 'undefined') {
                window.mySkySettings.speed = parseFloat(e.detail.speed) || 2;
            }
        });

        // 0. THREE.Color オブジェクトの完全ロック関数 (チカチカ防止 & OFF時の即座復元)
        function lockColorObject(colorObj) {
            if (!colorObj || colorObj._isLocked) return;
            colorObj._isLocked = true;
            colorObj._origR = colorObj.r;
            colorObj._origG = colorObj.g;
            colorObj._origB = colorObj.b;

            try {
                Object.defineProperty(colorObj, 'r', {
                    get() {
                        if (window.mySkySettings && window.mySkySettings.enabled && window.mySkySettings.color) {
                            return window.mySkySettings.color.r;
                        }
                        return typeof this._origR !== 'undefined' ? this._origR : 0;
                    },
                    set(v) {
                        this._origR = v;
                    },
                    configurable: true
                });
                Object.defineProperty(colorObj, 'g', {
                    get() {
                        if (window.mySkySettings && window.mySkySettings.enabled && window.mySkySettings.color) {
                            return window.mySkySettings.color.g;
                        }
                        return typeof this._origG !== 'undefined' ? this._origG : 0;
                    },
                    set(v) {
                        this._origG = v;
                    },
                    configurable: true
                });
                Object.defineProperty(colorObj, 'b', {
                    get() {
                        if (window.mySkySettings && window.mySkySettings.enabled && window.mySkySettings.color) {
                            return window.mySkySettings.color.b;
                        }
                        return typeof this._origB !== 'undefined' ? this._origB : 0;
                    },
                    set(v) {
                        this._origB = v;
                    },
                    configurable: true
                });
            } catch (e) {
                console.error("[Sky Color Changer] Lock Error:", e);
            }
        }

        // 1. Fog (地平線の霧) / Background の捕獲＆カラーロック
        Object.defineProperty(Object.prototype, 'fog', {
            set(val) {
                this._fog = val;
                if (val && typeof val === 'object' && val.color) {
                    lockColorObject(val.color);
                }
            },
            get() {
                return this._fog;
            },
            configurable: true
        });

        Object.defineProperty(Object.prototype, 'background', {
            set(val) {
                this._background = val;
                if (val && typeof val === 'object' && 'r' in val) {
                    lockColorObject(val);
                }
            },
            get() {
                return this._background;
            },
            configurable: true
        });

        // 2. WebGL clearColor 直接フック (すべてのGLクリア呼び出しに対応)
        if (typeof WebGLRenderingContext !== 'undefined') {
            const origClearColor1 = WebGLRenderingContext.prototype.clearColor;
            WebGLRenderingContext.prototype.clearColor = function(r, g, b, a) {
                if (window.mySkySettings && window.mySkySettings.enabled && window.mySkySettings.color) {
                    r = window.mySkySettings.color.r;
                    g = window.mySkySettings.color.g;
                    b = window.mySkySettings.color.b;
                }
                return origClearColor1.call(this, r, g, b, a);
            };
        }

        if (typeof WebGL2RenderingContext !== 'undefined') {
            const origClearColor2 = WebGL2RenderingContext.prototype.clearColor;
            WebGL2RenderingContext.prototype.clearColor = function(r, g, b, a) {
                if (window.mySkySettings && window.mySkySettings.enabled && window.mySkySettings.color) {
                    r = window.mySkySettings.color.r;
                    g = window.mySkySettings.color.g;
                    b = window.mySkySettings.color.b;
                }
                return origClearColor2.call(this, r, g, b, a);
            };
        }

        // 3. WebGLRenderer.setClearColor フック
        Object.defineProperty(Object.prototype, 'setClearColor', {
            set(fn) {
                realSetClearColor = fn;
            },
            get() {
                return function (color, alpha) {
                    actualRenderer = this;

                    if (window.mySkySettings && window.mySkySettings.enabled) {
                        if (color && typeof color === 'object' && 'r' in color) {
                            lockColorObject(color);
                        } else if (window.mySkySettings.color) {
                            const hexColor = (Math.round(window.mySkySettings.color.r * 255) << 16) |
                                             (Math.round(window.mySkySettings.color.g * 255) << 8) |
                                             Math.round(window.mySkySettings.color.b * 255);
                            arguments[0] = hexColor;
                        }
                    } else {
                        if (typeof arguments[0] === 'number') {
                            originalClearColor = arguments[0];
                        }
                    }

                    if (realSetClearColor) {
                        return realSetClearColor.apply(this, arguments);
                    }
                };
            },
            configurable: true
        });

        // 4. リアルタイム更新アニメーションループ (Solid & RGB Cycle)
        function animate() {
            window.requestAnimationFrame(animate);

            if (!window.mySkySettings || !window.mySkySettings.enabled) {
                if (wasEnabled && actualRenderer && actualRenderer.setClearColor && originalClearColor !== null) {
                    actualRenderer.setClearColor(originalClearColor);
                }
                wasEnabled = false;
                return;
            }

            wasEnabled = true;

            if (window.mySkySettings.mode === 'rgb') {
                const speed = (window.mySkySettings.speed || 2) * 0.4;
                hue = (hue + speed) % 360;
                window.mySkySettings.color = hslToRgb(hue / 360, 1.0, 0.5);

                if (actualRenderer && actualRenderer.setClearColor) {
                    const hexColor = (Math.round(window.mySkySettings.color.r * 255) << 16) |
                                     (Math.round(window.mySkySettings.color.g * 255) << 8) |
                                     Math.round(window.mySkySettings.color.b * 255);
                    actualRenderer.setClearColor(hexColor);
                }
            }
        }
        window.requestAnimationFrame(animate);
    })();
    `;
    (document.head || document.documentElement).appendChild(script);
};

module.exports = {
    injectSkyChanger
};
