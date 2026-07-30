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
- For initial state on script startup, call `await window.vmc.getCustomSetting(id)` or handle the initial `vmc-setting-change` event after registration.
- `id` values must be unique across all registered settings.
- Custom tab IDs must be unique and must not reuse built-in VoxMate tab IDs.

### Reserved Tab IDs

The following tab IDs are reserved by VoxMate and should not be used for custom UserScript tabs:

| Reserved ID | Reason |
| :--- | :--- |
| `quickSetting` | Built-in Quick Settings tab |
| `renderingSetting` | Built-in Rendering tab |
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

Before publishing a UserScript, verify the following:

- The tab ID is not one of the reserved VoxMate tab IDs.
- The setting ID is not already used by another registered setting.
- The category name does not duplicate built-in section names such as `Quick Settings`, `Rendering`, `Crosshair`, `CSS`, `Swapper`, `Ad Blocker`, `Info`, `UserScript`, or `Performance` unless you intentionally want that appearance.
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

## 3. Creating a Custom Tab

If you want to create a dedicated tab and group your settings inside it, write code like the following:

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

## 4. Using Categories

Specifying `category` creates a section heading inside the tab.

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

> `category` only creates a section heading. To create a new tab in the left sidebar itself, `registerTab` is required.

---

## 5. API Reference

### `window.vmc.registerTab(tabConfig)`

Adds a custom settings tab to the left sidebar.

| Property | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Yes | Unique ID identifying the tab |
| `title` | `string` | Yes | Title displayed in the sidebar |
| `icon` | `string` | Optional | Material Symbols icon name. Default is `tune` |

#### Example

```javascript
window.vmc.registerTab({
    id: 'my_mod_tab',
    title: 'My Mod',
    icon: 'auto_awesome'
});
```

---

### `window.vmc.registerSetting(settingConfig)`

Registers a new setting entry in the menu.

| Property | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Yes | Unique key identifying the setting. Alphanumeric characters and underscores recommended |
| `label` | `string` | Yes | Name displayed on the menu |
| `type` | `string` | Yes | One of `checkbox`, `range`, `number`, `text`, `select`, or `button` |
| `category` | `string` | Optional | Category header displayed within the current tab |
| `tab` | `string` | Optional | Target tab ID. Placed in `userscriptSetting` if omitted |
| `default` | `any` | Optional | Default / initial value |
| `min` | `number` | Optional | Minimum value for `range` and `number` |
| `max` | `number` | Optional | Maximum value for `range` and `number` |
| `step` | `number` | Optional | Step increment for `range` and `number` |
| `options` | `Array<{label: string, value: any}>` | Optional | Options for `select` |
| `buttonText` | `string` | Optional | Display text for `button`. Default is `RUN` |

#### Example

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

Retrieves the specified setting value. Returns a `Promise`.

```javascript
const value = await window.vmc.getCustomSetting('mod_enabled');
```

---

### `window.vmc.setCustomSetting(id, value)`

Changes the setting value programmatically, updating the menu UI state and persisted value.

```javascript
window.vmc.setCustomSetting('mod_speed', 7);
```

---

### `window.vmc.registerKeybind(config)`

Registers a shortcut key that automatically toggles a boolean custom setting or triggers a callback, with a Toast notification displayed in the bottom-right corner.

| Property | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Optional | Unique ID for the keybind |
| `key` | `string` | Yes | The key to listen for (e.g. `'\\'`, `'k'`, `'='`, `'i'`). Set to `""` or `null` to clear |
| `settingId` | `string` | Optional | Target custom setting ID to toggle on key press |
| `callback` | `function` | Optional | Function executed on key press |

> **Notes**:
> - **Multi-Feature Keybinding**: If multiple features or settings are assigned to the same key, all bound features execute simultaneously on keypress.
> - **Clearing Keybinds**: Pressing `Backspace` or `Escape` during UI key assignment clears the shortcut key (sets it to `Blank` / `None`).

#### Example

```javascript
window.vmc.registerKeybind({
    id: 'keybind_silentAim',
    key: '\\',
    settingId: 'esp_silentAim'
});
```

---

### `window.vmc.showToast(message, type, duration)`

Displays a sleek toast notification overlay in the bottom-right corner of the screen.

```javascript
window.vmc.showToast('Silent Aim: <span style="color:white">ON</span>');
```

---

## 6. Supported Controls

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

When the button is clicked, `vmc-setting-change` is fired with `id` and `value: true`.

---

## 7. Event `vmc-setting-change`

When a user changes a setting item, a custom event named `vmc-setting-change` is dispatched on `document`.

```javascript
document.addEventListener('vmc-setting-change', (e) => {
    const { id, value } = e.detail;
    console.log('changed', id, value);
});
```

### Usage Example

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

## 8. Practical Full Example

Below is a complete example combining tabs, categories, multiple settings, and event handling:

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

## 9. Implementation Notes

- Ensure `id` values are unique across all registered settings.
- `category` only creates section headings; use `registerTab` if you want a dedicated sidebar tab.
- If `tab` is omitted, the setting is placed in the default UserScript tab.
- Setting values are stored by VoxMate and persisted across application restarts.
- UI changes in your script should generally be handled by listening to the setting change event.

---

## 10. Ready-to-Use Template

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
