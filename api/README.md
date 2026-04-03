# API Backend (Bolt)

Ce dossier contient les endpoints API qui seront déployés sur Bolt.

## Structure

Chaque fichier dans ce dossier représente un endpoint API:
- `api/health.ts` → `/api/health`
- `api/config.ts` → `/api/config`

## Développement Local

Les endpoints API peuvent être testés localement via Bolt.

## Endpoints Disponibles

### GET /api/health
Vérification de l'état du service
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "bolt-backend"
}
```

### GET /api/config
Configuration de l'application
```json
{
  "environment": "production",
  "version": "1.0.0",
  "backend": "bolt",
  "supabaseUrl": "https://your-project.supabase.co"
}
```

## Ajouter un Nouveau Endpoint

1. Créer un nouveau fichier `.ts` dans ce dossier
2. Exporter une fonction handler par défaut
3. L'endpoint sera automatiquement disponible à `/api/nom-du-fichier`

Exemple:
```typescript
export default async function handler(req: any, res: any) {
  res.status(200).json({ message: 'Hello World' });
}
```
