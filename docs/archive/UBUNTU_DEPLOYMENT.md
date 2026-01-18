# FabZClean Ubuntu Server Deployment Guide

This guide will walk you through deploying FabZClean on your Ubuntu server with static IP access.

## Prerequisites

- Ubuntu Server (20.04 LTS or later recommended)
- Node.js 18.x or later
- npm or yarn
- Static IP address configured on your server
- Root or sudo access

## Step 1: Install Node.js

```bash
# Update package list
sudo apt update

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

## Step 2: Install Application Dependencies

```bash
# Navigate to your application directory
cd /opt/fabzclean  # or your preferred location

# Install dependencies
npm install
```

## Step 3: Build the Application

```bash
# Build the frontend
npm run build

# Verify the dist directory was created
ls -la dist/
```

## Step 4: Configure Environment Variables

```bash
# Copy the example environment file
cp .env.production.example .env

# Edit the environment file with your settings
nano .env
```

Update the following variables in `.env`:

```env
NODE_ENV=production
HOST=0.0.0.0
PORT=5000
STATIC_IP=117.218.59.207
DATABASE_URL=./fabzclean.db
```

**Note:** Your static IP `117.218.59.207` is configured. The application will be accessible at `http://117.218.59.207:5000`

## Step 5: Configure Systemd Service

```bash
# Copy the service file
sudo cp fabzclean.service /etc/systemd/system/

# Edit the service file to match your installation path
sudo nano /etc/systemd/system/fabzclean.service
```

Update the service file paths if you installed in a different location:
- `WorkingDirectory`: Path to your application directory
- `ExecStart`: Path to `start.js` file
- `EnvironmentFile`: Path to your `.env` file
- `User`: User to run the service as (www-data, your user, etc.)

## Step 6: Set Permissions

```bash
# Set ownership (adjust user/group as needed)
sudo chown -R www-data:www-data /opt/fabzclean

# Set executable permissions
sudo chmod +x /opt/fabzclean/start.js

# Make sure database directory is writable
sudo chmod 755 /opt/fabzclean
```

## Step 7: Enable and Start the Service

```bash
# Reload systemd daemon
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable fabzclean.service

# Start the service
sudo systemctl start fabzclean.service

# Check service status
sudo systemctl status fabzclean.service
```

## Step 8: Configure Firewall

```bash
# Allow traffic on port 5000 (or your configured port)
sudo ufw allow 5000/tcp

# If using nginx reverse proxy, also allow port 80/443
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall (if not already enabled)
sudo ufw enable
```

## Step 9: Verify Deployment

```bash
# Check if the service is running
curl http://localhost:5000/api/health

# From another machine, test with your static IP
curl http://117.218.59.207:5000/api/health
```

You should see a JSON response like:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "FabZClean Server is running!"
}
```

## Step 10: Access the Application

Open your web browser and navigate to:
```
http://117.218.59.207:5000
```

Your staff can now access the application using your static IP address `117.218.59.207`.

## Optional: Nginx Reverse Proxy (Recommended)

Using nginx as a reverse proxy provides SSL/HTTPS support and better security.

### Install Nginx

```bash
sudo apt install nginx
```

### Create Nginx Configuration

Create a new configuration file:

```bash
sudo nano /etc/nginx/sites-available/fabzclean
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name 117.218.59.207;  # Your static IP address

    # Increase client body size for file uploads
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

### Enable the Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/fabzclean /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Optional: SSL with Let's Encrypt

If you have a domain name, you can set up SSL:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com

# Certbot will automatically configure nginx and set up auto-renewal
```

## Database Backup and Restore

### Backup Database

```bash
# Create backup directory
mkdir -p /opt/fabzclean/backups

# Backup SQLite database
cp /opt/fabzclean/fabzclean.db /opt/fabzclean/backups/fabzclean-$(date +%Y%m%d-%H%M%S).db

# Or use tar for compression
tar -czf /opt/fabzclean/backups/fabzclean-$(date +%Y%m%d-%H%M%S).tar.gz /opt/fabzclean/fabzclean.db
```

### Automated Backups (Cron Job)

Add to crontab for daily backups:

```bash
# Edit crontab
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * cp /opt/fabzclean/fabzclean.db /opt/fabzclean/backups/fabzclean-$(date +\%Y\%m\%d).db
```

### Restore Database

```bash
# Stop the service
sudo systemctl stop fabzclean.service

