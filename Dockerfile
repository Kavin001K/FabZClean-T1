FROM python:3.11-slim as builder

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --user -r requirements.txt

FROM python:3.11-slim

WORKDIR /app

# Copy Python packages from builder
COPY --from=builder /root/.local /root/.local

# Copy application code
COPY . .

# Make sure scripts are executable
RUN chmod +x scripts/*.sh scripts/*.py

# Add local bin to PATH
ENV PATH=/root/.local/bin:$PATH

# Set Flask app
ENV FLASK_APP=src.app

# Expose port
EXPOSE 3000

# Default command
CMD ["bash", "-lc", "flask db upgrade && gunicorn -b 0.0.0.0:3000 -w 3 'src.app:create_app(\"prod\")'"]

