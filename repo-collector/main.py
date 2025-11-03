from dotenv import load_dotenv
from modules.collector import get_overview_from_configs
from modules.config import RepositoryConfigs, loadConfig


_ = load_dotenv()

def main():
    config_repos: RepositoryConfigs = loadConfig("repos.json") # pyright: ignore [reportAny]
    get_overview_from_configs(config_repos)

if __name__ == "__main__":
    main()
