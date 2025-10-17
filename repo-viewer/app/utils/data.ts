import type { RouteLocationNormalizedLoadedGeneric } from "vue-router";

const fetchDataLocal = async (route: RouteLocationNormalizedLoadedGeneric) => {
  const res: [] = (
    await import(`@/assets/data/${route.query.repo}.${route.query.dist}.json`)
  ).default;
  return res;
};

const fetchIndexRemote = async (api: string) => {
  const res = await (await fetch(`${api}/index`)).json();
  return res;
};

const fetchDataRemote = async (
  api: string,
  route: RouteLocationNormalizedLoadedGeneric,
  page: number = 1,
  per: number = 100,
  search: string | null = null,
  extraflags: { [key: string]: string } = {},
) => {
  const res = await (
    await fetch(
      `${api}/${route.query.repo}.${route.query.dist}/?_page=${page}&_per_page=${per}&q=${search || ""}&${Object.keys(
        extraflags,
      )
        .map((k) => `${k}=${extraflags[k]}`)
        .join("&")}`,
    )
  ).json();
  return res;
};

export { fetchDataLocal, fetchDataRemote, fetchIndexRemote };
