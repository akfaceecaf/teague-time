import { defineManifest } from '@crxjs/vite-plugin';
import pkg from './package.json';

export default defineManifest({
  manifest_version: 3,
  name: 'Teague Time',
  version: pkg.version,
  description: "Was Jeff Teague at this game? Find out from the YouTube video you're watching.",
  content_scripts: [
    {
      matches: ['https://www.youtube.com/*'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle',
    },
  ],
});
