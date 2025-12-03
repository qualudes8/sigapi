FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source code
COPY src/ ./src/

# Create logs directory
RUN mkdir -p /app/logs

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "src/index.js"]
