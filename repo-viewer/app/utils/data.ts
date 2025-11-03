import type { RouteLocationNormalizedLoadedGeneric } from "vue-router";
import { ExtraQuery } from "@/utils/query";

const fetchDataLocal = async (route: RouteLocationNormalizedLoadedGeneric) => {
  const res: [] = (
    await import(`@/assets/data/${route.query.repo}.${route.query.dist}.json`)
  ).default;
  return res;
};

const fetchIndexRemote = async (api: string) => {
  const res: Repositories = await (await fetch(`${api}/index`)).json();
  return res;
};

const fetchDataRemote = async (
  api: string,
  route: RouteLocationNormalizedLoadedGeneric,
  page: number = 1,
  per: number = 100,
  search: string | null = null,
  extraflags: ExtraQuery = new ExtraQuery(),
) => {
  const res = await (
    await fetch(
      `${api}/${route.query.repo}.${route.query.dist}/?_page=${page}&_per_page=${per}&q=${search || ""}&${extraflags.formatQueryString()}`,
    )
  ).json();
  return res;
};

export { fetchDataLocal, fetchDataRemote, fetchIndexRemote };
