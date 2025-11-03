import apis_data from "@/assets/apis.json";

type Distribution = {
  name: string;
  comps: string[];
};

type Repository = {
  url: string;
  dists: Distribution[];
  updated: number;
};

type Repositories = Record<string, Repository>;

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

export { getApi };
export type { APIs, Repositories, Repository, Distribution };
