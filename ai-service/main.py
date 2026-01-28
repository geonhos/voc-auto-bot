"""Main FastAPI application for VOC log analysis service."""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router, initialize_services


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events.

    Args:
        app: FastAPI application instance.
    """
    # Startup: Initialize services
    ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    embedding_model = os.getenv("EMBEDDING_MODEL", "nomic-embed-text")
    llm_model = os.getenv("LLM_MODEL", "gpt-oss:20b")

    print(f"Initializing services with Ollama at {ollama_base_url}...")
    print(f"Embedding model: {embedding_model}")
    print(f"LLM model: {llm_model}")

    initialize_services(
        ollama_base_url=ollama_base_url,
        embedding_model=embedding_model,
        llm_model=llm_model,
    )

    print("Services initialized successfully!")

    yield

    # Shutdown: Cleanup if needed
    print("Shutting down services...")


# Create FastAPI app
app = FastAPI(
    title="VOC Log Analysis AI Service",
    description="AI-powered log analysis service for VOC (Voice of Customer) using LangChain + Ollama",
    version="1.0.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development. Restrict in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)


@app.get("/")
async def root():
    """Root endpoint with service information."""
    return {
        "service": "VOC Log Analysis AI Service",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
    }


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8001"))
    host = os.getenv("HOST", "0.0.0.0")

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=True,
        log_level="info",
    )
