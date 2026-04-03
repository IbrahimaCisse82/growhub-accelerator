# Application Vercel + Bolt (Full-Stack)

Cette application est configurée pour être déployée sur Vercel (frontend) avec un backend sur Bolt.

## Architecture

- **Frontend**: React + Vite, déployé sur Vercel
- **Backend API**: Bolt via le dossier `/api`
- **Base de données**: Supabase
- **Routes API**: Disponibles sous `/api/`

## Déploiement

### Option 1: Déploiement via GitHub (Recommandé)

1. Poussez votre code sur un dépôt GitHub
2. Connectez-vous à [Vercel](https://vercel.com/)
3. Cliquez sur "Import Project" et sélectionnez votre dépôt
4. Configuration automatique détectée:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
5. Ajoutez les variables d'environnement (voir ci-dessous)
6. Cliquez sur "Deploy"

### Option 2: Déploiement via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
```

## Configuration Environnement

### Variables d'environnement Vercel

Dans le dashboard Vercel, allez dans **Settings** > **Environment Variables** et ajoutez:

```
VITE_API_URL=/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
NODE_ENV=production
```

### Variables locales

Créez un fichier `.env` à la racine:
```bash
cp .env.example .env
```

Puis remplissez les valeurs avec vos credentials Supabase.

## API Endpoints (Backend Bolt)

- `GET /api/health` - Vérification de l'état du service
- `GET /api/config` - Configuration de l'application

Pour ajouter de nouveaux endpoints, créez des fichiers `.ts` dans le dossier `api/`.

## Développement Local

```bash
npm install
npm run dev
```

L'application sera disponible sur `http://localhost:5173`

## Build Production

```bash
npm run build
npm run preview
```

## Structure du Projet

```
.
├── api/                    # Backend API (Bolt)
│   ├── health.ts          # Endpoint de santé
│   ├── config.ts          # Endpoint de configuration
│   └── README.md          # Documentation API
├── src/                   # Frontend React
│   ├── App.tsx
│   ├── main.tsx
│   └── ...
├── dist/                  # Build de production
├── vercel.json           # Configuration Vercel
├── vite.config.ts        # Configuration Vite
└── package.json
```

## Fichiers Clés

- `vercel.json` - Configuration Vercel (routing, headers, rewrites)
- `api/` - Endpoints backend déployés sur Bolt
- `vite.config.ts` - Configuration Vite
- `.env.example` - Template des variables d'environnement

## Connexion Supabase

L'application est configurée pour utiliser Supabase comme base de données. Assurez-vous d'avoir:

1. Un projet Supabase créé sur [supabase.com](https://supabase.com)
2. Les variables d'environnement configurées dans Vercel
3. Les migrations de base de données appliquées si nécessaire

## Documentation Utile

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Documentation](https://vitejs.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev/)
