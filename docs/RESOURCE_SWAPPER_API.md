# VoxMate Resource Swapper Documentation

VoxMate includes a built-in Resource Swapper feature that lets you redirect game resources such as images, CSS files, or other assets to files stored in your local swap folder.

This feature is useful for replacing UI assets, customizing menu backgrounds, changing logos, or overriding bundled resources without editing the app package directly.

---

## 1. Overview

The Resource Swapper works by mapping a requested URL or resource path to a local file.

When a resource is requested, VoxMate checks:

1. The user-defined swap list first
2. The built-in default swap list second
3. If a matching file exists locally, it redirects the request to a local virtual URL using the `vmc://` protocol

This allows the client to load custom assets from your Documents/vmc-swap folder.

---

## 2. How It Works

The swappable resource system is driven by two main pieces:

- A default mapping list bundled with the app
- An optional user-defined mapping list stored in the swap folder

The resolution order is:

- User swap list (`swapper-user.json`)
- Default swap list (`swapper-default.json`)

If the requested resource exists in the matched file path, VoxMate will serve it through the `vmc://` protocol.

---

## 3. Folder Structure

Resources are loaded from the following folder:

- Windows Documents folder
- `vmc-swap/`

Inside that folder, VoxMate creates these subfolders automatically:

- `css/`
- `crosshair/`
- `skybox/`
- `settings/`
- `userscript/`

You can place your custom assets in the appropriate folder depending on what you want to replace.

---

## 4. Configuration Options

The Resource Swapper can be enabled or disabled from the settings UI.

### Available settings

- Enable Resource Swapper
  - Turns the feature on or off.
- Use Default Swapper List
  - Enables the built-in list of resource mappings.
- Use User Swapper List
  - Enables custom mappings from your own `swapper-user.json` file.

> A restart may be required after changing these settings.

---

## 5. Default Swapper List

The default swapper list is stored in:

- [src/assets/json/swapper-default.json](../src/assets/json/swapper-default.json)

This file contains built-in mappings from original resource URLs to local replacement files.

The system reads this list automatically when the app starts.

---

## 6. User Swapper List

You can create your own file at:

- `Documents/vmc-swap/swapper-user.json`

The file should be a JSON object where the key is the original resource path or URL and the value is the relative path to the replacement file inside the swap folder.

### Example

```json
{
  "https://example.com/assets/menu_background.jpg": "images/menu_background.jpg",
  "https://example.com/assets/title_logo.png": "images/title_logo.png"
}
```

The value is resolved relative to the swap folder, so the actual file would be:

- `Documents/vmc-swap/images/menu_background.jpg`

---

## 7. How to Create Custom Replacements

### Step 1: Open the swap folder

Use the built-in "Open Swapper Folder" button from the settings menu.

### Step 2: Place your replacement file

Copy the file you want to replace into the appropriate directory inside the swap folder.

For example:

- Put a custom logo at `Documents/vmc-swap/title_logo.png`
- Put a custom background at `Documents/vmc-swap/menu_background.jpg`

### Step 3: Create a swap mapping

Add the mapping into `swapper-user.json`.

### Step 4: Enable the swapper

Turn on the Resource Swapper and make sure your preferred list is enabled.

### Step 5: Restart the client

The swapper is applied when the client loads resources, so a restart is usually required.

---

## 8. Supported Use Cases

The Resource Swapper can be used for:

- Replacing the title logo
- Replacing the menu background
- Overriding CSS assets
- Testing custom UI textures or images
- Providing local versions of external resources

---

## 9. Technical Notes

The swapper implementation is handled in:

- [src/main/services/swapper.js](../src/main/services/swapper.js)
- [src/main/utils/config.js](../src/main/utils/config.js)

The logic performs the following:

- Reads the default swap list from the bundled JSON file
- Reads the user swap list from the Documents swap folder
- Checks whether the target file exists
- Returns a `vmc://` URL if the replacement is valid

---

## 10. Troubleshooting

### The swapper does not seem to work

Check the following:

- Resource Swapper is enabled
- The correct list is enabled (default or user)
- The replacement file actually exists at the mapped path
- The app was restarted after changing the settings
- The requested resource key matches the one in the mapping file

### The file is not found

If the mapped target file does not exist, VoxMate will simply ignore the mapping and continue with the original resource.

### The override is not applied

Double-check that the resource request matches the mapping key exactly, including the full URL if applicable.

---

## 11. Example Template

```json
{
  "https://example.com/assets/menu_background.jpg": "images/menu_background.jpg"
}
```

And then place the file here:

```text
Documents/vmc-swap/images/menu_background.jpg
```
