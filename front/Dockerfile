# ---------- BUILD STAGE ----------
    FROM node:18-alpine AS build
    WORKDIR /app
    
    # only package.json & lock → leverage cache
    COPY package*.json ./
    RUN npm install
    
    # copy rest, build
    COPY . .
    RUN npm run build
    
    # ---------- PRODUCTION STAGE ----------
    FROM nginx:alpine
    
    # copy build output into Nginx default folder
    COPY --from=build /app/build /usr/share/nginx/html
    
    # expose container port 80
    EXPOSE 80
    
    # run Nginx in foreground
    CMD ["nginx", "-g", "daemon off;"]
    