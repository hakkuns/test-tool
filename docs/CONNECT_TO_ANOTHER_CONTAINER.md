# 別の dev container に接続する方法

## 問題

Spring Boot の dev container がポートを公開していないため、`host.docker.internal`では接続できません。

## 解決策：同じ Docker ネットワークに接続

### ステップ 1: Spring Boot のネットワークを確認

```bash
# ホストマシンで実行
docker inspect spring-poc_devcontainer-app-1 | grep -A 5 Networks
```

例: `spring-poc_devcontainer_default` のようなネットワーク名が見つかるはずです。

### ステップ 2: このツールのコンテナを同じネットワークに接続

```bash
# ホストマシンで実行
docker network connect spring-poc_devcontainer_default test-tool-devcontainer-1
```

### ステップ 3: 接続を確認

この dev container 内で：

```bash
curl http://spring-poc_devcontainer-app-1:8080
```

### ステップ 4: 環境変数を設定

`backend/.env` に追加：

```env
TARGET_API_CONTAINER=spring-poc_devcontainer-app-1
```

### ステップ 5: バックエンドを再起動

```bash
cd backend
pnpm dev
```

### ステップ 6: テスト

フロントエンドで `http://localhost:8080/api/...` を使用すると、自動的に `http://spring-poc_devcontainer-app-1:8080/api/...` に変換されます。

## 永続的な設定

毎回手動で接続するのを避けるため、`.devcontainer/devcontainer.json` に追加：

```json
{
  "runArgs": ["--network=spring-poc_devcontainer_default"]
}
```

dev container を再ビルド：

```bash
Cmd/Ctrl + Shift + P → "Dev Containers: Rebuild Container"
```

## 注意事項

- Spring Boot アプリのコンテナ内ポート（通常 8080）を確認してください
- ネットワーク名はプロジェクトによって異なります（`docker network ls` で確認）
