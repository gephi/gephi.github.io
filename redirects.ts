import type { RedirectConfig } from "astro";

const redirects: Record<string, RedirectConfig> = {
  "/developers": {
    status: 301,
    destination: "/contribute",
  },
  "/videos": {
    status: 301,
    destination: "/how-to/desktop",
  },
  "/screenshots": {
    status: 301,
    destination: "/how-to/desktop",
  },
  "/legal/faq": {
    status: 301,
    destination: "/faq",
  },
  "/legal/": {
    status: 301,
    destination: "/about",
  },
  "/features": {
    status: 301,
    destination: "/desktop",
  },
  "/plugins": {
    status: 301,
    destination: "/desktop/plugins",
  },
  "/users": {
    status: 301,
    destination: "/how-to/",
  },
  "/users/marketing": {
    status: 301,
    destination: "/logos",
  },
  "/users/contribute": {
    status: 301,
    destination: "/contribute",
  },
  "/users/support": {
    status: 301,
    destination: "/help",
  },
  "/users/requirements": {
    status: 301,
    destination: "https://docs.gephi.org/desktop",
  },
  "/users/gsoc": {
    status: 301,
    destination: "/about",
  },
  "/users/publications": {
    status: 301,
    destination: "/about",
  },
  "/gephi-lite": {
    status: 301,
    destination: "https://lite.gephi.org",
  },
};

export default redirects;
