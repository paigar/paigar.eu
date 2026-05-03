import prototipos from "./_data/prototipos.ts";

// Layout y type a nivel módulo: se aplican a todas las páginas que yield este
// generador. `type: "prototipo"` es lo que mantiene estas páginas FUERA de
// search.pages("type=post"), que es el filtro usado en home, archivo,
// etiquetas y related posts.
export const layout = "layouts/prototipo.vto";
export const type = "prototipo";

export default function* () {
  for (const proto of prototipos) {
    yield {
      url: `/${proto.kind}s/${proto.slug}/`,
      title: proto.name,
      // Activa el include dinámico en layouts/prototipo.vto:
      //   {{ include `prototipos/${kind}s/${prototype}.vto` }}
      prototype: proto.slug,
      // Datos del header y del footer del standalone
      kind: proto.kind,
      name: proto.name,
      tagline: proto.tagline,
      cover: proto.cover,
      articleUrl: proto.articleUrl,
      description: proto.tagline,
    };
  }
}
