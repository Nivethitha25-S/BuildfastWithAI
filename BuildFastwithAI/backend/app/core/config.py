import os
from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "BharatSahay AI"
    API_V1_STR: str = "/api"
    
    # Gemini Configuration
    GEMINI_API_KEY: str = ""
    LLM_MODEL: str = "gemini-3.8-flash"
    EMBEDDING_MODEL: str = "models/text-embedding-004"
    
    # Database URL (defaults to SQLite for instant local zero-dependency execution)
    DATABASE_URL: str = "sqlite+aiosqlite:///./bharatsahay.db"
    
    # JWT Security
    JWT_SECRET_KEY: str = "bharatsahay_ai_jwt_secret_key_change_in_production_2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Storage Paths
    CHROMA_PERSIST_DIRECTORY: str = "./data/chroma"
    UPLOAD_DIR: str = "./data/uploads"
    MAX_UPLOAD_SIZE_MB: int = 25
    
    # CORS
    CORS_ORIGINS: Union[str, List[str]] = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
    
    @property
    def cors_origins_list(self) -> List[str]:
        if isinstance(self.CORS_ORIGINS, str):
            return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]
        return self.CORS_ORIGINS

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()


# Ensure directories exist
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.CHROMA_PERSIST_DIRECTORY, exist_ok=True)
