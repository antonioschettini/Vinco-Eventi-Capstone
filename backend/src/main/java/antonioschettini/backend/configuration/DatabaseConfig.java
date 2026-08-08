package antonioschettini.backend.configuration;

import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSource dataSource(Environment env) {
        String dbUrl = env.getProperty("DB_URL");
        String databaseUrl = env.getProperty("DATABASE_URL");
        String internalDbUrl = env.getProperty("INTERNAL_DATABASE_URL");

        String rawUrl = dbUrl;
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = databaseUrl;
        }
        if (rawUrl == null || rawUrl.isBlank()) {
            rawUrl = internalDbUrl;
        }

        String username = env.getProperty("DB_USERNAME");
        String password = env.getProperty("DB_PASSWORD");

        if (rawUrl != null && !rawUrl.isBlank()) {
            String cleanUrl = rawUrl.trim();
            // Gestione dei formati postgres:// o postgresql:// forniti da Render, Heroku e Railway
            if (cleanUrl.startsWith("postgres://") || cleanUrl.startsWith("postgresql://")) {
                try {
                    String httpUrl = cleanUrl.replace("postgres://", "http://").replace("postgresql://", "http://");
                    URI uri = new URI(httpUrl);
                    String host = uri.getHost();
                    int port = uri.getPort() != -1 ? uri.getPort() : 5432;
                    String path = uri.getPath();

                    if (uri.getUserInfo() != null) {
                        String[] userInfo = uri.getUserInfo().split(":");
                        if (username == null || username.isBlank()) {
                            username = userInfo[0];
                        }
                        if ((password == null || password.isBlank()) && userInfo.length > 1) {
                            password = userInfo[1];
                        }
                    }

                    cleanUrl = "jdbc:postgresql://" + host + ":" + port + path;
                } catch (Exception e) {
                    System.err.println("[WARN DatabaseConfig] Impossibile parsare la URI del database, utilizzo del valore grezzo: " + e.getMessage());
                }
            } else if (!cleanUrl.startsWith("jdbc:")) {
                cleanUrl = "jdbc:" + cleanUrl;
            }

            if (username == null) username = env.getProperty("spring.datasource.username", "postgres");
            if (password == null) password = env.getProperty("spring.datasource.password", "postgres");

            System.out.println(">>> [DatabaseConfig] Configurazione DataSource riuscita su URL: " + cleanUrl);

            return DataSourceBuilder.create()
                    .driverClassName("org.postgresql.Driver")
                    .url(cleanUrl)
                    .username(username)
                    .password(password)
                    .build();
        }

        // Fallback default da spring.datasource.*
        String defaultUrl = env.getProperty("spring.datasource.url", "jdbc:postgresql://localhost:5432/vinco_eventi");
        String defaultUser = env.getProperty("spring.datasource.username", "postgres");
        String defaultPass = env.getProperty("spring.datasource.password", "postgres");

        return DataSourceBuilder.create()
                .driverClassName("org.postgresql.Driver")
                .url(defaultUrl)
                .username(defaultUser)
                .password(defaultPass)
                .build();
    }
}
