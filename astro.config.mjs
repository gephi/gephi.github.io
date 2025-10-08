import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import icon from "astro-icon";
import { defineConfig } from "astro/config";
import redirects from "./redirects";

// https://astro.build/config
export default defineConfig({
  site: "https://gephi.org",
  output: "static",
  integrations: [icon(), react(), sitemap()],
  i18n: {
    // to add a locales just translate one page by using `{countrycode2}.astro` as filename
    locales: ["en"],
    defaultLocale: "en",
  },
  redirects,
});
