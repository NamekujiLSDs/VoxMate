# VoxMate リソーススワッパー ドキュメント

VoxMate には、画像・CSS・その他のアセットをローカルのスワップフォルダに保存したファイルへ差し替えるための「Resource Swapper」機能が組み込まれています。

この機能を使うと、UI の画像差し替え、メニュー背景の変更、ロゴの置き換え、またはパッケージ内のリソースを直接編集せずに上書きすることができます。

---

## 1. 概要

リソーススワッパーは、要求されたリソースの URL やパスを、ローカルのファイルへ差し替える仕組みです。

リソースが読み込まれる際、VoxMate は次の順番で確認します。

1. ユーザー定義のスワップリスト
2. ビルトインのデフォルトスワップリスト
3. 対応するファイルが見つかれば、`vmc://` プロトコルを使ってローカルファイルを読み込む

これにより、`Documents/vmc-swap` 配下のファイルをゲーム内のリソースとして読み込めます。

---

## 2. 動作の仕組み

この機能は、主に次の 2 つで構成されています。

- アプリに同梱されたデフォルトのマッピング一覧
- ユーザーが作成する独自のマッピング一覧

優先順位は次の通りです。

- ユーザースワップリスト (`swapper-user.json`)
- デフォルトスワップリスト (`swapper-default.json`)

対応するファイルが存在すれば、VoxMate はそのファイルを `vmc://` URL で返します。

---

## 3. フォルダ構成

リソースは次のフォルダから読み込まれます。

- Windows の Documents フォルダ
- `vmc-swap/`

この中には自動的に次のサブフォルダが作られます。

- `css/`
- `crosshair/`
- `skybox/`
- `settings/`
- `userscript/`

必要なリソースに応じて、適切なフォルダへファイルを置きます。

---

## 4. 設定項目

リソーススワッパーは設定メニューから有効・無効を切り替えられます。

### 利用できる設定

- Enable Resource Swapper
  - 機能のオン・オフ
- Use Default Swapper List
  - 組み込みのデフォルト一覧を有効にする
- Use User Swapper List
  - `swapper-user.json` にあるユーザー定義のマッピングを有効にする

> 設定変更後はクライアントの再起動が必要な場合があります。

---

## 5. デフォルトスワップリスト

デフォルトのマッピング一覧は次の場所にあります。

- [src/assets/json/swapper-default.json](../src/assets/json/swapper-default.json)

この JSON には、元のリソース URL と置き換え用ファイルの対応関係が含まれています。

アプリ起動時に自動的に読み込まれます。

---

## 6. ユーザースワップリスト

独自の設定ファイルは次の場所に置きます。

- `Documents/vmc-swap/swapper-user.json`

このファイルは JSON オブジェクトで、キーに元のリソースの URL またはパス、値にスワップ対象ファイルの相対パスを指定します。

### 例

```json
{
  "https://example.com/assets/menu_background.jpg": "images/menu_background.jpg",
  "https://example.com/assets/title_logo.png": "images/title_logo.png"
}
```

この場合、実際のファイルは次の場所になります。

- `Documents/vmc-swap/images/menu_background.jpg`

---

## 7. カスタム置き換えの作り方

### 手順 1: スワップフォルダを開く

設定メニューの「Open Swapper Folder」ボタンからフォルダを開きます。

### 手順 2: 置き換え用ファイルを置く

差し替えたいファイルを、スワップフォルダ内の適切なディレクトリに配置します。

例:

- ロゴ: `Documents/vmc-swap/title_logo.png`
- 背景: `Documents/vmc-swap/menu_background.jpg`

### 手順 3: マッピングを追加する

`swapper-user.json` に対応関係を追記します。

### 手順 4: スワッパーを有効化する

Resource Swapper を有効にし、使いたい一覧が有効になっていることを確認します。

### 手順 5: クライアントを再起動する

リソースは読み込み時に適用されるため、再起動が必要なことが多いです。

---

## 8. 使えるケース

リソーススワッパーは次の用途で使えます。

- タイトルロゴの差し替え
- メニュー背景の変更
- CSS アセットの差し替え
- カスタム UI テクスチャのテスト
- 外部リソースをローカルファイルで上書き

---

## 9. 技術メモ

実装は次のファイルで管理されています。

- [src/main/services/swapper.js](../src/main/services/swapper.js)
- [src/main/utils/config.js](../src/main/utils/config.js)

処理内容は次の通りです。

- デフォルトのスワップリストを読み込む
- ユーザー定義のスワップリストを読み込む
- 対象ファイルが存在するか確認する
- 存在すれば `vmc://` URL を返す

---

## 10. トラブルシューティング

### スワッパーが効かない

次を確認してください。

- Resource Swapper が有効になっている
- 使用したい一覧（デフォルト・ユーザー）が有効になっている
- 対応ファイルが実際に存在する
- 設定変更後にクライアントを再起動した
- マッピングキーが正しい

### 対象ファイルが見つからない

マッピング先のファイルが存在しない場合、VoxMate はそのマッピングを無視して元のリソースを使います。

### 上書きが反映されない

リクエストされる URL やパスが、マッピングのキーと完全一致しているか確認してください。

---

## 11. 例テンプレート

```json
{
  "https://example.com/assets/menu_background.jpg": "images/menu_background.jpg"
}
```

そしてそのファイルを次の場所に置きます。

```text
Documents/vmc-swap/images/menu_background.jpg
```
