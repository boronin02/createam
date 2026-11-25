# ЭТАП 1: Сборка проекта
FROM maven:3.9.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn clean package -DskipTests

# ЭТАП 2: Запуск
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Копируем сертификаты Минцифры из репозитория внутрь контейнера
COPY src/main/resources/certs/russian_trusted_root_ca.cer /tmp/
COPY src/main/resources/certs/russian_trusted_sub_ca.cer /tmp/

# Импортируем сертификаты в хранилище Java внутри Alpine-образа
RUN keytool -import -trustcacerts -alias russian_root_ca -file /tmp/russian_trusted_root_ca.cer -keystore "$JAVA_HOME/lib/security/cacerts" -storepass changeit -noprompt && \
    keytool -import -trustcacerts -alias russian_sub_ca -file /tmp/russian_trusted_sub_ca.cer -keystore "$JAVA_HOME/lib/security/cacerts" -storepass changeit -noprompt && \
    rm -f /tmp/*.cer

COPY --from=builder /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]