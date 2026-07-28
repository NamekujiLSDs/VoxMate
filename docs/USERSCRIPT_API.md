# VoxMate UserScript Custom Settings API Documentation

VoxMate allows UserScripts to add custom settings entries to the F1 settings menu. This makes it possible for users to change script behavior directly from the in-game settings UI.

This document explains the API from the basics to practical examples so that anyone can create a UserScript with custom controls.

---

## 1. What You Should Know First

UserScripts can participate in the menu through two APIs:

- `window.vmc.registerSetting(...)`
  - Adds a new setting entry.
  - Examples include checkboxes, sliders, text fields, dropdowns, and buttons.
- `window.vmc.registerTab(...)`
  - Adds a dedicated tab to the left sidebar.
  - Settings can then be placed inside that tab.

### Important Notes

- `category` creates a section heading inside the current tab.
- If you want a new left-sidebar tab, register it first with `registerTab`.
- If `tab` is omitted, the setting is placed into the default UserScript tab.
- Changes are received through the `vmc-setting-change` event.
- `id` values must be unique across all registered settings.
- Custom tab IDs must be unique and must not reuse built-in VoxMate tab IDs.

### Reserved Tab IDs

The following tab IDs are reserved by VoxMate and should not be used for custom UserScript tabs:

| Reserved ID | Reason |
| :--- | :--- |
| `quickSetting` | Built-in Quick Settings tab |
| `renderingSetting` | Built-in Rendering tab |
| `skySetting` | Built-in Sky tab |
| `crosshairSetting` | Built-in Crosshair tab |
| `cssSetting` | Built-in CSS tab |
| `swapperSetting` | Built-in Swapper tab |
| `adblockSetting` | Built-in Ad Blocker tab |
| `infoSetting` | Built-in Info tab |
| `userscriptSetting` | Built-in UserScript tab |
| `performanceSetting` | Built-in Performance tab |

### Reserved Settings-Body IDs

The following IDs are already used by the built-in settings UI and should not be reused for custom setting IDs:

| Reserved ID | Reason |
| :--- | :--- |
| `menuBody` | Main settings content container |
| `menuBodyTitle` | Section title container |
| `menuBodyItem` | Standard row container |
| `menuButton` | Shared button style ID |
| `enableCustomCrosshair` | Built-in crosshair toggle |
| `crosshairType` | Built-in crosshair type selector |
| `enableCustomCss` | Built-in CSS toggle |
| `cssType` | Built-in CSS mode selector |
| `enableResourceSwapper` | Built-in swapper toggle |
| `enableAdBlocker` | Built-in ad blocker toggle |
| `enableRawInput` | Built-in raw input toggle |
| `enableDesynchronized` | Built-in desync toggle |
| `enableSimpleInfo` | Built-in info HUD toggle |
| `infoPosition` | Built-in info HUD position selector |
| `unlimitedFps` | Built-in performance toggle |

### Recommended Practice

- Use descriptive, unique IDs such as `my_mod_enabled` or `my_mod_theme`.
- Avoid generic names like `settings`, `tab`, or `config`.
- If you want to group controls, prefer `category` instead of creating a new tab for every small setting.

### Conflict Avoidance Checklist

Before publishing a Userscript, verify the following:

- The tab ID is not one of the reserved VoxMate tab IDs.
- The setting ID is not already used by another registered setting.
- The category name does not duplicate built-in section names such as `Quick Settings`, `Rendering`, `Sky`, `Crosshair`, `CSS`, `Swapper`, `Ad Blocker`, `Info`, `UserScript`, or `Performance` unless you intentionally want that appearance.
- Use a prefix such as `my_mod_` or `my_script_` to avoid accidental collisions.

---

## 2. Minimal Example

The simplest example adds a single checkbox.

```javascript
// ==UserScript==
// @name         Example Mod
// @version      1.0
// @description  Adds a simple toggle to VoxMate menu.
// @author       YourName
// ==/UserScript==

(function () {
    'use strict';

    const init = () => {
        if (!window.vmc || typeof window.vmc.registerSetting !== 'function') return;

        window.vmc.registerSetting({
            id: 'example_toggle',
            label: 'Enable Example Feature',
            type: 'checkbox',
            default: true
        });

        document.addEventListener('vmc-setting-change', (e) => {
            if (e.detail.id === 'example_toggle') {
                console.log('changed:', e.detail.value);
            }
        });
    };

    if (window.vmc && typeof window.vmc.registerSetting === 'function') {
        init();
    } else {
        const interval = setInterval(() => {
            if (window.vmc && typeof window.vmc.registerSetting === 'function') {
                clearInterval(interval);
                init();
            }
        }, 100);
    }
})();
```

---

## 3. タブを作る例

自分専用のタブを作り、その中に設定項目をまとめたい場合は次のように書きます。

