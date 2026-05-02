export const type = "post";
export const layout = "layouts/post.vto";

export const url = (page: { src?: { path?: string } } & Record<string, unknown>) => {
  const path = page?.src?.path ?? "";
  const basename = path.split("/").pop()?.replace(/\.[^.]+$/, "") ?? "untitled";
  return `/${basename}/`;
};
