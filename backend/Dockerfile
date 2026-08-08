# Multi-stage build per Java 21 Spring Boot
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Copia i file del backend
COPY . .

# Rendi eseguibile mvnw ed effettua la build del jar
RUN chmod +x mvnw && ./mvnw clean package -DskipTests

# Stage 2: Immagine leggera di esecuzione
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /app/target/backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-XX:+UseG1GC", "-XX:MaxRAMPercentage=75.0", "-Xmx384m", "-jar", "app.jar"]
