# Static IP Configuration Summary

## Your Static IP Details
- **Static IP Address**: `117.218.59.207`
- **Access URL**: `http://117.218.59.207:5000`
- **Location**: South, Coimbatore, Tamilnadu, CBTERP
- **Status**: Active

## Quick Access

Your staff can access the FabZClean application at:
```
http://117.218.59.207:5000
```

## Environment Configuration

Your production environment is configured with:
- **STATIC_IP**: 117.218.59.207
- **HOST**: 0.0.0.0 (accepts connections from any IP)
- **PORT**: 5000
- **ALLOWED_ORIGINS**: Automatically includes your static IP

## Testing the Configuration

### From the server:
```bash
curl http://localhost:5000/api/health
```

### From another machine:
```bash
curl http://117.218.59.207:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "FabZClean Server is running!"
}
```

## Firewall Configuration

Make sure port 5000 is open:
```bash
sudo ufw allow 5000/tcp
sudo ufw status
```

## Configuration Files

- **Environment**: `.env.production` (created with your static IP)
- **Service**: `fabzclean.service` (systemd service file)
- **Documentation**: `UBUNTU_DEPLOYMENT.md` (full deployment guide)

## Next Steps

1. Copy `.env.production` to `.env` on your Ubuntu server
2. Build the application: `npm run build`
3. Follow the deployment guide in `UBUNTU_DEPLOYMENT.md`

## Network Details from LDAP

- **Telephone**: 04259-232858
- **UserName**: ad4259232858_sid@ftth.bsnl.in
- **Framed-IP-Address**: 117.218.59.207
- **Framed-IP-Netmask**: 255.255.255.255
- **PackageID**: 500080735

---

Your application is ready to be accessed via `http://117.218.59.207:5000`

