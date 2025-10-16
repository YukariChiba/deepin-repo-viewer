import json
from os import getenv
from pathlib import Path
from modules.manager import RepoManager
from modules.repo import Repository, RepositoryDist
from addict import Dict as AddDict


def set_default(obj):
    if isinstance(obj, set):
        return list(obj)
    raise TypeError


class PackageDistOverview:
    data: AddDict | None = None

    def __init__(self, dist: RepositoryDist, repoman: RepoManager):
        self.data = AddDict()
        for comp in dist.components:
            print(
                f"processing repo {dist.config['id']} dist {dist.dist} comp {comp.component}"
            )
            for source in comp.sourcelists.sources:
                srcpkg = source.get_as_string("Package")
                self.data[comp.component][srcpkg]["source"] = source.get_as_string(
                    "Version"
                )
            for arch in comp.packagelists.keys():
                for package in comp.packagelists[arch].packages:
                    srcpkg = package.source
                    binpkg = package.get_as_string("Package")
                    arch = package.get_as_string("Architecture")
                    ver = package.source_version.full_version
                    self.data[comp.component][srcpkg]["binary"][arch][binpkg] = ver
                    if self.data[comp.component][srcpkg]["source"]:
                        if self.data[comp.component][srcpkg]["source"] != ver:
                            self.data[comp.component][srcpkg]["meta"][
                                "version_mismatch"
                            ][arch] = True

        for gitinfo in repoman.packages:
            for comp in self.data.keys():
                if gitinfo["repo"] in self.data[comp].keys():
                    if "group" in gitinfo:
                        self.data[comp][gitinfo["repo"]]["github"] = {
                            "group": gitinfo["group"],
                        }
        processed = [
            [
                {"source": i, "component": j, "data": self.data[j][i]}
                for i in self.data[j].keys()
            ]
            for j in self.data.keys()
        ]
        processed = sum(processed, [])
        with open(
            Path(getenv("DATA_PATH", "data"))
            / f"{dist.config['id']}.{dist.dist.replace('/', '-')}.json",
            "w",
        ) as f:
            json.dump(processed, f, default=set_default)


class PackagesOverview:
    data = AddDict()

    def __init__(self, repos: list[Repository], repoman: RepoManager):
        for repo in repos:
            self.data[repo.config["id"]] = {"url": repo.config["url"], "dists": []}
            for dist in repo.dists:
                self.data[repo.config["id"]]['dists'].append(dist.dist)
                _ = PackageDistOverview(dist, repoman)
        with open(
            Path(getenv("DATA_PATH", "data")) / "index.json",
            "w",
        ) as f:
            json.dump(self.data, f, default=set_default)
