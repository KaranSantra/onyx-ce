# 🐳 Onyx Stack Docker Quickstart

This guide provides commands to build, run, and tear down the **Onyx-com-stack Stack** application in both production and development environments using Docker Compose.

### 🔧 Build & Run

```bash
sudo docker compose -f docker-compose.dev-web.yml -p onyx-com-stack up -d --build --force-recreate
```

### 🛑 Stop Services

```bash
sudo docker compose -f docker-compose.dev-web.yml -p onyx-com-stack down
```

### 🧹 Stop & Remove Volumes

```bash
sudo docker compose -f docker-compose.dev-web.yml -p onyx-com-stack down -v
```

### Only update the backend api server

```bash
 sudo docker compose -f docker-compose.dev-web.yml -p onyx-com-stack up -d --build api_server
```
