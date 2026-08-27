import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  // Third arg '' loads vars without the VITE_ prefix. JIRA_* vars are deliberately
  // un-prefixed so they are never exposed to browser code via import.meta.env —
  // they exist only here, inside the dev-server process.
  const env = loadEnv(mode, process.cwd(), '')
  const { JIRA_BASE_URL, JIRA_EMAIL, JIRA_API_TOKEN } = env
  const configured = Boolean(JIRA_BASE_URL && JIRA_EMAIL && JIRA_API_TOKEN)

  if (!configured) {
    console.warn(
      '[jira-roulette] JIRA_BASE_URL / JIRA_EMAIL / JIRA_API_TOKEN not set — ' +
        'Jira proxy disabled. Copy .env.example to .env, or use ?mock=1.',
    )
  }

  const auth =
    'Basic ' + Buffer.from(`${JIRA_EMAIL}:${JIRA_API_TOKEN}`).toString('base64')

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: configured
        ? {
            '/jira': {
              target: JIRA_BASE_URL,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/jira/, ''),
              headers: { Authorization: auth },
            },
          }
        : undefined,
    },
  }
})
