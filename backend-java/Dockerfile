# ---- 1. Build the jar with Maven ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn -q -B dependency:go-offline
COPY src ./src
RUN mvn -q -B package -DskipTests

# ---- 2. Run it on a small Java 21 image ----
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
# free hosting has little memory: let Java use at most 75% of it
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75 -XX:+UseSerialGC"
EXPOSE 8080
CMD ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]