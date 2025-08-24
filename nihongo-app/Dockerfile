FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
#RUN npm run build  # Uncoment for production
#CMD ["npm", "run", "start"]
CMD ["npm", "run", "dev"]