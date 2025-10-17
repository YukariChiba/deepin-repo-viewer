import type { RouteLocationNormalizedLoadedGeneric } from "vue-router";
import apis_data from "@/assets/apis.json";

type Repository = {
  url: string;
  dists: string[];
};

const fetchDataLocal = async (route: RouteLocationNormalizedLoadedGeneric) => {
  const res: [] = (
    await import(`@/assets/data/${route.query.repo}.${route.query.dist}.json`)
  ).default;
  return res;
};

const fetchIndexRemote = async (api: string) => {
  const res: Repository = await (await fetch(`${api}/index`)).json();
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

enum APIKeys {
  url = "url",
  title = "title",
}
type API = {
  [key in APIKeys]: string;
};
type APIs = Record<string, API>;

const getApi = (api: string | undefined) => {
  const apis: APIs = apis_data;
  if (api && apis[api]) return apis[api];
  return {
    url: "http://localhost:1234",
    title: "Default API",
  };
};

export { fetchDataLocal, fetchDataRemote, fetchIndexRemote, getApi };
