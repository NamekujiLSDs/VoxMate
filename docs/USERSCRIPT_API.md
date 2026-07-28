# VoxMate UserScript Custom Settings API Documentation

VoxMate では、UserScript から簡単に F1 設定メニューに独自の設定項目（スライダー、チェックボックス、ドロップダウン、テキスト入力、ボタンなど）を追加し、**カテゴリ別のグループ化表示** や **専用サイドバータブの作成** ができる高度な API を提供しています。

---

## 1. クイックスタート

UserScript 内から `window.vmc.registerSetting` または `window.vmc.registerTab` を呼び出すだけで、VoxMate の設定メニュー内に動的コントロールや新しいタブが追加されます。

```javascript
// ==UserScript==
// @name         Voxiom Custom FOV & Mod
// @version      1.0
// @description  Adds custom FOV slider and custom tab to VoxMate menu.
// @author       Namekuji
// ==/UserScript==

(function() {
    'use strict';

    if (window.vmc && window.vmc.registerSetting) {

        // 1. カテゴリを指定して設定項目を定義
        window.vmc.registerSetting({
            id: 'fov_angle',
            label: 'Custom Field of View (FOV)',
            category: 'Graphics & Camera', // カテゴリ名でグループ化
            type: 'range',
            min: 60,
            max: 120,
            step: 1,
            default: 90
        });

        // 2. 設定変更のリアルタイム受信
        document.addEventListener('vmc-setting-change', (e) => {
            if (e.detail.id === 'fov_angle') {
                console.log('New FOV Value:', e.detail.value);
                applyFov(e.detail.value);
            }
        });
    }

    function applyFov(val) {
        // ゲームへの適用処理
    }
})();
```

---

## 2. カテゴリグループ化 (`category` プロパティ)

設定項目を登録する際、`category` プロパティを指定すると設定画面内で見出しヘッダー付きでカテゴリ別に美しく整理されて表示されます。

```javascript
// 「描画・カメラ」カテゴリ
window.vmc.registerSetting({
    id: 'fov_angle',
    label: 'Custom FOV Angle',
    category: 'Graphics & Camera',
    type: 'range',
    min: 60,
    max: 120,
    default: 90
});

// 「オートメーション」カテゴリ
window.vmc.registerSetting({
    id: 'auto_bhop',
    label: 'Enable BunnyHop Auto Jump',
    category: 'Automation & Movement',
    type: 'checkbox',
    default: true
});
```

---

## 3. 専用サイドバータブの作成 (`window.vmc.registerTab`)

UserScript 専用の新しいタブを F1 設定メニューの左サイドバーに追加したい場合は `registerTab` を使用します。

```javascript
// 1. 左サイドバーに独自タブを定義
window.vmc.registerTab({
    id: 'my_custom_mod',
    title: 'My Custom Mod',
    icon: 'auto_awesome' // Material Symbols のアイコン名
});

// 2. 登録したタブ ID を指定して項目を追加
window.vmc.registerSetting({
    tab: 'my_custom_mod', // 上で定義したタブ ID を指定
    category: 'General Mod Settings',
    id: 'mod_enabled',
    label: 'Enable Mod Features',
    type: 'checkbox',
    default: true
});
```

---

## 4. API リファレンス

### `window.vmc.registerTab(tabConfig)`
左サイドバーにオリジナルの設定タブを新規追加します。

| プロパティ | 型 | 必須 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **必須** | タブを一意に識別するID |
| `title` | `string` | **必須** | サイドバーに表示されるタブ名 |
| `icon` | `string` | オプション | Material Symbols のアイコン名 (デフォルト: `'tune'`) |

---

### `window.vmc.registerSetting(settingConfig)`
新しい設定コントロール項目を VoxMate メニューに登録します。

#### パラメータ (`settingConfig` オブジェクト)

