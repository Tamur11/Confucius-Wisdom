FROM node:latest

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./

# Install node modules
RUN npm install

# Bundle app source
COPY . .

CMD [ "npm", "start" ]