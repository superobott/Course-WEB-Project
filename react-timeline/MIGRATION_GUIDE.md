# Migration Guide: Local MongoDB to MongoDB Atlas + Vercel Deployment

## Prerequisites
1. MongoDB Atlas account (free tier available)
2. Vercel account (free tier available)
3. Your existing API keys (Gemini API, Unsplash Access Key)

## Step 1: Set Up MongoDB Atlas

1. **Create a MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
   - Sign up for a free account

2. **Create a New Cluster**
   - Click "Create a New Cluster"
   - Choose the free tier (M0 Sandbox)
   - Select a region close to your users
   - Give your cluster a name

3. **Create Database User**
   - Go to "Database Access" in the left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create a username and strong password
   - Grant "Read and write to any database" privileges

4. **Configure Network Access**
   - Go to "Network Access" in the left sidebar
   - Click "Add IP Address"
   - For development: Add your current IP
   - For production: Add `0.0.0.0/0` (allows access from anywhere - Vercel needs this)

5. **Get Connection String**
   - Go to "Clusters" and click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - It will look like: `mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/`

## Step 2: Migrate Your Data

1. **Export Local Data (if you have existing data)**
   ```bash
   mongodump --db Timeline --out ./backup
   ```

2. **Import to Atlas**
   ```bash
   mongorestore --uri "mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/Timeline" ./backup/Timeline
   ```

## Step 3: Set Up Environment Variables

1. **Create `.env` file in the `server` directory:**
   ```env
   # MongoDB Atlas Configuration
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/Timeline?retryWrites=true&w=majority
   
   # API Keys
   GEMINI_API_KEY=your_actual_gemini_api_key
   UNSPLASH_ACCESS_KEY=your_actual_unsplash_access_key
   
   # Server Configuration
   PORT=4000
   NODE_ENV=production
   ```

2. **Replace placeholders:**
   - `<username>`: Your MongoDB Atlas database username
   - `<password>`: Your MongoDB Atlas database password
   - `<cluster-name>`: Your cluster name
   - Replace API keys with your actual keys

## Step 4: Test Locally

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Test the server:**
   ```bash
   npm run dev
   ```

3. **Verify connection:**
   - Check console for "MongoDB connected successfully"
   - Test your API endpoints

## Step 5: Deploy to Vercel

1. **Prepare for Deployment**
   - Make sure all changes are committed to Git
   - Push to your GitHub/GitLab repository

2. **Deploy on Vercel**
   - Go to [Vercel](https://vercel.com)
   - Sign up/login with your GitHub account
   - Click "New Project"
   - Import your repository
   - Vercel will auto-detect it's a React project

3. **Configure Environment Variables on Vercel**
   - In your Vercel dashboard, go to your project
   - Click on "Settings" tab
   - Click on "Environment Variables"
   - Add each environment variable:
     - `MONGODB_URI`: Your MongoDB Atlas connection string
     - `GEMINI_API_KEY`: Your Gemini API key
     - `UNSPLASH_ACCESS_KEY`: Your Unsplash access key
     - `NODE_ENV`: `production`

4. **Update CORS Configuration**
   - After deployment, get your Vercel app URL (e.g., `https://yourapp.vercel.app`)
   - Update the CORS origin in `server/server.js` line 12:
     ```javascript
     ? ['https://yourapp.vercel.app'] // Replace with your actual Vercel domain
     ```

5. **Redeploy**
   - Push the CORS update to trigger a new deployment
   - Or manually redeploy in Vercel dashboard

## Step 6: Test Production Deployment

1. **Test your live application**
   - Visit your Vercel app URL
   - Test all functionality
   - Check browser console for errors
   - Verify API calls are working

2. **Monitor logs**
   - Check Vercel function logs for any server errors
   - Use Vercel dashboard to monitor performance

## Troubleshooting

### Common Issues:

1. **MongoDB Connection Fails**
   - Check your connection string format
   - Verify network access allows `0.0.0.0/0`
   - Ensure username/password are correct

2. **CORS Errors**
   - Make sure your Vercel domain is in the CORS configuration
   - Check that credentials are set correctly

3. **Environment Variables Not Working**
   - Verify all environment variables are set in Vercel dashboard
   - Make sure variable names match exactly
   - Redeploy after adding environment variables

4. **Build Failures**
   - Check build logs in Vercel dashboard
   - Ensure all dependencies are in package.json
   - Verify Node.js version compatibility

### Useful Commands:

```bash
# Test locally
npm run server

# Check MongoDB connection
# Add this to server.js temporarily:
console.log('MongoDB URI:', process.env.MONGODB_URI);

# Build production version locally
npm run build
```

## Security Notes

- Never commit `.env` files to version control
- Use strong passwords for MongoDB Atlas
- Regularly rotate API keys
- Monitor usage in MongoDB Atlas dashboard
- Set up alerts for unusual database activity

## Performance Tips

- Use MongoDB Atlas monitoring to track performance
- Set up database indexes for frequently queried fields
- Consider implementing caching for heavy operations
- Monitor Vercel function execution time and costs

Your application should now be successfully migrated to MongoDB Atlas and deployed on Vercel! 