```javascript
// ==UserScript==
// @name         Custom Tab Example
// @version      1.0
// @description  Adds a custom tab and related settings.
// @author       YourName
// ==/UserScript==

(function () {
    'use strict';

    const init = () => {
        if (!window.vmc) return;

        window.vmc.registerTab({
            id: 'my_mod_tab',
            title: 'My Mod',
            icon: 'tune'
        });

        window.vmc.registerSetting({
            id: 'mod_enabled',
            label: 'Enable Mod',
            category: 'Main Settings',
            tab: 'my_mod_tab',
            type: 'checkbox',
            default: true
        });

        window.vmc.registerSetting({
            id: 'mod_speed',
            label: 'Speed',
            category: 'Main Settings',
            tab: 'my_mod_tab',
            type: 'range',
            min: 1,
            max: 10,
            step: 1,
            default: 3
        });
    };

    if (window.vmc && typeof window.vmc.registerTab === 'function') {
        init();
    } else {
        const interval = setInterval(() => {
            if (window.vmc && typeof window.vmc.registerTab === 'function') {
                clearInterval(interval);
                init();
            }
        }, 100);
    }
})();
```

---

## 4. カテゴリを使う例

`category` を指定すると、そのタブ内で見出しが作られます。

```javascript
window.vmc.registerSetting({
    id: 'fov_angle',
    label: 'Custom FOV Angle',
    category: 'Graphics & Camera',
    type: 'range',
    min: 60,
    max: 120,
    default: 90
});

window.vmc.registerSetting({
    id: 'auto_bhop',
    label: 'Enable BunnyHop Auto Jump',
    category: 'Automation & Movement',
    type: 'checkbox',
    default: true
});
```

> `category` は「見出し」を作るだけです。左サイドバーのタブ自体を作るには `registerTab` が必要です。

---

## 5. API リファレンス

### `window.vmc.registerTab(tabConfig)`
左サイドバーに独自の設定タブを追加します。

| プロパティ | 型 | 必須 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | `string` | 必須 | タブを識別する一意の ID |
| `title` | `string` | 必須 | サイドバーに表示されるタイトル |
| `icon` | `string` | オプション | Material Symbols のアイコン名。既定値は `tune` |

#### 例

```javascript
window.vmc.registerTab({
    id: 'my_mod_tab',
    title: 'My Mod',
    icon: 'auto_awesome'
});
```

---

### `window.vmc.registerSetting(settingConfig)`
メニューに新しい設定項目を登録します。

| プロパティ | 型 | 必須 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | `string` | 必須 | 設定を識別する一意のキー。英数字とアンダースコア推奨 |
| `label` | `string` | 必須 | メニュー上に表示される名前 |
| `type` | `string` | 必須 | `checkbox`, `range`, `number`, `text`, `select`, `button` のいずれか |
| `category` | `string` | オプション | 現在のタブ内で表示するカテゴリ見出し |
| `tab` | `string` | オプション | 配置先タブ ID。省略時は `userscriptSetting` |
| `default` | `any` | オプション | 初期値 |
| `min` | `number` | オプション | `range`, `number` の最小値 |
| `max` | `number` | オプション | `range`, `number` の最大値 |
| `step` | `number` | オプション | `range`, `number` の刻み値 |
| `options` | `Array<{label: string, value: any}>` | オプション | `select` 用の選択肢 |
| `buttonText` | `string` | オプション | `button` の表示テキスト。既定値は `RUN` |

#### 例

```javascript
window.vmc.registerSetting({
    id: 'fov_angle',
    label: 'FOV',
    category: 'Graphics',
    tab: 'my_mod_tab',
    type: 'range',
    min: 60,
    max: 120,
    step: 1,
    default: 90
});
```

---

### `window.vmc.getCustomSetting(id)`
指定した設定値を取得します。戻り値は `Promise` です。

```javascript
const value = await window.vmc.getCustomSetting('mod_enabled');
```

---

### `window.vmc.setCustomSetting(id, value)`
設定値をプログラム側から変更し、メニューの表示状態と保存値を更新します。

```javascript
window.vmc.setCustomSetting('mod_speed', 7);
```

---

## 6. 対応コントロール一覧

### 1) Checkbox

```javascript
window.vmc.registerSetting({
    id: 'enable_feature',
    label: 'Enable Feature',
    type: 'checkbox',
    default: true
});
```

### 2) Range

```javascript
window.vmc.registerSetting({
    id: 'speed',
    label: 'Speed',
    type: 'range',
    min: 1,
    max: 10,
    step: 1,
    default: 3
});
```

### 3) Number

```javascript
window.vmc.registerSetting({
    id: 'max_fps',
    label: 'Max FPS',
    type: 'number',
    min: 30,
    max: 300,
    step: 10,
    default: 120
});
```

