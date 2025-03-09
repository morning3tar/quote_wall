# Quote Wall

A real-time quote sharing application built with Next.js and Firebase.

## Features

- Real-time quote updates
- iMessage-style interface
- RTL support for multiple languages
- Mobile-responsive design
- Modern glass-morphism UI

## Tech Stack

- Next.js
- Firebase
- TailwindCSS
- Framer Motion

## Deployment

1. Fork or clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your Firebase configuration:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```
4. Deploy to Vercel:
   ```bash
   npx vercel
   ```

## Development

To run locally:

```bash
npm run dev
```

Visit `http://localhost:3000` 