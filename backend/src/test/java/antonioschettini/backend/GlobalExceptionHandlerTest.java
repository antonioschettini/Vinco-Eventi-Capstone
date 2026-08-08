package antonioschettini.backend;

import antonioschettini.backend.exceptions.*;
import antonioschettini.backend.services.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.verify;

class GlobalExceptionHandlerTest {

    @Mock
    private AuditService auditService;

    @Mock
    private HttpServletRequest request;

    @InjectMocks
    private GlobalExceptionHandler exceptionHandler;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testHandleBadRequest() {
        BadRequestException ex = new BadRequestException("Parametro non valido");
        ErrorPayload payload = exceptionHandler.handleBadRequest(ex, request);

        assertNotNull(payload);
        assertEquals("Parametro non valido", payload.getMessage());
        verify(auditService).logError(request, ex, 400);
    }

    @Test
    void testHandleUnauthorized() {
        UnauthorizedException ex = new UnauthorizedException("Credenziali errate");
        ErrorPayload payload = exceptionHandler.handleUnauthorized(ex, request);

        assertNotNull(payload);
        assertEquals("Credenziali errate", payload.getMessage());
        verify(auditService).logError(request, ex, 401);
    }

    @Test
    void testHandleNotFound() {
        NotFoundException ex = new NotFoundException("Risorsa non trovata");
        ErrorPayload payload = exceptionHandler.handleNotFound(ex, request);

        assertNotNull(payload);
        assertEquals("Risorsa non trovata", payload.getMessage());
        verify(auditService).logError(request, ex, 404);
    }

    @Test
    void testHandleTooManyRequests() {
        TooManyRequestsException ex = new TooManyRequestsException("Troppe richieste");
        ErrorPayload payload = exceptionHandler.handleTooManyRequests(ex, request);

        assertNotNull(payload);
        assertEquals("Troppe richieste", payload.getMessage());
        verify(auditService).logError(request, ex, 429);
    }

    @Test
    void testHandleGenericExceptionWithNullMessage() {
        NullPointerException ex = new NullPointerException();
        ErrorPayload payload = exceptionHandler.handleGenericException(ex, request);

        assertNotNull(payload);
        assertTrue(payload.getMessage().contains("Errore interno non specificato"));
        verify(auditService).logError(request, ex, 500);
    }
}
