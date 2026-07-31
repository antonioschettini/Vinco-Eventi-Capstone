package antonioschettini.backend.services;

import antonioschettini.backend.entities.ServiceEntity;
import antonioschettini.backend.exceptions.NotFoundException;
import antonioschettini.backend.recordsDTO.ServiceDTO;
import antonioschettini.backend.repositories.ServiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ServiceMgmtService {

    @Autowired
    private ServiceRepository serviceRepository;

    public List<ServiceEntity> getAllServices() {
        return serviceRepository.findAllByOrderByDisplayOrderAsc();
    }

    public ServiceEntity getServiceById(UUID id) {
        return serviceRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Servizio non trovato con ID: " + id));
    }

    public ServiceEntity createService(ServiceDTO dto) {
        ServiceEntity service = ServiceEntity.builder()
                .titleIta(dto.titleIta())
                .titleEng(dto.titleEng())
                .subtitleIta(dto.subtitleIta())
                .subtitleEng(dto.subtitleEng())
                .category(dto.category())
                .badge(dto.badge())
                .imageUrlIta(dto.imageUrlIta())
                .imageUrlEng(dto.imageUrlEng())
                .featuresIta(dto.featuresIta())
                .featuresEng(dto.featuresEng())
                .brochureUrlIta(dto.brochureUrlIta())
                .brochureUrlEng(dto.brochureUrlEng())
                .displayOrder(dto.displayOrder() != null ? dto.displayOrder() : 99)
                .build();

        return serviceRepository.save(service);
    }

    public ServiceEntity updateService(UUID id, ServiceDTO dto) {
        ServiceEntity service = getServiceById(id);

        service.setTitleIta(dto.titleIta());
        service.setTitleEng(dto.titleEng());
        service.setSubtitleIta(dto.subtitleIta());
        service.setSubtitleEng(dto.subtitleEng());
        service.setCategory(dto.category());
        service.setBadge(dto.badge());
        if (dto.imageUrlIta() != null) service.setImageUrlIta(dto.imageUrlIta());
        if (dto.imageUrlEng() != null) service.setImageUrlEng(dto.imageUrlEng());
        service.setFeaturesIta(dto.featuresIta());
        service.setFeaturesEng(dto.featuresEng());
        service.setBrochureUrlIta(dto.brochureUrlIta());
        service.setBrochureUrlEng(dto.brochureUrlEng());
        if (dto.displayOrder() != null) service.setDisplayOrder(dto.displayOrder());

        return serviceRepository.save(service);
    }

    public void deleteService(UUID id) {
        ServiceEntity service = getServiceById(id);
        serviceRepository.delete(service);
    }
}