# Restore from backup
cp /opt/fabzclean/backups/fabzclean-YYYYMMDD.db /opt/fabzclean/fabzclean.db

# Set correct permissions
sudo chown www-data:www-data /opt/fabzclean/fabzclean.db

# Start the service
sudo systemctl start fabzclean.service
```

## Service Management

### View Logs

```bash
# View recent logs
sudo journalctl -u fabzclean.service -n 50

# Follow logs in real-time
sudo journalctl -u fabzclean.service -f

# View logs from today
sudo journalctl -u fabzclean.service --since today
```

### Restart Service

```bash
sudo systemctl restart fabzclean.service
```

### Stop Service

```bash
sudo systemctl stop fabzclean.service
```

### Check Service Status

```bash
sudo systemctl status fabzclean.service
```

## Troubleshooting

### Service Won't Start

1. Check logs:
   ```bash
   sudo journalctl -u fabzclean.service -n 100
   ```

2. Verify environment variables:
   ```bash
   sudo systemctl show fabzclean.service | grep Environment
   ```

3. Test application manually:
   ```bash
   cd /opt/fabzclean
   NODE_ENV=production node start.js
   ```

### Can't Access from External IP

1. Check firewall:
   ```bash
   sudo ufw status
   ```

2. Verify server is listening on 0.0.0.0:
   ```bash
   sudo netstat -tlnp | grep 5000
   ```

3. Check if static IP is correctly set in `.env`:
   ```bash
   cat /opt/fabzclean/.env | grep STATIC_IP
   ```

### CORS Errors

1. Verify CORS configuration in `.env`:
   ```bash
   cat /opt/fabzclean/.env | grep ALLOWED_ORIGINS
   ```

2. Check that `STATIC_IP` is set correctly

3. Review application logs for CORS warnings

### Database Issues

1. Check database file permissions:
   ```bash
   ls -la /opt/fabzclean/fabzclean.db
   ```

2. Verify database file exists:
   ```bash
   test -f /opt/fabzclean/fabzclean.db && echo "Database exists" || echo "Database missing"
   ```

3. Check database file size (should not be 0):
   ```bash
   ls -lh /opt/fabzclean/fabzclean.db
   ```

## Performance Optimization

### Increase Node.js Memory (if needed)

Edit the systemd service file:

```bash
sudo nano /etc/systemd/system/fabzclean.service
```

Add to `[Service]` section:

```ini
Environment="NODE_OPTIONS=--max-old-space-size=4096"
```

Then reload and restart:

```bash
sudo systemctl daemon-reload
sudo systemctl restart fabzclean.service
```

### Enable Log Rotation

Create logrotate configuration:

```bash
sudo nano /etc/logrotate.d/fabzclean
```

Add:

```
/var/log/fabzclean/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data www-data
    sharedscripts
}
```

## Security Recommendations

1. **Use HTTPS**: Set up SSL/TLS with nginx reverse proxy
2. **Firewall**: Only open necessary ports
3. **Regular Updates**: Keep system and dependencies updated
4. **Backups**: Set up automated database backups
5. **Monitoring**: Monitor service status and logs regularly
6. **User Permissions**: Run service with minimal required permissions

## Maintenance

### Update Application

```bash
# Pull latest code (if using git)
cd /opt/fabzclean
git pull

# Install new dependencies
npm install

# Rebuild application
npm run build

# Restart service
sudo systemctl restart fabzclean.service
```

### Update Dependencies

```bash
cd /opt/fabzclean

# Update all dependencies
npm update

# Or update specific package
npm update package-name

# Rebuild and restart
npm run build
sudo systemctl restart fabzclean.service
```

## Support

For issues or questions:
1. Check application logs: `sudo journalctl -u fabzclean.service`
2. Review this documentation
3. Check server system logs: `sudo journalctl -xe`

---

**Note**: Your static IP address `117.218.59.207` is configured. Update the service file paths if your installation directory differs from `/opt/fabzclean`.

