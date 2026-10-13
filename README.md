# 📖 YouthConnect Bible Quiz

Interactive Bible quiz app for youth meetings, Sunday schools, and family nights.
**"Guess the Bible hero from a selfie!"** — Players scan a QR code to join and compete in real-time.

🌐 **Live:** [youthconnect.church](https://youthconnect.church)

## Features

- **Selfie Mode**: Guess Bible characters from AI-generated "selfie" images
- **Real-time Multiplayer**: Up to 100 players via Pusher Channels
- **3 Difficulty Levels**: Easy (60+ characters), Medium (100+), Hard (100+)
- **Random Selection**: No fixed quizzes — each game draws random images
- **20+ Languages**: Russian (default), English, Ukrainian, Polish, German, and more
- **Mobile-first**: Optimized for phones, works on any screen
- **No Registration**: Guests play instantly; sign in for history and settings
- **Free**: Runs on free tiers of Vercel, Pusher, and Neon

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript + React 19
- **Real-time**: Pusher Channels (serverless WebSocket)
- **Database**: Neon Postgres + Drizzle ORM
- **Auth**: Auth.js v5 (Google + Yandex OAuth)
- **i18n**: next-intl
- **Payments**: Stripe Checkout (+ PayPal, Boosty, Crypto links)
- **Hosting**: Vercel

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
# Fill in the values (see "Environment Variables" below)

# Run development server
npm run dev

# For testing on phones in the same network:
npm run dev -- -H 0.0.0.0
```

Open:
- Landing page: http://localhost:3000
- Host screen: http://localhost:3000/play/host
- Player (join via QR or): http://localhost:3000/play?game=CODE

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

### Required: Pusher (Real-time)

1. Create account at [pusher.com](https://dashboard.pusher.com/)
2. Create a Channels app
3. Copy keys from "App Keys" tab

```env
PUSHER_APP_ID=your_app_id
PUSHER_SECRET=your_secret
NEXT_PUBLIC_PUSHER_KEY=your_key
NEXT_PUBLIC_PUSHER_CLUSTER=eu
```

### Required: Database (Neon Postgres)

1. Create account at [neon.tech](https://neon.tech)
2. Create a project and database
3. Copy connection string

```env
DATABASE_URL=postgres://user:pass@host/dbname?sslmode=require
```

### Required: Auth Secret

Generate with: `openssl rand -base64 32`

```env
AUTH_SECRET=your_generated_secret
```

### Optional: Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create OAuth 2.0 Client ID (Web application)
3. Add redirect URI: `https://yourdomain.com/api/auth/callback/google`

```env
AUTH_GOOGLE_ID=your_client_id
AUTH_GOOGLE_SECRET=your_client_secret
```

### Optional: Yandex OAuth

1. Go to [Yandex OAuth](https://oauth.yandex.ru/)
2. Create new app
3. Add redirect URI: `https://yourdomain.com/api/auth/callback/yandex`
4. Request scopes: login:email, login:info

```env
AUTH_YANDEX_ID=your_client_id
AUTH_YANDEX_SECRET=your_client_secret
```

### Optional: Stripe Donations

1. Create account at [stripe.com](https://dashboard.stripe.com)
2. Get API keys from Dashboard
3. Create Payment Link for donations

```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_DONATE_LINK=https://buy.stripe.com/...
```

### Optional: Other Donation Links

```env
NEXT_PUBLIC_PAYPAL_DONATE_LINK=https://paypal.me/yourlink
NEXT_PUBLIC_BOOSTY_LINK=https://boosty.to/yourpage
NEXT_PUBLIC_CRYPTO_LINK=https://nowpayments.io/donation/...
```

### Optional: Feature Flags

```env
# Show text quizzes (currently hidden for selfie-only mode)
NEXT_PUBLIC_ENABLE_TEXT_QUIZZES=false
```

## Database Migrations

After setting up `DATABASE_URL`, run migrations:

```bash
# Generate migration from schema
npx drizzle-kit generate

# Apply migration
npx drizzle-kit migrate
```

## Project Structure

```
src/
├── app/
│   ├── [locale]/           # i18n routes
│   │   ├── page.tsx        # Landing page
│   │   ├── play/
│   │   │   ├── page.tsx    # Player game page
│   │   │   └── host/       # Host screen
│   │   ├── auth/           # Sign in/error pages
│   │   ├── profile/        # User history
│   │   └── settings/       # User settings
│   ├── api/
│   │   ├── auth/           # Auth.js handlers
│   │   ├── join/           # Player join
│   │   ├── answer/         # Player answer
│   │   ├── host/           # Host events
│   │   └── donate/         # Stripe checkout
│   └── globals.css
├── auth/                   # Auth.js config
├── db/                     # Drizzle schema
├── data/
│   ├── characters.ts       # Character manifest with levels
│   └── quizzes.json        # Legacy fixed quizzes (kept for text mode)
├── i18n/                   # Internationalization config
├── lib/
│   ├── quiz-generator.ts   # Random quiz generation
│   ├── pusher-*.ts         # Pusher client/server
│   └── types.ts            # Shared types
└── components/
messages/                   # i18n translation files
public/images/selfie/       # Character selfie images
scripts/
└── import-selfies.mjs      # Image import script
```

## How It Works

1. **Host** opens `/play/host`, selects difficulty, shows QR code
2. **Players** scan QR, enter name, join lobby
3. **Host** starts game → 10 random questions from selected difficulty
4. Each question: 15 seconds, selfie image on host screen, 4 options on phones
5. Points: 500 base + up to 500 speed bonus
6. After each question: reveal answer, show leaderboard
7. Final results displayed on all screens

## Adding New Selfie Images

1. Add images to `src/selfie/` as `NN_CharacterName.png`
2. Update `src/data/characters.ts` with character info
3. Run: `node scripts/import-selfies.mjs`

This compresses images to `public/images/selfie/` and updates the quiz data.

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import repo in [Vercel](https://vercel.com)
3. Add environment variables in Settings
4. Deploy

### Manual

```bash
npm run build
npm start
```

## Internationalization

Currently supported languages:
- Russian (ru) - default
- English (en)
- Ukrainian (uk)
- Belarusian (be)
- Polish (pl)
- German (de)
- French (fr)
- Spanish (es)
- And 23 more languages...

Add translations in `messages/{locale}.json`.

## License

MIT © YouthConnect
