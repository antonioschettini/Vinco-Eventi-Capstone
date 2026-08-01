package antonioschettini.backend.services;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class LoginAttemptService {

    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCK_TIME_DURATION_MS = 15 * 60 * 1000L; // 15 minuti in millisecondi

    private static class AttemptInfo {
        int count;
        long lastAttemptTime;

        AttemptInfo(int count, long lastAttemptTime) {
            this.count = count;
            this.lastAttemptTime = lastAttemptTime;
        }
    }

    private final Map<String, AttemptInfo> attemptsCache = new ConcurrentHashMap<>();

    public boolean isBlocked(String key) {
        if (key == null) return false;
        AttemptInfo info = attemptsCache.get(key);
        if (info == null) return false;

        long now = Instant.now().toEpochMilli();
        if (now - info.lastAttemptTime > LOCK_TIME_DURATION_MS) {
            // Blocco scaduto, reset automatico
            attemptsCache.remove(key);
            return false;
        }

        return info.count >= MAX_ATTEMPTS;
    }

    public void loginFailed(String key) {
        if (key == null) return;
        long now = Instant.now().toEpochMilli();
        attemptsCache.compute(key, (k, info) -> {
            if (info == null || (now - info.lastAttemptTime > LOCK_TIME_DURATION_MS)) {
                return new AttemptInfo(1, now);
            }
            return new AttemptInfo(info.count + 1, now);
        });
    }

    public void loginSucceeded(String key) {
        if (key != null) {
            attemptsCache.remove(key);
        }
    }
}
