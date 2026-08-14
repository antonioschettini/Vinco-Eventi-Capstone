package antonioschettini.backend.services;

import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class MatrimonioStatsService {

    private static final String VENDOR_URL = "https://www.matrimonio.com/musica-matrimonio/vinco-eventi--e283893";
    private static final int DEFAULT_FALLBACK_REVIEWS = 124;
    private static final double DEFAULT_RATING = 5.0;
    private static final long CACHE_DURATION_MS = 6 * 60 * 60 * 1000L; // 6 ore

    private int cachedTotalReviews = DEFAULT_FALLBACK_REVIEWS;
    private double cachedRating = DEFAULT_RATING;
    private long lastFetchTimestamp = 0;

    private final HttpClient httpClient;

    public MatrimonioStatsService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(6))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
    }

    public synchronized MatrimonioStatsDTO getMatrimonioStats() {
        long now = System.currentTimeMillis();
        if (now - lastFetchTimestamp < CACHE_DURATION_MS && lastFetchTimestamp > 0) {
            return new MatrimonioStatsDTO(cachedTotalReviews, cachedRating, VENDOR_URL);
        }

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(VENDOR_URL))
                    .timeout(Duration.ofSeconds(8))
                    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    .header("Accept-Language", "it-IT,it;q=0.9,en;q=0.8")
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() == 200 && response.body() != null) {
                String html = response.body();

                // Pattern 1: "[124 recensioni]" o "124 recensioni"
                Pattern pRecensioni = Pattern.compile("(\\d+)\\s+recensio", Pattern.CASE_INSENSITIVE);
                Matcher mRecensioni = pRecensioni.matcher(html);

                if (mRecensioni.find()) {
                    int parsed = Integer.parseInt(mRecensioni.group(1));
                    if (parsed >= DEFAULT_FALLBACK_REVIEWS) {
                        cachedTotalReviews = parsed;
                    }
                } else {
                    // Pattern 2: "opinioni (\d+)"
                    Pattern pOpinioni = Pattern.compile("opinioni[^\\d]+(\\d+)", Pattern.CASE_INSENSITIVE);
                    Matcher mOpinioni = pOpinioni.matcher(html);
                    if (mOpinioni.find()) {
                        int parsed = Integer.parseInt(mOpinioni.group(1));
                        if (parsed >= DEFAULT_FALLBACK_REVIEWS) {
                            cachedTotalReviews = parsed;
                        }
                    }
                }
                lastFetchTimestamp = now;
            }
        } catch (Exception ex) {
            System.err.println("[WARN MatrimonioStatsService] Impossibile contattare Matrimonio.com per conteggio live: " + ex.getMessage() + ". Uso fallback cached=" + cachedTotalReviews);
        }

        return new MatrimonioStatsDTO(cachedTotalReviews, cachedRating, VENDOR_URL);
    }

    public record MatrimonioStatsDTO(int totalReviews, double rating, String vendorUrl) {}
}
