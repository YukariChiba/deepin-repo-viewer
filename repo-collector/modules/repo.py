from modules.config import RepositoryConfig
from modules.repofiles import PackagesFile, ReleaseFile, SourcesFile


class RepositoryPackageList:
    config: RepositoryConfig
    dist: str
    component: str
    arch: str
    packages: list[PackagesFile]

    def getPackagesFiles(self):
        return PackagesFile.fromFile(
            f"{self.config['url']}/dists/{self.dist}/{self.component}/binary-{self.arch}/Packages"
        )

    def __init__(self, config: RepositoryConfig, dist: str, component: str, arch: str):
        self.config = config
        self.dist = dist
        self.component = component
        self.arch = arch

        self.packages = self.getPackagesFiles()


class RepositorySourceList:
    config: RepositoryConfig
    dist: str
    component: str
    sources: list[SourcesFile]

    def getSourcesFiles(self):
        return SourcesFile.fromGzipFile(
            f"{self.config['url']}/dists/{self.dist}/{self.component}/source/Sources.gz"
        )

    def __init__(self, config: RepositoryConfig, dist: str, component: str):
        self.config = config
        self.dist = dist
        self.component = component

        self.sources = self.getSourcesFiles()


class RepositoryComponent:
    config: RepositoryConfig
    dist: str
    component: str
    packagelists: dict[str, RepositoryPackageList]
    sourcelists: RepositorySourceList

    def __init__(
        self, config: RepositoryConfig, dist: str, component: str, archs: list[str]
    ):
        self.config = config
        self.dist = dist
        self.component = component
        self.packagelists = {}

        print(f"[{config['id']}] initializing dist {dist} component {component}")
        for arch in archs:
            self.packagelists[arch] = RepositoryPackageList(
                config, dist, component, arch
            )
        self.sourcelists = RepositorySourceList(config, dist, component)


class RepositoryDist:
    config: RepositoryConfig
    dist: str
    components: list[RepositoryComponent]

    def getReleaseFile(self):
        return ReleaseFile(f"{self.config['url']}/dists/{self.dist}/Release")

    def __init__(self, config: RepositoryConfig, dist: str):
        self.config = config
        self.dist = dist
        components = self.getReleaseFile().components()
        archs = self.getReleaseFile().architectures()
        self.components = [
            RepositoryComponent(self.config, self.dist, i, archs) for i in components
        ]


class Repository:
    config: RepositoryConfig
    dists: list[RepositoryDist]

    def __init__(self, config: RepositoryConfig):
        self.config = config
        self.dists = [
            RepositoryDist(self.config, dist) for dist in self.config.get("codenames")
        ]
