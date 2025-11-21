# PostgreSQL Test Helper - デプロイメントガイド

このドキュメントは、PostgreSQL Test Helperをローカル環境のDockerコンテナとして稼働させる手順を説明します。

## 前提条件

- Docker Engine 20.10以降
- Docker Compose 2.0以降
- 2GB以上の空きメモリ

## クイックスタート

### 1. パッケージの展開

配布されたアーカイブを展開します:

```bash
tar -xzf testing-assistant-suite-YYYYMMDD_HHMMSS.tar.gz
cd testing-assistant-suite-YYYYMMDD_HHMMSS
```

### 2. 環境設定

#### 2-1. Docker Composeの設定

`.env`ファイルを編集し、外部Dockerネットワーク名を設定します:

```bash
# 必須: 接続先の外部Dockerネットワーク名
EXTERNAL_NETWORK=my_shared_network
```

#### 2-2. 外部ネットワークの準備

指定したDockerネットワークが存在しない場合は作成します:

```bash
docker network create my_shared_network
```

既存のネットワークを確認:
```bash
docker network ls
```

#### 2-3. バックエンドの設定

`backend/.env`ファイルを編集し、PostgreSQLデータベースの接続情報を設定します:

```bash
# 必須: データベース接続URL
DATABASE_URL=postgresql://username:password@host:5432/database

# 必須: 暗号化キー(本番環境では強力なキーを使用してください)
ENCRYPTION_KEY=your-secret-encryption-key-here

# オプション: DockerホストのIPアドレス
DOCKER_HOST_IP=172.19.0.1

# オプション: 別のdev containerにプロキシする場合のコンテナ名
TARGET_API_CONTAINER=
```

**重要な設定項目:**

- **`.env`ファイル（ルート）:**
  - `EXTERNAL_NETWORK`: このアプリケーションが接続する外部Dockerネットワーク名（必須）

- **`backend/.env`ファイル:**
  - `DATABASE_URL`: テスト対象のPostgreSQLデータベース接続文字列
  - `ENCRYPTION_KEY`: データベース内で暗号化されたデータを復号化するためのキー
  - `DOCKER_HOST_IP`: Dockerコンテナからホストマシン上のサービスにアクセスする場合のIPアドレス

### 3. Dockerイメージのビルド

```bash
docker-compose build
```

### 4. コンテナの起動

```bash
docker-compose up -d
```

### 5. アクセス確認

ブラウザで以下のURLにアクセスします:

- **フロントエンド**: http://localhost:3000
- **バックエンドAPI**: http://localhost:3001

ヘルスチェックエンドポイント:
```bash
curl http://localhost:3001/health
```

## コンテナ管理

### ログの確認

```bash
# 全てのログを表示
docker-compose logs -f

# バックエンドのログのみ
docker logs testing-assistant-suite -f
```

### コンテナの停止

```bash
docker-compose down
```

### コンテナの再起動

```bash
docker-compose restart
```

### コンテナの削除

```bash
docker-compose down -v
```

## トラブルシューティング

### コンテナが起動しない

1. ログを確認します:
   ```bash
   docker-compose logs
   ```

2. 環境変数が正しく設定されているか確認します:
   ```bash
   cat backend/.env
   ```

3. ポート3000と3001が他のプロセスで使用されていないか確認します:
   ```bash
   # Linux/Mac
   sudo lsof -i :3000
   sudo lsof -i :3001

   # Windows
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   ```

### データベースに接続できない

1. `DATABASE_URL`が正しいか確認します
2. データベースサーバーが起動しているか確認します
3. ネットワーク接続を確認します:
   ```bash
   docker exec -it testing-assistant-suite ping <database-host>
   ```

### ホストマシンのPostgreSQLに接続する場合

Dockerコンテナからホストマシン上のPostgreSQLに接続する場合:

1. PostgreSQLがすべてのインターフェースでリッスンしているか確認
2. `DATABASE_URL`のホストを`host.docker.internal`または`DOCKER_HOST_IP`で指定したIPアドレスに設定
3. PostgreSQLのファイアウォール設定を確認

例:
```bash
DATABASE_URL=postgresql://username:password@host.docker.internal:5432/database
```

または:
```bash
DOCKER_HOST_IP=172.19.0.1
DATABASE_URL=postgresql://username:password@172.19.0.1:5432/database
```

### 別のdev containerにプロキシする場合

同じDockerネットワーク内の別のコンテナ(例: Spring Boot API)にリクエストをプロキシする場合:

```bash
TARGET_API_CONTAINER=my-spring-api
```

**注意**: プロキシ先のコンテナは、同じ外部ネットワーク（`.env`の`EXTERNAL_NETWORK`で指定）に接続されている必要があります。

### 外部ネットワークのトラブルシューティング

#### ネットワークが存在しない

エラー: `network my_shared_network declared as external, but could not be found`

対処法:
```bash
docker network create my_shared_network
```

#### 他のコンテナと通信できない

1. 両方のコンテナが同じネットワークに接続されているか確認:
   ```bash
   docker network inspect my_shared_network
   ```

2. コンテナ名でpingできるか確認:
   ```bash
   docker exec -it testing-assistant-suite ping other-container-name
   ```

## ファイル構成

配布パッケージには以下の設定ファイルが含まれています:

```
testing-assistant-suite-YYYYMMDD_HHMMSS/
├── .env                    # Docker Compose用の設定（EXTERNAL_NETWORK）
├── docker-compose.yml      # コンテナ構成定義
├── backend/
│   └── .env                # バックエンドアプリケーションの環境変数
└── ...
```

- **`.env`**: Docker Composeが読み込む設定ファイル。ネットワーク名などの変数展開に使用
- **`backend/.env`**: コンテナ内のアプリケーションに渡される環境変数

## セキュリティに関する注意事項

1. **ENCRYPTION_KEY**: 本番環境では、強力でランダムな文字列を使用してください
2. **DATABASE_URL**: 認証情報を含むため、`.env`ファイルの権限を適切に設定してください
3. **ポート公開**: 必要に応じて、外部からのアクセスを制限してください
4. **外部ネットワーク**: 信頼できるコンテナのみが接続されているネットワークを使用してください

## アップデート手順

新しいバージョンにアップデートする場合:

1. 既存のコンテナを停止:
   ```bash
   docker-compose down
   ```

2. 新しいパッケージを展開

3. 旧バージョンの設定ファイルを新バージョンにコピー:
   ```bash
   # ルートの.env（EXTERNAL_NETWORK設定）
   cp old-version/.env new-version/.env

   # バックエンドの.env（データベース設定等）
   cp old-version/backend/.env new-version/backend/.env
   ```

4. 新バージョンのディレクトリに移動:
   ```bash
   cd new-version
   ```

5. イメージを再ビルド:
   ```bash
   docker-compose build --no-cache
   ```

6. コンテナを起動:
   ```bash
   docker-compose up -d
   ```

## サポート

問題が発生した場合は、以下の情報を添えて報告してください:

- `VERSION.txt`の内容
- `docker-compose logs`の出力
- エラーメッセージのスクリーンショット

---

**注意**: このアプリケーションは開発者のローカル環境での使用を想定しています。本番環境での使用には、追加のセキュリティ設定とパフォーマンスチューニングが必要です。
