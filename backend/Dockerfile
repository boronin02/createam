# Используем только среду выполнения (JRE), без Maven
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
# Копируем готовый .jar из папки target
COPY target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]