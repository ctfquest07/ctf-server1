FROM node:20-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Bundle app source
COPY . .

# Expose port
EXPOSE 10000

# Define environment variables (should be overridden at runtime)
ENV NODE_ENV=production
ENV PORT=10000

# Start the application using PM2 (if installed globally or via script) or node directly
# Using node directly for Docker is often preferred unless using a process manager inside container
# We will use node server.js as the default, but PM2 is available via npm start if configured
CMD [ "node", "server.js" ]
