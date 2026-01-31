# I-Catching

A luxury atelier website featuring mannequin lamps, latex couture, and art. Built with React, TypeScript, TailwindCSS, and Firebase.

## Features

### Public Website
- **One-page design** with smooth anchor navigation
- **Editorial dark aesthetic** with gold, bordeaux, and petrol accents
- **Hero section** with full-screen imagery
- **Circular carousel** for Latex Couture collection
- **Standard gallery grid** for other categories
- **Blog/Verhalen section** for stories
- **Contact form** with Firestore storage
- **Mobile-first responsive design**

### CMS Backend
- **Firebase Authentication** (email/password, admin-only)
- **Site Content management** for all frontpage text and images
- **Gallery management** with categories and image ordering
- **AI Image Editing** via OpenRouter integration
- **Blog post editor** with TipTap rich text
- **Inquiry/contact form management**

## Tech Stack

- **Frontend**: Vite + React + TypeScript
- **Styling**: TailwindCSS v4
- **Routing**: React Router v7
- **Forms**: React Hook Form
- **Editor**: TipTap
- **Backend**: Firebase (Auth, Firestore, Storage)
- **AI Proxy**: Node.js + Express
- **Icons**: Lucide React

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase project with Auth, Firestore, and Storage enabled

### Installation

```bash
# Install frontend dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

### Configuration

1. Copy `.env.example` to `.env`
2. Add your Firebase configuration
3. Add your OpenRouter API key (for AI image editing)

### Development

```bash
# Start the frontend (port 3000)
npm run dev

# In another terminal, start the API server (port 3001)
cd server
npm run dev
```

### Production Build

```bash
npm run build
```

## Project Structure

```
├── public/              # Static assets
├── server/              # Express API server for OpenRouter proxy
├── src/
│   ├── components/
│   │   ├── admin/       # CMS components
│   │   ├── public/      # Public website sections
│   │   └── ui/          # Reusable UI components
│   ├── context/         # React contexts (Auth, Toast)
│   ├── hooks/           # Custom hooks (Firestore)
│   ├── lib/             # Utilities (Firebase, types, storage)
│   └── pages/           # Route pages
├── firestore.rules      # Firestore security rules
├── storage.rules        # Storage security rules
└── vite.config.ts       # Vite configuration
```

## Firebase Setup

### Firestore Collections
- `siteContent` - Single document with all frontpage content
- `categories` - Gallery categories
- `categories/{id}/items` - Gallery images per category
- `blogPosts` - Blog entries
- `inquiries` - Contact form submissions
- `users` - User roles (admin verification)

### Creating an Admin User
1. Create a user in Firebase Console > Authentication
2. Add a document in Firestore at `users/{uid}` with:
   ```json
   {
     "email": "admin@example.com",
     "role": "admin",
     "createdAt": <timestamp>
   }
   ```

### Deploy Security Rules
```bash
firebase deploy --only firestore:rules,storage:rules
```

## Design System

### Colors
- **Anthracite**: Near-black base (#141418)
- **Gold**: Primary accent
- **Bordeaux**: Secondary accent
- **Petrol**: Tertiary accent
- **Cream**: Text color

### Typography
- **Headings**: Playfair Display (serif)
- **Body**: Inter (sans-serif)

## AI Image Editing

The CMS includes AI-powered image editing via OpenRouter. The workflow:
1. Admin selects an image in the gallery
2. Writes a prompt describing desired changes
3. Backend securely proxies request to OpenRouter
4. Generated image is previewed
5. Admin can save as new version or discard
6. Multiple versions tracked per image
7. Admin selects which version is "active" for the public site

**Note**: The OpenRouter API key is NEVER exposed to the client.

## License

Private - All rights reserved.

---

Built with ❤️ for I-Catching
