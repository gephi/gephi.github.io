import { defineConfig } from "astro/config";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  output: "static",
  integrations: [icon()],
  i18n: {
    // to add a locales just translate one page by using `{countrycode2}.astro` as filename
    locales: ["en"],
    defaultLocale: "en",
  },
});
