package antonioschettini.backend;

import antonioschettini.backend.entities.AuditErrorLog;
import antonioschettini.backend.entities.AuditVisitLog;
import antonioschettini.backend.repositories.AuditErrorLogRepository;
import antonioschettini.backend.repositories.AuditVisitLogRepository;
import antonioschettini.backend.services.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AuditServiceTest {

    @Mock
    private AuditErrorLogRepository errorLogRepository;

    @Mock
    private AuditVisitLogRepository visitLogRepository;

    @InjectMocks
    private AuditService auditService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testAnonymizeIpIpv4() {
        String anonymized = ReflectionTestUtils.invokeMethod(auditService, "anonymizeIp", "192.168.1.105");
        assertEquals("192.168.x.x", anonymized);
    }

    @Test
    void testAnonymizeIpIpv6() {
        String anonymized = ReflectionTestUtils.invokeMethod(auditService, "anonymizeIp", "2001:0db8:85a3:0000:0000:8a2e:0370:7334");
        assertEquals("2001:0db8:85a3:x:x:x:x:x", anonymized);
    }

    @Test
    void testTruncate() {
        String longText = "a".repeat(100);
        String truncated = ReflectionTestUtils.invokeMethod(auditService, "truncate", longText, 10);
        assertEquals("aaaaaaaaaa", truncated);
        assertEquals(10, truncated.length());
    }

    @Test
    void testLogErrorDelegatesToRepository() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/admin/accounting");
        request.setRemoteAddr("10.0.0.50");
        Exception ex = new RuntimeException("Database connection timeout");

        when(errorLogRepository.save(any(AuditErrorLog.class))).thenAnswer(inv -> inv.getArgument(0));

        auditService.logError(request, ex, 500);

        verify(errorLogRepository, timeout(1000).times(1)).save(any(AuditErrorLog.class));
    }

    @Test
    void testLogVisitDelegatesToRepository() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/services");
        request.setRemoteAddr("10.0.0.51");
        request.addHeader("User-Agent", "Mozilla/5.0 TestBrowser");

        when(visitLogRepository.save(any(AuditVisitLog.class))).thenAnswer(inv -> inv.getArgument(0));

        auditService.logVisit(request, null, 200);

        verify(visitLogRepository, timeout(1000).times(1)).save(any(AuditVisitLog.class));
    }
}
