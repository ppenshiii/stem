# Use Python slim as the base. 
# It runs under Debian Linux natively, solving the Linux-based environment requirement
FROM python:3.10-slim

# Set working directory
WORKDIR /workspace

# Install system dependencies
# ffmpeg is completely required by torchaudio and demucs
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy requirements file
COPY requirements.txt .

# Install dependencies. Using pip no-cache-dir to reduce image size
# Extra index URL for CPU-only PyTorch so we don't accidentally install cuda drivers
RUN pip install --no-cache-dir -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

# Copy the app source code
COPY app/ ./app/

# Create necessary directories
RUN mkdir -p uploads outputs

# Expose FastAPI port
EXPOSE 8000

# Run uvicorn web server
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
