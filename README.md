# Application Cloudflare Workers + Pages (Full-Stack)

Cette application est configurée pour être déployée sur Cloudflare avec Workers (backend API) et Pages (frontend).

## Architecture

- **Frontend**: React + Vite, déployé sur Cloudflare Pages
- **Backend API**: Cloudflare Workers via `functions/_middleware.ts`
- **Routes API**: Disponibles sous `/api/`
- **KV Store**: Cache et stockage distribué (optionnel)

## Déploiement

### Option 1: Déploiement via GitHub (Recommandé)

1. Poussez votre code sur un dépôt GitHub
2. Connectez-vous à [Cloudflare Pages](https://pages.cloudflare.com/)
3. Cliquez sur "Create a project" et sélectionnez votre dépôt
4. Configurez les paramètres:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
5. Sous "Settings" > "Functions":
   - Configuration automatique avec `functions/_middleware.ts`
6. Cliquez sur "Save and Deploy"

### Option 2: Déploiement via Wrangler CLI

```bash
npm install
npm run build
wrangler pages deploy dist
```

## Configuration Environnement

### Variables d'environnement Cloudflare Pages

Dans les paramètres du projet Cloudflare:

1. **Settings** > **Environment variables**
2. Ajouter les variables (préfixées par `VITE_` pour le client):
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ENVIRONMENT=production
   ```

3. **Functions** > **KV Namespace Bindings** (optionnel)
   ```
   KV_NAMESPACE → votre-namespace-id
   ```

## API Endpoints

- `GET /api/health` - Vérifier l'état du service
- `GET /api/config` - Récupérer la configuration

## Développement Local

```bash
npm install
npm run dev
```

## Build Production

```bash
npm run build
npm run preview
```

## Déploiement avec Script

```bash
npm run deploy
```

## Fichiers Clés

- `wrangler.toml` - Configuration Cloudflare Workers/Pages
- `functions/_middleware.ts` - Handler API global
- `vite.config.ts` - Configuration Vite
- `_headers` - En-têtes HTTP de sécurité
- `_redirects` - Routage SPA

## Documentation Utile

- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare KV Documentation](https://developers.cloudflare.com/workers/runtime-apis/kv/)
