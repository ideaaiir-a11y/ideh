# Cloudflare Deployment Steps

## Prerequisites
- Cloudflare account
- Wrangler CLI installed (already added to package.json)

## Step 1: Login to Cloudflare
```powershell
npx wrangler login
```

## Step 2: Create D1 Database
```powershell
npx wrangler d1 create ideh-db
```
Copy the database_id from the output and update `wrangler.toml`.

## Step 3: Create KV Namespace
```powershell
npx wrangler kv namespace create REMOTE_KV
```
Copy the id from the output and update `wrangler.toml`.

## Step 4: Update wrangler.toml
Replace the placeholder IDs in `wrangler.toml` with the actual IDs from steps 2-3.

## Step 5: Apply Prisma Schema to D1
```powershell
npx prisma db push --accept-data-loss
```

## Step 6: Deploy
```powershell
npm run build
npx wrangler pages project upload ideh
```

## Step 7: Set Environment Variables in Cloudflare Dashboard
Go to Cloudflare Dashboard > Pages > ideh > Settings > Environment Variables:
- ZAI_API_KEY = hn_bb36e4976b3f37054e52aa2e6a669fa4
- ZAI_BASE_URL = https://acdc.space-z.ai/api/v1

## Notes
- D1 is Cloudflare's SQLite-compatible database
- KV is used for remote-access config storage
- The app automatically detects Cloudflare environment and uses D1/KV bindings
