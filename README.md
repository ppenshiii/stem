# SonicSplit: AI Stem Separator

SonicSplit is a fully containerized, lightweight API and web application that leverages state-of-the-art AI (Demucs) to separate audio tracks into their constituent stems: vocals, drums, bass, and other.

It features a premium frontend UI mapped to an optimized FastAPI Python backend and is designed to run consistently on Windows, macOS, and Linux via Docker.

## Features

- **AI Separation**: Uses Facebook's Demucs (`htdemucs` CPU optimized) for high-grade source separation.
- **Modern Web Interface**: Responsive, drag-and-drop enabled interface with glassmorphism aesthetics.
- **FastAPI Backend**: Efficient background task management to handle large audio files and auto-cleanup temporary assets. 
- **Dockerized Foundation**: Hassle-free installation. Resolves all complex Linux dependency issues (like `ffmpeg` requirements and PyTorch weight bindings) natively out of the box.
- **Zero-Touch Deployments**: Fully automated GitHub Actions CI/CD to build and push container updates to Docker Hub.

---

## Getting Started

### Prerequisites
You only need to have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed on your machine.

### Running Locally

1. Clone this repository.
2. Open your terminal at the repository root.
3. Spin up the application using Docker Compose:

   ```bash
   docker compose up --build
   ```

4. Once the container is running and uvicorn boots, open your browser and navigate to:
   **[http://localhost:8000](http://localhost:8000)**

*Note: The first time you upload a track and press "Extract Stems", Demucs will automatically download its initial model weights. Processing will complete, and your browser will automatically download a `.zip` file of the separated tracks.*

---

## Infrastructure Operations

- **Build / Packaging**: The production `Dockerfile` runs on Debian Linux `python:3.10-slim`.
- **CI/CD Configuration**: Controlled via `ci.yml`. On every push to the `master` branch, GitHub Actions builds the image using Docker Buildx caching and pushes the image directly to your Docker Hub repository. 
- **Secrets Management**: Update your GitHub Repository Secrets (`DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`) to allow automated CI pushes.
