# Stage 1: Build stage
FROM maven:3.9-eclipse-temurin-22 AS build

# Establece el directorio de trabajo
WORKDIR /build

# Copia el pom.xml y descarga las dependencias (esto se cachea si pom.xml no cambia)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copia el código fuente
COPY src ./src

# Compila el proyecto
RUN mvn clean package -DskipTests

# Stage 2: Runtime stage
FROM eclipse-temurin:22-jre-alpine

# Establece el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copia el JAR compilado desde el stage de build
COPY --from=build /build/target/controlAsistencia-0.0.1-SNAPSHOT.jar app.jar

# Expone el puerto en el que la aplicación escucha
EXPOSE 8085

# Comando para ejecutar la aplicación Java
CMD ["java", "-jar", "app.jar"]



