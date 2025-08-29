import react from "@astrojs/react";
import icon from "astro-icon";
import { defineConfig } from "astro/config";
import redirects from "./redirects";

// https://astro.build/config
export default defineConfig({
  output: "static",
  integrations: [icon(), react()],
  i18n: {
    // to add a locales just translate one page by using `{countrycode2}.astro` as filename
    locales: ["en"],
    defaultLocale: "en",
  },
  redirects,
});
