# 読書AIエージェント

写真をアップロードするだけで本を登録し、AIがおすすめの本を提案してくれる読書管理アプリです。

## 機能

- 写真から本のタイトル・著者・ジャンルを自動抽出（Vertex AI）
- 購入した本と同類のおすすめ本を提案
- ジャンルの偏りを防ぐ別ジャンルのおすすめ
- 読了/未読の管理（積読管理）
- おすすめ本のAmazonリンク表示

## 技術スタック

| カテゴリ | 技術 |
|---------|------|
| フレームワーク | Next.js 16 (App Router) |
| UI | React 19, Tailwind CSS, shadcn/ui |
| AI | Vertex AI (Gemini 2.5 Flash) |
| インフラ | Google Cloud Run |
| 認証 | Firebase Authentication (Identity Platform) |
| データベース | Cloud Firestore |
| 画像ストレージ | Cloud Storage for Firebase |

## アーキテクチャ

```
┌─────────────────┐     ┌─────────────────┐
│   スマホ/PC      │────▶│   Cloud Run     │
│   (Browser)     │◀────│   (Next.js)     │
└─────────────────┘     └────────┬────────┘
                                 │
        ┌────────────────────────┼────────────────────────┐
        │                        │                        │
        ▼                        ▼                        ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   Firestore   │    │Cloud Storage  │    │  Vertex AI    │
│   (データ)     │    │   (画像)      │    │  (Gemini)     │
└───────────────┘    └───────────────┘    └───────────────┘
```

## 環境変数

### クライアント用（.env.production）

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
```

## GCPセットアップ

### 1. 有効化が必要なAPI

- Identity Platform API
- Cloud Firestore API
- Cloud Storage API
- Vertex AI API
- Cloud Run API
- Cloud Build API
- Artifact Registry API

### 2. Firebaseコンソールでの設定

1. GCPプロジェクトをFirebaseに追加
2. Authentication > Google プロバイダを有効化
3. Firestore Database を作成
4. Storage を作成

### 3. セキュリティルール

**Firestore:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/books/{bookId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/recommendations/{recId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

**Cloud Storage:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/books/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## ローカル開発

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.example .env.local
# .env.local を編集

# 開発サーバー起動
npm run dev
```

## デプロイ

### Cloud Run へのデプロイ

```bash
# GCPプロジェクトを設定
gcloud config set project your_project_id

# デプロイ
gcloud run deploy book-ai-app \
  --source . \
  --region asia-northeast1 \
  --allow-unauthenticated
```

### デプロイ後の設定

1. **Identity Platform** > 設定 > セキュリティ > 承認済みドメインにCloud RunのURLを追加
2. **OAuth認証情報** > 承認済みのJavaScript生成元にCloud RunのURLを追加

## ディレクトリ構成

```
/
├── app/
│   ├── api/
│   │   └── analyze-book/    # Vertex AI 画像解析API
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/                  # shadcn/ui コンポーネント
│   ├── book-list.tsx        # 本棚一覧
│   ├── dashboard.tsx        # ホーム画面
│   ├── login-screen.tsx     # ログイン画面
│   ├── profile-view.tsx     # プロフィール
│   ├── recommendations-view.tsx  # おすすめ本
│   └── upload-modal.tsx     # 本の登録モーダル
├── lib/
│   ├── auth-context.tsx     # 認証コンテキスト
│   ├── firebase.ts          # Firebase初期化
│   ├── firestore.ts         # Firestore操作
│   └── storage.ts           # Cloud Storage操作
├── Dockerfile
├── .dockerignore
├── .gcloudignore
└── .env.production          # 本番用環境変数（要作成）
```

## 注意事項

- iOS Chromeではカメラ機能が制限されています。Safariの使用を推奨します。
- `NEXT_PUBLIC_*` 環境変数はビルド時に埋め込まれるため、`.env.production` ファイルが必要です。
