# VoxMate UserScript カスタム設定 API ドキュメント

VoxMate では、UserScript から F1 設定メニューへ独自の設定項目を追加できます。これにより、ユーザーはそのままゲーム内の設定メニューから UI を操作しながら、スクリプトの動作を変更できます。

このドキュメントでは、最小構成から実務的なサンプルまで順に説明します。

---

## 1. まず知っておくこと

UserScript からは、次の 2 つの API を使ってメニューへ参加できます。

- `window.vmc.registerSetting(...)`
  - 設定項目を追加します。
  - 例: チェックボックス、スライダー、入力欄、セレクトボックス、ボタン
- `window.vmc.registerTab(...)`
  - 左サイドバーに専用タブを追加します。
  - 追加したタブ内に設定項目を配置できます。

### 重要なポイント

- `category` は「現在のタブ内で見出しを作る」ためのものです。
- 左サイドバーに新しいタブを追加したい場合は、先に `registerTab` を呼びます。
- `tab` を指定しない場合、設定項目は既定の UserScript タブへ入ります。
- 設定変更は `vmc-setting-change` イベントで受け取ります。
- `id` は登録済みの他の設定と重複してはいけません。
- カスタムタブの `id` も一意であり、VoxMate の組み込みタブ ID を使ってはいけません。

### 予約済みタブ ID

次のタブ ID は VoxMate で予約済みなので、UserScript のカスタムタブとして使用しないでください。

| 予約済み ID | 内容 |
| :--- | :--- |
| `quickSetting` | クイック設定タブ |
| `renderingSetting` | レンダリング設定タブ |
| `skySetting` | スカイ設定タブ |
| `crosshairSetting` | クロスヘア設定タブ |
| `cssSetting` | CSS 設定タブ |
| `swapperSetting` | スワッパー設定タブ |
| `adblockSetting` | アドブロッカー設定タブ |
| `infoSetting` | 情報表示設定タブ |
| `userscriptSetting` | UserScript 設定タブ |
| `performanceSetting` | パフォーマンス設定タブ |

### 予約済みの設定ボディ ID

次の ID は VoxMate の設定 UI 本体で既に使われているため、カスタム設定 ID として再利用しないでください。

| 予約済み ID | 内容 |
| :--- | :--- |
| `menuBody` | 設定内容のメインコンテナ |
| `menuBodyTitle` | セクション見出しコンテナ |
| `menuBodyItem` | 標準の設定行コンテナ |
| `menuButton` | 共通ボタン用 ID |
| `enableCustomCrosshair` | クロスヘア切り替え項目 |
| `crosshairType` | クロスヘア種類選択項目 |
| `enableCustomCss` | CSS 切り替え項目 |
| `cssType` | CSS モード選択項目 |
| `enableResourceSwapper` | スワッパー切り替え項目 |
| `enableAdBlocker` | アドブロッカー切り替え項目 |
| `enableRawInput` | Raw Input 切り替え項目 |
| `enableDesynchronized` | Desynchronized 切り替え項目 |
| `enableSimpleInfo` | Info HUD 切り替え項目 |
| `infoPosition` | Info HUD 位置選択項目 |
| `unlimitedFps` | パフォーマンス切り替え項目 |

### 推奨プラクティス

- `my_mod_enabled` や `my_mod_theme` のように、説明的で一意な ID を使いましょう。
- `settings`, `tab`, `config` のような汎用名は避けましょう。
- 小さな設定を毎回新しいタブに分けるより、`category` で整理するほうが見やすいです。

### 衝突回避チェックリスト

UserScript を公開する前に、次の点を確認してください。

- タブ ID が VoxMate の予約済みタブ ID ではない。
- 設定 ID が他の登録済み設定と重複していない。
- カテゴリ名が `Quick Settings`, `Rendering`, `Sky`, `Crosshair`, `CSS`, `Swapper`, `Ad Blocker`, `Info`, `UserScript`, `Performance` のような組み込みセクション名と重複していない。意図的でない限り、同じ名前は避ける方が自然です。
- `my_mod_` や `my_script_` のような接頭辞を使って、衝突を防ぎましょう。

---

## 2. 最小構成の例

最もシンプルな例は、チェックボックス 1 個を追加する形です。

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

---

## 8. 実務向けの完全サンプル

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
