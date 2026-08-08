package antonioschettini.backend;

import antonioschettini.backend.controllers.QuoteController;
import antonioschettini.backend.entities.QuoteRequest;
import antonioschettini.backend.enums.QuoteStatus;
import antonioschettini.backend.recordsDTO.QuoteRequestDTO;
import antonioschettini.backend.services.QuoteService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDate;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class QuoteControllerTest {

    private MockMvc mockMvc;

    private ObjectMapper objectMapper;

    @Mock
    private QuoteService quoteService;

    @InjectMocks
    private QuoteController quoteController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(quoteController).build();
        objectMapper = new ObjectMapper();
        objectMapper.findAndRegisterModules();
    }

    @Test
    void testCreateQuoteRequestSuccess() throws Exception {
        UUID quoteId = UUID.randomUUID();
        QuoteRequest createdQuote = QuoteRequest.builder()
                .id(quoteId)
                .nome("Mario")
                .cognome("Rossi")
                .email("mario.rossi@example.com")
                .dataEvento(LocalDate.of(2026, 10, 15))
                .location("Villa Rosa, Napoli")
                .stato(QuoteStatus.PENDING)
                .build();

        when(quoteService.createQuote(any(QuoteRequestDTO.class))).thenReturn(createdQuote);

        String jsonPayload = """
                {
                  "nome": "Mario",
                  "cognome": "Rossi",
                  "email": "mario.rossi@example.com",
                  "telefono": "+39 3331234567",
                  "dataEvento": "2026-10-15",
                  "tipoEvento": "Matrimonio",
                  "location": "Villa Rosa, Napoli",
                  "numeroOspiti": "100",
                  "orarioGiornata": "Sera",
                  "tipoCerimonia": "Religiosa",
                  "messaggio": "Musica aperitivo e dj set",
                  "budget": "1.500€-3.000€",
                  "lingua": "it"
                }
                """;

        mockMvc.perform(post("/api/quotes")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(quoteId.toString()))
                .andExpect(jsonPath("$.nome").value("Mario"))
                .andExpect(jsonPath("$.email").value("mario.rossi@example.com"));
    }

    @Test
    void testGetQuoteCalendarIcsSuccess() throws Exception {
        UUID quoteId = UUID.randomUUID();
        String mockIcs = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nEND:VCALENDAR\r\n";

        when(quoteService.generateIcsContent(quoteId)).thenReturn(mockIcs);

        mockMvc.perform(get("/api/quotes/" + quoteId + "/calendar.ics"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "text/calendar;charset=UTF-8"))
                .andExpect(header().string("Content-Disposition", "inline; filename=\"evento-vinco-" + quoteId + ".ics\""))
                .andExpect(content().string(mockIcs));
    }
}
