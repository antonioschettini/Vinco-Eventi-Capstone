package antonioschettini.backend.configuration;

import antonioschettini.backend.services.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Interceptor HTTP per il tracking delle visite.
 *
 * Si attiva su afterCompletion (dopo che la response è già stata inviata)
 * per avere il statusCode definitivo e non aggiungere latenza percepita.
 *
 * Esclude:
 * - Richieste OPTIONS (CORS pre-flight)
 * - /api/auth/** (login/logout — tracciati separatamente dal LoginAttemptService)
 * - /api/health (health check dei servizi di hosting)
 * - Endpoint di auditing stesso (evita loop)
 * - Risorse statiche /uploads/**
 *
 * Le visite in errore (4xx/5xx) NON vengono loggate qui:
 * sono già catturate dal GlobalExceptionHandler → AuditService.logError().
 * Qui si loggano solo le richieste completate con successo (2xx/3xx).
 */
@Component
public class AuditInterceptor implements HandlerInterceptor {

    private static final AntPathMatcher MATCHER = new AntPathMatcher();

    @Autowired
    private AuditService auditService;

    @Override
    public void afterCompletion(HttpServletRequest request,
                                 HttpServletResponse response,
                                 Object handler,
                                 Exception ex) {

        // Skippa OPTIONS (CORS pre-flight)
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return;
        }

        String path = request.getServletPath();

        // Skippa rotte escluse
        if (isExcluded(path)) {
            return;
        }

        int status = response.getStatus();

        // Logga solo le request con successo (2xx/3xx).
        // Le 4xx/5xx sono già gestite dal GlobalExceptionHandler.
        if (status >= 200 && status < 400) {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            auditService.logVisit(request, authentication, status);
        }
    }

    private boolean isExcluded(String path) {
        return MATCHER.match("/api/auth/**", path)
                || MATCHER.match("/api/health", path)
                || MATCHER.match("/api/admin/audit/**", path)
                || MATCHER.match("/uploads/**", path);
    }
}
