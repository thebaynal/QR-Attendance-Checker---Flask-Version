# Deploying MaScan to Azure App Service

## What you need
- Azure for Students account (free at https://azure.microsoft.com/en-us/free/students/)
- [Azure CLI](https://learn.microsoft.com/en-us/cli/azure/install-azure-cli) installed
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed
- Git

---

## Step 1 — Log in to Azure

Open a terminal and run:

```bash
az login
```

A browser will open. Sign in with your school email (Azure for Students).

---

## Step 2 — Create a Resource Group

```bash
az group create --name mascan-rg --location eastasia
```

> You can change `eastasia` to a region closer to you (e.g. `southeastasia`, `eastus`).

---

## Step 3 — Create an Azure Container Registry (ACR)

This stores your Docker image.

```bash
az acr create --resource-group mascan-rg --name mascanregistry --sku Basic --admin-enabled true
```

> If `mascanregistry` is taken, use a unique name like `mascan2025registry`.

Get your ACR credentials:

```bash
az acr credential show --name mascanregistry
```

Note the **username** and one of the **passwords** — you'll need them next.

---

## Step 4 — Build and Push Docker Image

From the root of this repo:

```bash
# Log in to your container registry
az acr login --name mascanregistry

# Build the image
docker build -t mascanregistry.azurecr.io/mascan:latest .az acr create --resource-group mascan-rg --name mascanregistry --sku Basic --admin-enabled true

# Push it
docker push mascanregistry.azurecr.io/mascan:latest
```

---

## Step 5 — Create Azure App Service

```bash
# Create an App Service Plan (B1 is free tier eligible for students)
az appservice plan create \
  --name mascan-plan \
  --resource-group mascan-rg \
  --is-linux \
  --sku B1

# Create the Web App from your Docker image
az webapp create \
  --resource-group mascan-rg \
  --plan mascan-plan \
  --name mascan-app \
  --deployment-container-image-name mascanregistry.azurecr.io/mascan:latest
```

> If `mascan-app` is taken, use something unique like `mascan-attendance-2025`.

---

## Step 6 — Configure Environment Variables

```bash
az webapp config appsettings set \
  --resource-group mascan-rg \
  --name mascan-app \
  --settings \
    SECRET_KEY="replace-with-a-long-random-secret" \
    DB_PATH="/home/data/mascan_attendance.db" \
    SESSION_FILE_DIR="/home/flask_session" \
    WEBSITES_PORT=8000
```

> Generate a strong SECRET_KEY: run `python -c "import secrets; print(secrets.token_hex(32))"` in your terminal.

---

## Step 7 — Enable Persistent Storage

Azure App Service can mount persistent storage to `/home`. Enable it:

```bash
az webapp config appsettings set \
  --resource-group mascan-rg \
  --name mascan-app \
  --settings WEBSITES_ENABLE_APP_SERVICE_STORAGE=true
```

This keeps your database file alive across restarts.

---

## Step 8 — Give App Service access to your Registry

```bash
az webapp config container set \
  --name mascan-app \
  --resource-group mascan-rg \
  --docker-custom-image-name mascanregistry.azurecr.io/mascan:latest \
  --docker-registry-server-url https://mascanregistry.azurecr.io \
  --docker-registry-server-user mascanregistry \
  --docker-registry-server-password "<password-from-step-3>"
```

---

## Step 9 — Open your app

```bash
az webapp browse --resource-group mascan-rg --name mascan-app
```

Your app will be live at:
```
https://mascan-app.azurewebsites.net
```

Since it's HTTPS, **mobile camera will work automatically** — no warnings.

---

## Updating the app (after code changes)

Every time you make changes, just re-run:

```bash
docker build -t mascanregistry.azurecr.io/mascan:latest .
docker push mascanregistry.azurecr.io/mascan:latest
az webapp restart --resource-group mascan-rg --name mascan-app
```

---

## Troubleshooting

**Check logs if something goes wrong:**
```bash
az webapp log tail --resource-group mascan-rg --name mascan-app
```

**Restart the app:**
```bash
az webapp restart --resource-group mascan-rg --name mascan-app
```

---

## Cost estimate (Azure for Students)

| Resource | Cost |
|---|---|
| App Service B1 | ~$13/month (or free with student credits) |
| Container Registry Basic | ~$5/month |
| Storage | Negligible |

Azure for Students gives you **$100 free credits** — enough to run this for several months.
