from debian.deb822 import Release, Packages, Sources, Deb822
from modules.file import CachedFile


class ReleaseFile(Release):
    def __init__(self, path: str):
        super().__init__(CachedFile(path).load().read_bytes())

    def components(self):
        return self.get_as_string("Components").split(" ")

    def architectures(self):
        return self.get_as_string("Architectures").split(" ")


class PackagesFile(Packages):
    @staticmethod
    def fromFile(path: str):
        if not CachedFile(path).probe():
            blank: list[PackagesFile] = []
            return blank
        return [
            PackagesFile(i)
            for i in Packages.iter_paragraphs(CachedFile(path).load().read_bytes())
        ]


class SourcesFile(Deb822):
    @staticmethod
    def fromGzipFile(path: str):
        if not CachedFile(path).probe():
            blank: list[SourcesFile] = []
            return blank
        return [
            SourcesFile(i)
            for i in Sources.iter_paragraphs(
                CachedFile(path).load(is_gzip=True).read_bytes()
            )
        ]
