from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    groq_api_key: str
    groq_model: str = "llama-3.3-70b-versatile"
    database_url: str = "sqlite:///./flashmind.db"
    cors_origin: str = "http://localhost:5173"
    max_pdf_size_mb: int = 50
    cards_per_chunk: int = 5

    class Config:
        env_file = ".env"


settings = Settings()
