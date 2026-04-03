export default async function handler(req: any, res: any) {
  res.status(200).json({
    environment: process.env.NODE_ENV || 'production',
    version: '1.0.0',
    backend: 'bolt',
    supabaseUrl: process.env.VITE_SUPABASE_URL || ''
  });
}
