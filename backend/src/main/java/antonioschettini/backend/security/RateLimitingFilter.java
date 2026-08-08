package antonioschettini.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Filter di Rate Limiting basato sull'IP del client per proteggere il piano gratuito di deployment
 * da attacchi di forza bruta, spam e consumo eccessivo delle risorse di elaborazione e database.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private static class RequestBucket {
        long windowStartTimestamp;
        int requestCount;

        RequestBucket(long windowStartTimestamp) {
            this.windowStartTimestamp = windowStartTimestamp;
            this.requestCount = 1;
        }
    }

    private final Map<String, RequestBucket> loginBucketMap = new ConcurrentHashMap<>();
    private final Map<String, RequestBucket> quoteBucketMap = new ConcurrentHashMap<>();
    private final Map<String, RequestBucket> generalBucketMap = new ConcurrentHashMap<>();

    // Limiti configurati
    private static final int MAX_LOGIN_PER_MIN = 10;
    private static final int MAX_QUOTES_PER_10_MIN = 5;
    private static final int MAX_GENERAL_PER_MIN = 120;

    private static final long ONE_MINUTE_MS = TimeUnit.MINUTES.toMillis(1);
    private static final long TEN_MINUTES_MS = TimeUnit.MINUTES.toMillis(10);

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // Ignora richieste OPTIONS pre-flight di CORS
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);
        String path = request.getRequestURI();
        String method = request.getMethod();
        long now = System.currentTimeMillis();

        // 1. Limite specifico per tentativi di Login (Brute Force Protection)
        if (path.equals("/api/auth/login") && "POST".equalsIgnoreCase(method)) {
            if (isRateLimited(loginBucketMap, clientIp, now, ONE_MINUTE_MS, MAX_LOGIN_PER_MIN)) {
                sendRateLimitResponse(response, "Troppi tentativi di accesso. Per favore attendi un minuto prima di riprovare.");
                return;
            }
        }

        // 2. Limite specifico per Invio Preventivi (Spam Protection)
        if (path.equals("/api/quotes") && "POST".equalsIgnoreCase(method)) {
            if (isRateLimited(quoteBucketMap, clientIp, now, TEN_MINUTES_MS, MAX_QUOTES_PER_10_MIN)) {
                sendRateLimitResponse(response, "Hai inviato troppe richieste di preventivo. Per favore attendi 10 minuti prima di riprovare.");
                return;
            }
        }

        // 3. Limite generale sulle API pubbliche
        if (path.startsWith("/api/")) {
            if (isRateLimited(generalBucketMap, clientIp, now, ONE_MINUTE_MS, MAX_GENERAL_PER_MIN)) {
                sendRateLimitResponse(response, "Troppe richieste inviate in breve tempo. Riprova tra un minuto.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private synchronized boolean isRateLimited(Map<String, RequestBucket> bucketMap, String clientIp, long now, long windowMs, int maxRequests) {
        RequestBucket bucket = bucketMap.get(clientIp);

        if (bucket == null || (now - bucket.windowStartTimestamp) > windowMs) {
            bucketMap.put(clientIp, new RequestBucket(now));
            return false;
        }

        bucket.requestCount++;
        return bucket.requestCount > maxRequests;
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank()) {
            return xRealIp.trim();
        }
        return request.getRemoteAddr();
    }

    private void sendRateLimitResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        String json = String.format("{\"status\":429,\"error\":\"Too Many Requests\",\"message\":\"%s\"}", message);
        response.getWriter().write(json);
    }
}
