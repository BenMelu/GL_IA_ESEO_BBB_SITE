FROM python:3.11-slim

WORKDIR /app

# Dépendances système nécessaires à OpenCV
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libmagic1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Cloud Run écoute TOUJOURS sur 8080
CMD ["gunicorn", "-b", ":8080", "main:app"]