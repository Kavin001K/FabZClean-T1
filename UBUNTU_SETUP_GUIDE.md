# FabZClean Ubuntu Server Setup Guide

Follow these steps to deploy FabZClean on a fresh Ubuntu server.

## Step 1: Update System & Install Git

First, ensure your server is up to date and has Git installed.

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl
```

## Step 2: Install Docker & Docker Compose

We'll use the official installation script for convenience.

```bash
# Download and run the Docker installation script
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your current user to the docker group (avoids using sudo for every docker command)
sudo usermod -aG docker $USER

# Activate the group changes (or log out and log back in)
newgrp docker

# Verify installation
docker --version
docker compose version
```

## Step 3: Clone the Application

Clone the repository to your server.

```bash
# Navigate to your desired directory (e.g., home)
cd ~

# Clone the repository
git clone https://github.com/Kavin001K/FabZClean-T1.git

# Move into the directory
cd FabZClean-T1
```

## Step 4: Configure Environment

Create your production environment file.

1.  **Create the .env file:**
    ```bash
    cp .env.example .env
    ```

2.  **Edit the file (Optional but recommended):**
    You can use `nano` to edit the file.
    ```bash
    nano .env
    ```
    *   **Important**: Change `JWT_SECRET` to a random secret string.
    *   If you have a static IP, set `STATIC_IP=your_server_ip`.
    *   Press `Ctrl+O`, `Enter` to save, and `Ctrl+X` to exit.

## Step 5: Build and Run

Now, let Docker do the heavy lifting.

```bash
# Build the application image
docker compose build

# Start the application in the background
docker compose up -d
```

## Step 6: Verify Deployment

1.  **Check Status:**
    ```bash
    docker compose ps
    ```
    You should see `fabzclean-app` running (State: Up).

2.  **View Logs (if needed):**
    ```bash
    docker compose logs -f
    ```

3.  **Access the App:**
    Open your browser and navigate to:
    `http://<YOUR_SERVER_IP>:5000`

## Maintenance Commands

*   **Stop the server:** `docker compose down`
*   **Update the app:**
    ```bash
    git pull
    docker compose build --no-cache
    docker compose up -d
    ```
