import json
from pathlib import Path
from typing import TypedDict

class RepositoryConfig(TypedDict):
    id: str
    url: str
    codenames: list[str]
    components: list[str] | None

type RepositoryConfigs = list[RepositoryConfig]

def loadConfig(filename: str): # pyright: ignore [reportAny]
    with open(Path() / "config" / filename) as f:
        return json.load(f) # pyright: ignore [reportAny]
