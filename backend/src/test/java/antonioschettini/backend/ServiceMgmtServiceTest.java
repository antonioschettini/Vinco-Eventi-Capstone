package antonioschettini.backend;

import antonioschettini.backend.entities.ServiceEntity;
import antonioschettini.backend.exceptions.NotFoundException;
import antonioschettini.backend.recordsDTO.ServiceDTO;
import antonioschettini.backend.repositories.ServiceRepository;
import antonioschettini.backend.services.CloudinaryService;
import antonioschettini.backend.services.ServiceMgmtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class ServiceMgmtServiceTest {

    @Mock
    private ServiceRepository serviceRepository;

    @Mock
    private CloudinaryService cloudinaryService;

    @InjectMocks
    private ServiceMgmtService serviceMgmtService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testGetAllServicesReturnsSortedList() {
        ServiceEntity s1 = ServiceEntity.builder().id(UUID.randomUUID()).titleIta("DJ Set").displayOrder(1).build();
        ServiceEntity s2 = ServiceEntity.builder().id(UUID.randomUUID()).titleIta("Sax Live").displayOrder(2).build();

        when(serviceRepository.findAllByOrderByDisplayOrderAsc()).thenReturn(List.of(s1, s2));

        List<ServiceEntity> result = serviceMgmtService.getAllServices();
        assertEquals(2, result.size());
        assertEquals("DJ Set", result.get(0).getTitleIta());
    }

    @Test
    void testGetServiceByIdNotFoundThrowsException() {
        UUID id = UUID.randomUUID();
        when(serviceRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> serviceMgmtService.getServiceById(id));
    }

    @Test
    void testCreateService() {
        ServiceDTO dto = new ServiceDTO(
                "DJ Set Matrimoni",
                "Wedding DJ Set",
                "Musica ed intrattenimento",
                "Music & entertainment",
                "WEDDING",
                "TOP",
                "https://res.cloudinary.com/img1.jpg",
                "https://res.cloudinary.com/img2.jpg",
                "[\"DJ\", \"Audio\"]",
                "[\"DJ\", \"Audio\"]",
                null,
                null,
                1
        );

        when(serviceRepository.save(any(ServiceEntity.class))).thenAnswer(inv -> inv.getArgument(0));

        ServiceEntity created = serviceMgmtService.createService(dto);
        assertNotNull(created);
        assertEquals("DJ Set Matrimoni", created.getTitleIta());
        assertEquals(1, created.getDisplayOrder());
    }
}
