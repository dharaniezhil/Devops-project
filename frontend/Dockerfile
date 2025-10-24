
# Use official Node image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy all project files
COPY . .

# Build the production app
RUN npm run build

# Use a lightweight web server to serve the build files
RUN npm install -g serve

# Expose port 3000
EXPOSE 3000

# Run the app
CMD ["serve", "-s", "dist", "-l", "3000"]
