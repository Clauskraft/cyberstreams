# 🚀 CYBERSTREAMS - QUICKSTART

Get Cyberstreams up and running in minutes!

## Option 1: Local Development (Fastest)

### Prerequisites
- Node.js 18+ installed
- Git installed

### Steps

1. **Clone the repository**
```bash
git clone https://github.com/Clauskraft/cyberstreams.git
cd cyberstreams
```

2. **Install dependencies**
```bash
npm ci
```

3. **Build the frontend**
```bash
npm run build
```

4. **Start the server**
```bash
npm start
```

5. **Open your browser**
```
http://localhost:3001
```

✅ **Done!** The application is running locally.

### Optional: Configure Environment

Create a `.env` file (optional for basic usage):
```env
PORT=3001
NODE_ENV=development
```

For full features, see `.env.example` for more configuration options.

---

## Option 2: Deploy to Railway (Production)

### Prerequisites
- Railway account (https://railway.app/)
- GitHub account

### Steps

1. **Sign up for Railway**
   - Go to https://railway.app/
   - Sign in with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `Clauskraft/cyberstreams`

3. **Add PostgreSQL Database** (Optional but recommended)
   - Click "+ New" in your project
   - Select "Database" → "PostgreSQL"
   - Railway automatically configures `DATABASE_URL`

4. **Deploy**
   - Railway automatically builds and deploys
   - Wait 2-3 minutes for build to complete

5. **Access Your App**
   - Railway provides a public URL
   - Click "Open App" to view

✅ **Done!** Your app is live on Railway.

### Add Custom Domain (Optional)

In Railway project settings:
1. Go to "Settings" → "Domains"
2. Click "Add Domain"
3. Enter your domain (e.g., cyberstreams.dk)
4. Update DNS records as instructed

---

## Option 3: Docker (Advanced)

### Prerequisites
- Docker installed
- Docker Compose installed (optional)

### Steps

1. **Build the Docker image**
```bash
docker build -t cyberstreams .
```

2. **Run the container**
```bash
docker run -p 3001:3000 cyberstreams
```

3. **Access the application**
```
http://localhost:3001
```

### With Docker Compose

```bash
docker-compose -f docker-compose.cyberintel.yml up
```

This starts:
- Cyberstreams application
- PostgreSQL database
- MISP (optional)
- OpenCTI (optional)

---

## Quick Feature Test

After starting the application, test these endpoints:

### Health Check
```bash
curl http://localhost:3001/api/health
```

### Daily Pulse
```bash
curl http://localhost:3001/api/daily-pulse
```

### Threats Stats
```bash
curl http://localhost:3001/api/threats
```

### Activity Stats
```bash
curl http://localhost:3001/api/stats
```

---

## ✅ Success Checklist

- [ ] Application starts without errors
- [ ] Browser loads at http://localhost:3001
- [ ] Dashboard displays threat statistics
- [ ] API endpoints respond correctly
- [ ] No console errors in browser

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3001
lsof -i :3001

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3002 npm start
```

### Build Fails

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Try build again
npm run build
```

### Database Connection Issues

For local development, the app works without a database (uses mock data).

For production with database:
1. Check `DATABASE_URL` is set correctly
2. Ensure PostgreSQL is running
3. Verify network connectivity

---

## Next Steps

1. **Read the full README**: [README.md](README.md)
2. **Deploy to Railway**: [RAILWAY_SETUP.md](RAILWAY_SETUP.md)
3. **Configure integrations**: See `.env.example`
4. **Explore the API**: Check `/api/*` endpoints
5. **Customize**: Modify themes and branding

---

## Support

- **Documentation**: Check project README files
- **Issues**: https://github.com/Clauskraft/cyberstreams/issues
- **Railway Help**: https://docs.railway.app/

---

**Happy coding! 🚀**
