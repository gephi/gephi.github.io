import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  output: "static",
  i18n: {
    // to add a locales just translate one page by using `{countrycode2}.astro` as filename
    locales: ["en"],
    defaultLocale: "en",
  },
});
