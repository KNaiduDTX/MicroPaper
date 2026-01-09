"""
Configuration management for MicroPaper Python API
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # API Configuration
    api_key: str = ""
    admin_key: str = ""  # Separate key for admin operations (defaults to api_key if not set)
    environment: str = "development"
    
    # Database Configuration
    database_url: str = ""
    
    # CORS Configuration
    allowed_origins: List[str] = ["https://micropaper.vercel.app"]
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    
    class Config:
        env_file = ".env"
        case_sensitive = False
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Validate required settings
        if self.environment == "production":
            if not self.api_key:
                raise ValueError("API_KEY is required in production")
            if not self.database_url:
                raise ValueError("DATABASE_URL is required in production")
            # Admin key defaults to API key if not set (for MVP)
            if not self.admin_key:
                self.admin_key = self.api_key
        
        # Parse allowed origins from environment if provided
        if isinstance(self.allowed_origins, str):
            self.allowed_origins = [origin.strip() for origin in self.allowed_origins.split(",")]


# Create settings instance
settings = Settings()

