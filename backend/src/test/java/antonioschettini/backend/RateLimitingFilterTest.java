package antonioschettini.backend;

import antonioschettini.backend.security.RateLimitingFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class RateLimitingFilterTest {

    private RateLimitingFilter rateLimitingFilter;
    private FilterChain filterChain;

    @BeforeEach
    void setUp() {
        rateLimitingFilter = new RateLimitingFilter();
        filterChain = mock(FilterChain.class);
    }

    @Test
    void testOptionsRequestPassesThrough() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/auth/login");
        MockHttpServletResponse response = new MockHttpServletResponse();

        rateLimitingFilter.doFilter(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        assertEquals(200, response.getStatus());
    }

    @Test
    void testNormalLoginRequestPassesThrough() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setRemoteAddr("192.168.1.100");
        MockHttpServletResponse response = new MockHttpServletResponse();

        rateLimitingFilter.doFilter(request, response, filterChain);

        verify(filterChain, times(1)).doFilter(request, response);
        assertNotEquals(429, response.getStatus());
    }

    @Test
    void testExcessiveLoginAttemptsTriggers429() throws ServletException, IOException {
        String clientIp = "192.168.1.101";

        // Invia 10 richieste consentite
        for (int i = 0; i < 10; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
            request.setRemoteAddr(clientIp);
            MockHttpServletResponse response = new MockHttpServletResponse();
            rateLimitingFilter.doFilter(request, response, filterChain);
            assertNotEquals(429, response.getStatus());
        }

        // La 11-esima richiesta deve restituire 429 Too Many Requests
        MockHttpServletRequest blockedRequest = new MockHttpServletRequest("POST", "/api/auth/login");
        blockedRequest.setRemoteAddr(clientIp);
        MockHttpServletResponse blockedResponse = new MockHttpServletResponse();

        rateLimitingFilter.doFilter(blockedRequest, blockedResponse, filterChain);

        assertEquals(429, blockedResponse.getStatus());
        assertTrue(blockedResponse.getContentAsString().contains("Too Many Requests"));
        assertTrue(blockedResponse.getContentAsString().contains("Troppi tentativi di accesso"));
    }

    @Test
    void testExcessiveQuoteSubmissionsTriggers429() throws ServletException, IOException {
        String clientIp = "192.168.1.102";

        // Invia 5 preventivi consentiti
        for (int i = 0; i < 5; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/quotes");
            request.setRemoteAddr(clientIp);
            MockHttpServletResponse response = new MockHttpServletResponse();
            rateLimitingFilter.doFilter(request, response, filterChain);
            assertNotEquals(429, response.getStatus());
        }

        // Il 6° preventivo deve restituire 429
        MockHttpServletRequest blockedRequest = new MockHttpServletRequest("POST", "/api/quotes");
        blockedRequest.setRemoteAddr(clientIp);
        MockHttpServletResponse blockedResponse = new MockHttpServletResponse();

        rateLimitingFilter.doFilter(blockedRequest, blockedResponse, filterChain);

        assertEquals(429, blockedResponse.getStatus());
        assertTrue(blockedResponse.getContentAsString().contains("Hai inviato troppe richieste di preventivo"));
    }

    @Test
    void testDifferentIpsHaveIndependentLimits() throws ServletException, IOException {
        String ip1 = "10.0.0.1";
        String ip2 = "10.0.0.2";

        // Esaurisci limite per IP1
        for (int i = 0; i < 10; i++) {
            MockHttpServletRequest req = new MockHttpServletRequest("POST", "/api/auth/login");
            req.setRemoteAddr(ip1);
            rateLimitingFilter.doFilter(req, new MockHttpServletResponse(), filterChain);
        }

        // IP1 viene bloccato
        MockHttpServletRequest blockedReq = new MockHttpServletRequest("POST", "/api/auth/login");
        blockedReq.setRemoteAddr(ip1);
        MockHttpServletResponse blockedRes = new MockHttpServletResponse();
        rateLimitingFilter.doFilter(blockedReq, blockedRes, filterChain);
        assertEquals(429, blockedRes.getStatus());

        // IP2 può ancora inviare liberamente
        MockHttpServletRequest validReq = new MockHttpServletRequest("POST", "/api/auth/login");
        validReq.setRemoteAddr(ip2);
        MockHttpServletResponse validRes = new MockHttpServletResponse();
        rateLimitingFilter.doFilter(validReq, validRes, filterChain);
        assertNotEquals(429, validRes.getStatus());
    }
}