### 4) Text

```javascript
window.vmc.registerSetting({
    id: 'player_name',
    label: 'Player Name',
    type: 'text',
    default: 'VoxMate Player'
});
```

### 5) Select

```javascript
window.vmc.registerSetting({
    id: 'theme',
    label: 'Theme',
    type: 'select',
    default: 'dark',
    options: [
        { label: 'Dark', value: 'dark' },
        { label: 'Light', value: 'light' }
    ]
});
```

### 6) Button

```javascript
window.vmc.registerSetting({
    id: 'reset_btn',
    label: 'Reset Settings',
    type: 'button',
    buttonText: 'RESET NOW'
});
```

ボタンを押した場合は、`vmc-setting-change` で `id` と `value: true` が渡されます。

---

## 7. イベント `vmc-setting-change`

ユーザーが設定項目を変更すると、`document` 上に `vmc-setting-change` というカスタムイベントが送られます。

```javascript
document.addEventListener('vmc-setting-change', (e) => {
    const { id, value } = e.detail;
    console.log('changed', id, value);
});
```

### 使い方の例

```javascript
document.addEventListener('vmc-setting-change', (e) => {
    if (e.detail.id === 'mod_enabled') {
        applyFeature(e.detail.value);
    }

    if (e.detail.id === 'mod_speed') {
        applySpeed(e.detail.value);
    }
});
```

---

## 8. 実務向けの完全サンプル

以下は、タブ・カテゴリ・複数設定・イベント処理をまとめた実例です。

```javascript
// ==UserScript==
// @name         Full Example Mod
// @version      1.0
// @description  Demonstrates VoxMate custom settings API.
// @author       YourName
// ==/UserScript==

(function () {
    'use strict';

    const init = () => {
        if (!window.vmc) return;

        window.vmc.registerTab({
            id: 'full_example_tab',
            title: 'Full Example',
            icon: 'widgets'
        });

        window.vmc.registerSetting({
            id: 'enable_mod',
            label: 'Enable Mod',
            category: 'Main Settings',
            tab: 'full_example_tab',
            type: 'checkbox',
            default: true
        });

        window.vmc.registerSetting({
            id: 'mode',
            label: 'Mode',
            category: 'Main Settings',
            tab: 'full_example_tab',
            type: 'select',
            default: 'auto',
            options: [
                { label: 'Auto', value: 'auto' },
                { label: 'Manual', value: 'manual' }
            ]
        });

        window.vmc.registerSetting({
            id: 'strength',
            label: 'Strength',
            category: 'Main Settings',
            tab: 'full_example_tab',
            type: 'range',
            min: 1,
            max: 10,
            step: 1,
            default: 5
        });

        document.addEventListener('vmc-setting-change', async (e) => {
            const { id, value } = e.detail;

            if (id === 'enable_mod') {
                console.log('Enable mod:', value);
            } else if (id === 'mode') {
                console.log('Mode:', value);
            } else if (id === 'strength') {
                console.log('Strength:', value);
            }
        });
    };

    if (window.vmc && typeof window.vmc.registerTab === 'function') {
        init();
    } else {
        const interval = setInterval(() => {
            if (window.vmc && typeof window.vmc.registerTab === 'function') {
                clearInterval(interval);
                init();
            }
        }, 100);
    }
})();
```

---

## 9. 実装時の注意点

- `id` は重複しないようにしてください。
- `category` は見出しなので、タブを作りたい場合は `registerTab` も合わせて使ってください。
- `tab` を省略した場合は、既定で UserScript タブへ配置されます。
- 設定値は VoxMate 側で保持されるため、再起動後も値を引き継ぐことがあります。
- UI への反映は、設定変更イベントを受けてスクリプト側で行うのが基本です。

---

## 10. すぐ使えるテンプレート

```javascript
// ==UserScript==
// @name         My VoxMate Mod
// @version      1.0
// @description  Template for VoxMate UserScript settings.
// @author       YourName
// ==/UserScript==

(function () {
    'use strict';

    const init = () => {
        if (!window.vmc) return;

        window.vmc.registerTab({
            id: 'my_template_tab',
            title: 'My Template',
            icon: 'build'
        });

        window.vmc.registerSetting({
            id: 'my_setting',
            label: 'My Setting',
            category: 'General',
            tab: 'my_template_tab',
            type: 'checkbox',
            default: true
        });

        document.addEventListener('vmc-setting-change', (e) => {
            if (e.detail.id === 'my_setting') {
                console.log('my_setting changed to', e.detail.value);
            }
        });
    };

    if (window.vmc) {
        init();
    } else {
        const interval = setInterval(() => {
            if (window.vmc) {
                clearInterval(interval);
                init();
            }
        }, 100);
    }
})();
```

