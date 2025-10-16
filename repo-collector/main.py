from dotenv import load_dotenv
from modules.collector import PackagesOverview
from modules.config import RepositoryConfigs, loadConfig
from modules.manager import RepoManager
from modules.repo import Repository

_ = load_dotenv()

def main():
    config_repos: RepositoryConfigs = loadConfig("repos.json") # pyright: ignore [reportAny]
    repositories = [Repository(i) for i in config_repos]
    _ = PackagesOverview(repositories, RepoManager())

if __name__ == "__main__":
    main()
