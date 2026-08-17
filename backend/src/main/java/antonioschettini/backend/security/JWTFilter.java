package antonioschettini.backend.security;

import antonioschettini.backend.entities.User;
import antonioschettini.backend.enums.Role;
import antonioschettini.backend.exceptions.UnauthorizedException;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
public class JWTFilter extends OncePerRequestFilter {

    @Autowired
    private JWTTools jwtTools;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String accessToken = authHeader.substring(7);
        try {
            Claims claims = jwtTools.extractClaimsFromToken(accessToken);
            String email = claims.getSubject();
            String roleStr = claims.get("role", String.class);
            String idStr = claims.get("id", String.class);

            Role role = (roleStr != null) ? Role.valueOf(roleStr) : Role.ROLE_ADMIN;
            UUID id = (idStr != null && !idStr.isBlank()) ? UUID.fromString(idStr) : UUID.randomUUID();

            User user = User.builder()
                    .id(id)
                    .email(email)
                    .role(role)
                    .build();

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (UnauthorizedException ex) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setCharacterEncoding("UTF-8");
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\":\"" + ex.getMessage() + "\",\"timestamp\":\"" + java.time.LocalDateTime.now() + "\"}");
            return;
        } catch (Exception ex) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setCharacterEncoding("UTF-8");
            response.setContentType("application/json;charset=UTF-8");
            response.getWriter().write("{\"message\":\"Token non valido o scaduto! Per favore effettua nuovamente il login.\",\"timestamp\":\"" + java.time.LocalDateTime.now() + "\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String path = request.getServletPath();
        AntPathMatcher pathMatcher = new AntPathMatcher();
        return pathMatcher.match("/", path)
                || pathMatcher.match("/health", path)
                || pathMatcher.match("/api/health", path)
                || pathMatcher.match("/api/auth/**", path)
                || (pathMatcher.match("/api/quotes", path) && request.getMethod().equalsIgnoreCase("POST"))
                || (pathMatcher.match("/api/quotes/*/calendar.ics", path) && request.getMethod().equalsIgnoreCase("GET"))
                || (pathMatcher.match("/api/services", path) && request.getMethod().equalsIgnoreCase("GET"))
                || (pathMatcher.match("/api/services/**", path) && request.getMethod().equalsIgnoreCase("GET"))
                || (pathMatcher.match("/api/gallery", path) && request.getMethod().equalsIgnoreCase("GET"))
                || (pathMatcher.match("/api/gallery/**", path) && request.getMethod().equalsIgnoreCase("GET"));
    }
}
