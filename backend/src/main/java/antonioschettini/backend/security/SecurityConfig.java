package antonioschettini.backend.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import org.springframework.beans.factory.annotation.Value;

import java.util.Arrays;
import java.util.List;

import antonioschettini.backend.repositories.UserRepository;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JWTFilter jwtFilter;

    @Autowired
    private RateLimitingFilter rateLimitingFilter;

    @Autowired
    private UserRepository userRepository;

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> userRepository.findByEmail(username)
                .orElseThrow(() -> new UsernameNotFoundException("Utente non trovato con email: " + username));
    }

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000,http://localhost:4173}")
    private String allowedOriginsRaw;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .headers(headers -> headers
                .frameOptions(frame -> frame.deny())
                .contentTypeOptions(contentType -> {})
                .xssProtection(xss -> {})
                .httpStrictTransportSecurity(hsts -> hsts.includeSubDomains(true).maxAgeInSeconds(31536000))
            )
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/", "/health", "/api/health", "/api/auth/**").permitAll()
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/quotes").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/quotes/*/calendar.ics").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/services", "/api/services/**", "/api/gallery", "/api/gallery/**", "/api/matrimonio-stats").permitAll()
                .requestMatchers("/api/admin/**").hasAuthority("ROLE_ADMIN")
                .anyRequest().authenticated()
            )
            .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        
        List<String> origins = new java.util.ArrayList<>();
        if (allowedOriginsRaw != null && !allowedOriginsRaw.isBlank()) {
            for (String origin : allowedOriginsRaw.split(",")) {
                if (!origin.trim().isEmpty()) {
                    origins.add(origin.trim());
                }
            }
        }
        
        List<String> defaults = List.of(
            "https://*.vercel.app",
            "https://vinco-eventi-capstone.vercel.app",
            "https://*.vincoeventi.com",
            "https://vincoeventi.com",
            "https://www.vincoeventi.com",
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:4173"
        );
        for (String def : defaults) {
            if (!origins.contains(def)) {
                origins.add(def);
            }
        }

        config.setAllowedOriginPatterns(origins);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
