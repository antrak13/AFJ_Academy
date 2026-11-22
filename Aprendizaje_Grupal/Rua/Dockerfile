# App principal (Next) para Railway. Se construye desde la RAÍZ del repositorio, porque la app
# sirve páginas que viven fuera de esta carpeta (inicio.html, login.html, Andre, aprendines).
# En Railway: Root Directory vacío y RAILWAY_DOCKERFILE_PATH=Aprendizaje_Grupal/Rua/Dockerfile
FROM node:22-slim
WORKDIR /app

COPY Aprendizaje_Grupal/Rua/package.json Aprendizaje_Grupal/Rua/package-lock.json Aprendizaje_Grupal/Rua/
RUN cd Aprendizaje_Grupal/Rua && npm ci

COPY . .
WORKDIR /app/Aprendizaje_Grupal/Rua
RUN npm run build

ENV NODE_ENV=production HOSTNAME=0.0.0.0 PORT=3000
EXPOSE 3000
CMD ["npm", "start"]
