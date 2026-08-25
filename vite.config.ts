import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

/**
 * Ownership checks read the served HTML, so the tag has to be in index.html.
 * It is injected at build time from the environment rather than committed,
 * which keeps the token out of a public repository without taking it off the
 * live site. No token set, no tag, and the build still succeeds.
 */
function verificationTags(env: Record<string, string>): Plugin {
  const token = env.VITE_VIRTUALS_VERIFICATION;
  return {
    name: "verification-tags",
    transformIndexHtml(html) {
      if (!token) return html;
      return html.replace(
        "</head>",
        `  <meta name="virtual-protocol-site-verification" content="${token}" />
  </head>`,
      );
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), verificationTags(loadEnv(mode, process.cwd(), ""))],
  resolve: { alias: { "@": new URL("./src", import.meta.url).pathname } },
  server: { port: 3270, strictPort: true },
  preview: { port: 3270 },
}));
