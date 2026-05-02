import lume from "lume/mod.ts";
import date from "lume/plugins/date.ts";
import slugify_urls from "lume/plugins/slugify_urls.ts";
import feed from "lume/plugins/feed.ts";
import sitemap from "lume/plugins/sitemap.ts";
import code_highlight from "lume/plugins/code_highlight.ts";
import { es } from "npm:date-fns/locale/es";
import slug from "./src/_data/slug.ts";

const site = lume({
  src: "./src",
  location: new URL("https://paigar.eu"),
  server: {
    port: 3000,
  },
});

site.copy("static", ".");
site.copy("styles");

site.use(date({ locales: { es } }));
site.use(slugify_urls({
  lowercase: true,
  alphanumeric: true,
  separator: "-",
  replace: {
    "ñ": "n",
    "Ñ": "N",
  },
}));
site.use(code_highlight());
site.use(sitemap());

site.filter("slug", slug);
site.use(feed({
  output: ["/feed.xml", "/feed.json"],
  query: "type=post",
  sort: "date=desc",
  limit: 20,
  info: {
    title: "PAIGAR",
    description: "Portal de Apuntes, Ideas, Garabatos, Artilugios y Retrofuturismo",
    lang: "es",
  },
  items: {
    title: "=title",
    description: "=excerpt",
    image: "=image",
    lang: "es",
  },
}));

export default site;
