from typing import Dict
import yaml

from modules.file import CachedFile


class RepoManager:
    packages: list[dict[str, str]] = []

    def __init__(self):
        fdata = (
            CachedFile(
                "https://raw.githubusercontent.com/deepin-community/Repository-Manager/refs/heads/master/repos.yml"
            )
            .load()
            .read_bytes()
        )
        data = yaml.safe_load(fdata)
        self.packages = data["repos"]
