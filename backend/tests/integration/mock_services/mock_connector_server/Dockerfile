FROM python:3.11.7-slim-bookworm

WORKDIR /app

# Install curl for uv installation
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install uv for faster Python package installation
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="/root/.local/bin:$PATH"

RUN uv pip install --system "pydantic-core>=2.28.0" fastapi uvicorn

COPY ./main.py /app/main.py

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"] 