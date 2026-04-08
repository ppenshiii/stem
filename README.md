# SonicSplit: AI Stem Separator & Genre Classifier

SonicSplit is a fully containerized, lightweight API and web application that leverages sophisticated MLOps to conduct dual-phase audio processing: separating physical tracks into stems alongside identifying the overarching musical genre.

It features a premium frontend UI mapped to an optimized FastAPI Python backend and is designed to run consistently as a native web service bridging across Windows, macOS, and Linux servers.

## Features

- **Dual-Phase ML Pipeline**: Simultaneously categorizes musical input recursively using Hugging Face Transformers while dynamically stripping instrumentals out natively through Demucs.
- **Modern Web Interface**: Responsive, drag-and-drop enabled UI with glowing Audio Visualizers, glassmorphism aesthetics, and Spring-physics hover functionality.
- **FastAPI Backend**: Uses an asynchronous REST structure to seamlessly bundle heavy AI workflows asynchronously, automatically clearing RAM/Disk space after processing wraps up. 
- **Dockerized Foundation**: Hassle-free deployment natively running on port `80`. Resolves all complex Linux dependency issues (like `ffmpeg` constraints and PyTorch/Transformer pipeline integrations) out of the box.
- **Continuous Deployment**: Fully automated GitHub Actions pipeline executing `docker pull` locally onto your self-hosted runner directly trailing commits.

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

4. Since the platform now utilizes universal port 80 natively, you can access the interface cleanly by typing into your browser (bypassing any port number!):
   **[http://localhost](http://localhost)** 
   *(Network Mapping: Also accessible on other smartphones/laptops via your local WiFi IP address, e.g., `http://172.30.1.22`!)*

*Note: The very first time you trigger an analysis, the Hugging Face and Demucs packages will download roughly ~450MB of respective architecture neural weights into the background environment structure. Please be patient while your Terminal downloads these model buffers.*

---

## Infrastructure Operations

- **Build / Packaging**: The `Dockerfile` natively integrates Debian Linux `python:3.10-slim`.
- **CI/CD Lifecycle**: Structured sequentially inside `ci.yml`. On every `push` or merge to the `master` branch:
  1. Compiles the image dynamically via Docker `buildx` optimized layers.
  2. Pushes directly to Docker Hub registry endpoints.
  3. Reboots the locally configured GitHub Action Desktop Daemon seamlessly, shutting down obsolete components and running the integrated changes live on standard HTTP.
- **GitHub Secrets Managed**: Be sure you securely embed your `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets online under Repo configurations to prevent Docker Hub pipeline blocks!