| プロパティ | 型 | 必須 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | `string` | **必須** | 設定を一意に識別するキー（アルファベット・数字・アンダースコア） |
| `label` | `string` | **必須** | メニュー上に表示される項目ラベル名 |
| `type` | `string` | **必須** | コントロールのタイプ (`'checkbox'`, `'range'`, `'number'`, `'text'`, `'select'`, `'button'`) |
| `category` | `string` | オプション | セクションの見出しカテゴリ名 |
| `tab` | `string` | オプション | 配置先のタブID (`registerTab` で作成したID、または省略時 `'userscriptSetting'`) |
| `default` | `any` | オプション | 初期値 |
| `min` | `number` | オプション | `range`, `number` 時の最小値 |
| `max` | `number` | オプション | `range`, `number` 時の最大値 |
| `step` | `number` | オプション | `range`, `number` 時のステップ刻み値 |
| `options` | `Array<{label: string, value: any}>` | オプション | `select` 時の選択肢リスト |
| `buttonText` | `string` | オプション | `button` 時のボタン表示名 (デフォルト: `'RUN'`) |

---

### `window.vmc.getCustomSetting(id)`
指定された `id` の現在の設定値を取得します（`Promise` を返します）。

```javascript
const value = await window.vmc.getCustomSetting('fov_angle');
```

---

### `window.vmc.setCustomSetting(id, value)`
指定された `id` の設定値をプログラム側から変更し、メニュー表示と保存値を更新します。

```javascript
window.vmc.setCustomSetting('fov_angle', 100);
```

---

## 5. サポートされているコントロールタイプ一覧

### ① チェックボックス (`type: 'checkbox'`)
ON/OFF の切り替えスイッチ。

```javascript
window.vmc.registerSetting({
    id: 'enable_auto_jump',
    label: 'Enable Auto Jump (BunnyHop)',
    type: 'checkbox',
    default: true
});
```

### ② スライダー (`type: 'range'`)
数値範囲を調節するスライダーバー。

```javascript
window.vmc.registerSetting({
    id: 'crosshair_gap',
    label: 'Crosshair Gap Offset',
    type: 'range',
    min: 0,
    max: 50,
    step: 1,
    default: 5
});
```

### ③ 数値入力 (`type: 'number'`)
直接数値を入力するボックス。

```javascript
window.vmc.registerSetting({
    id: 'max_fps_cap',
    label: 'Custom Target FPS Cap',
    type: 'number',
    min: 30,
    max: 1000,
    step: 10,
    default: 240
});
```

### ④ テキスト / URL入力 (`type: 'text'`)
文字列を入力するテキストボックス。

```javascript
window.vmc.registerSetting({
    id: 'custom_hud_title',
    label: 'Custom Clan Tag / Name',
    type: 'text',
    default: 'VoxMate Player'
});
```

### ⑤ ドロップダウン (`type: 'select'`)
複数の選択肢から1つを選ぶプルダウンメニュー。

```javascript
window.vmc.registerSetting({
    id: 'theme_color',
    label: 'HUD Accent Theme Color',
    type: 'select',
    default: 'lime',
    options: [
        { label: 'Lime Green', value: 'lime' },
        { label: 'Cyan Blue', value: 'cyan' },
        { label: 'Hot Pink', value: 'pink' }
    ]
});
```

### ⑥ アクションボタン (`type: 'button'`)
クリックした際に関数を実行するボタン。

```javascript
window.vmc.registerSetting({
    id: 'reset_stats_btn',
    label: 'Reset Local Game Statistics',
    type: 'button',
    buttonText: 'RESET NOW'
});

document.addEventListener('vmc-setting-change', (e) => {
    if (e.detail.id === 'reset_stats_btn') {
        alert('Statistics reset!');
    }
});
```

---

## 6. イベントリスナー (`vmc-setting-change`)

ユーザーが F1 設定メニュー上で設定を変更すると、`document` に対して `vmc-setting-change` カスタムイベントが送出されます。

```javascript
document.addEventListener('vmc-setting-change', (e) => {
    const { id, value } = e.detail;
    console.log(`Setting [${id}] changed to:`, value);
});
```
