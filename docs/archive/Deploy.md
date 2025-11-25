# FabZClean Production Deployment Guide

## Prerequisites

- Ubuntu 20.04+ or similar Linux distribution
- Python 3.11+
- MySQL 8.0+
- Nginx
- Systemd
- SSL certificate (Let's Encrypt recommended)

## Step 1: Server Setup

### Install Dependencies

```bash
sudo apt update
sudo apt install -y python3.11 python3.11-venv python3-pip mysql-server nginx
```

### Create Application User

```bash
sudo useradd -m -s /bin/bash fabzclean
sudo mkdir -p /var/www/fabzclean
sudo chown fabzclean:fabzclean /var/www/fabzclean
```

## Step 2: Application Deployment

### Clone Repository

```bash
cd /var/www/fabzclean
sudo -u fabzclean git clone <repo-url> .
```

### Setup Virtual Environment

```bash
sudo -u fabzclean python3.11 -m venv .venv
sudo -u fabzclean .venv/bin/pip install --upgrade pip
sudo -u fabzclean .venv/bin/pip install -r requirements.txt
```

### Configure Environment

```bash
sudo -u fabzclean cp .env.example .env
sudo -u fabzclean nano .env
```

Set the following in `.env`:
- `DATABASE_URL=mysql+pymysql://fabz:password@localhost:3306/fabzclean`
- `SECRET_KEY=<generate-secure-random-key>`
- `JWT_SECRET_KEY=<generate-secure-random-key>`
- `FLASK_ENV=production`
- `ALLOW_ORIGINS=https://your-domain.com,file://`

## Step 3: Database Setup

### Create MySQL Database

```bash
sudo mysql -u root -p
```

```sql
CREATE DATABASE fabzclean CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'fabz'@'localhost' IDENTIFIED BY 'secure-password';
GRANT ALL PRIVILEGES ON fabzclean.* TO 'fabz'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Run Migrations

```bash
cd /var/www/fabzclean
sudo -u fabzclean export FLASK_APP=src.app
sudo -u fabzclean .venv/bin/flask db upgrade
```

### Migrate Data (if applicable)

```bash
sudo -u fabzclean .venv/bin/python scripts/migrate_sqlite_to_mysql.py /path/to/fabzclean.db mysql+pymysql://fabz:password@localhost:3306/fabzclean
```

## Step 4: Static Files

### Setup Static Directory

```bash
sudo mkdir -p /var/www/fabzclean/static/qr
sudo mkdir -p /var/www/fabzclean/static/fonts
sudo chown -R fabzclean:fabzclean /var/www/fabzclean/static
```

## Step 5: Gunicorn Configuration

### Install Gunicorn

```bash
sudo -u fabzclean .venv/bin/pip install gunicorn
```

### Test Gunicorn

```bash
cd /var/www/fabzclean
sudo -u fabzclean .venv/bin/gunicorn -b 127.0.0.1:8000 "src.app:create_app('prod')"
```

## Step 6: Systemd Service

### Create Service File

```bash
sudo cp systemd/fabzclean.service /etc/systemd/system/
sudo nano /etc/systemd/system/fabzclean.service
```

Update the service file with:
- Correct `WorkingDirectory`
- Correct `DATABASE_URL`
- Correct Gunicorn path
- Correct user/group

### Enable and Start Service

```bash
sudo systemctl daemon-reload
sudo systemctl enable fabzclean
sudo systemctl start fabzclean
sudo systemctl status fabzclean
```

## Step 7: Nginx Configuration

### Copy Nginx Config

```bash
sudo cp nginx/fabzclean.conf /etc/nginx/sites-available/fabzclean
sudo ln -s /etc/nginx/sites-available/fabzclean /etc/nginx/sites-enabled/
```

### Update Configuration

Edit `/etc/nginx/sites-available/fabzclean`:
- Replace `<YOUR_DOMAIN_OR_IP>` with your domain or IP
- Update static file paths if needed

### Test and Reload Nginx

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## Step 8: SSL/TLS (Optional but Recommended)

### Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx
```

### Obtain Certificate

```bash
sudo certbot --nginx -d your-domain.com
```

### Auto-renewal

Certbot sets up auto-renewal automatically. Test with:

```bash
sudo certbot renew --dry-run
```

## Step 9: Firewall Configuration

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Step 10: Monitoring and Logs

### View Application Logs

```bash
sudo journalctl -u fabzclean -f
```

### View Nginx Logs

```bash
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Application Logs

```bash
sudo tail -f /var/www/fabzclean/fabzclean.log
```

## Step 11: Backup Setup

### Create Backup Directory

```bash
sudo mkdir -p /var/backups/fabzclean
sudo chown fabzclean:fabzclean /var/backups/fabzclean
```

### Setup Cron Job

```bash
sudo crontab -u fabzclean -e
```

Add:
```
30 2 * * * /var/www/fabzclean/scripts/backup_db.sh
```

## Health Check

Test the deployment:

```bash
curl http://localhost/healthz
```

Should return:
```json
{"status": "ok", "db": "ok"}
```

## Troubleshooting

### Service Won't Start

1. Check logs: `sudo journalctl -u fabzclean -n 50`
2. Verify database connection
3. Check file permissions
4. Verify environment variables

### Database Connection Issues

1. Verify MySQL is running: `sudo systemctl status mysql`
2. Test connection: `mysql -u fabz -p fabzclean`
3. Check firewall rules
4. Verify credentials in `.env`

### Static Files Not Serving

1. Check Nginx configuration
2. Verify file permissions
3. Check Nginx error logs
4. Verify static directory paths

## Maintenance

### Update Application

```bash
cd /var/www/fabzclean
sudo -u fabzclean git pull
sudo -u fabzclean .venv/bin/pip install -r requirements.txt
sudo -u fabzclean .venv/bin/flask db upgrade
sudo systemctl restart fabzclean
```

### Database Backup

Backups run automatically via cron. Manual backup:

```bash
sudo -u fabzclean /var/www/fabzclean/scripts/backup_db.sh
```

### Restore from Backup

```bash
mysql -u fabz -p fabzclean < /var/backups/fabzclean/fabzclean-YYYYMMDD-HHMMSS.sql.gz
```

