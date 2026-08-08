package antonioschettini.backend.exceptions;

import antonioschettini.backend.services.AuditService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @Autowired
    private AuditService auditService;

    @ExceptionHandler(BadRequestException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorPayload handleBadRequest(BadRequestException ex, HttpServletRequest request) {
        auditService.logError(request, ex, HttpStatus.BAD_REQUEST.value());
        return new ErrorPayload(ex.getMessage(), LocalDateTime.now());
    }

    @ExceptionHandler(UnauthorizedException.class)
    @ResponseStatus(HttpStatus.UNAUTHORIZED)
    public ErrorPayload handleUnauthorized(UnauthorizedException ex, HttpServletRequest request) {
        auditService.logError(request, ex, HttpStatus.UNAUTHORIZED.value());
        return new ErrorPayload(ex.getMessage(), LocalDateTime.now());
    }

    @ExceptionHandler(NotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public ErrorPayload handleNotFound(NotFoundException ex, HttpServletRequest request) {
        auditService.logError(request, ex, HttpStatus.NOT_FOUND.value());
        return new ErrorPayload(ex.getMessage(), LocalDateTime.now());
    }

    @ExceptionHandler(TooManyRequestsException.class)
    @ResponseStatus(HttpStatus.TOO_MANY_REQUESTS)
    public ErrorPayload handleTooManyRequests(TooManyRequestsException ex, HttpServletRequest request) {
        auditService.logError(request, ex, HttpStatus.TOO_MANY_REQUESTS.value());
        return new ErrorPayload(ex.getMessage(), LocalDateTime.now());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public ErrorPayload handleValidation(MethodArgumentNotValidException ex, HttpServletRequest request) {
        String errors = ex.getBindingResult().getFieldErrors()
                .stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .collect(Collectors.joining(", "));
        auditService.logError(request, ex, HttpStatus.BAD_REQUEST.value());
        return new ErrorPayload(errors, LocalDateTime.now());
    }

    @ExceptionHandler(Exception.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public ErrorPayload handleGenericException(Exception ex, HttpServletRequest request) {
        auditService.logError(request, ex, HttpStatus.INTERNAL_SERVER_ERROR.value());
        String msg = (ex != null && ex.getMessage() != null && !ex.getMessage().isBlank())
                ? ex.getMessage()
                : "Errore interno non specificato";
        return new ErrorPayload("Si è verificato un errore interno del server: " + msg,
                LocalDateTime.now());
    }
}
