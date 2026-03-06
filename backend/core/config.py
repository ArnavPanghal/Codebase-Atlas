from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GITHUB_TOKEN: str = ""
    DATABASE_URL: str = "sqlite:///./codebase_atlas.db"

    class Config:
        env_file = ".env"

config = Settings()
