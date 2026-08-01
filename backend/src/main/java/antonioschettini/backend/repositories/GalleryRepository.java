package antonioschettini.backend.repositories;

import antonioschettini.backend.entities.GalleryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GalleryRepository extends JpaRepository<GalleryItem, UUID> {
    List<GalleryItem> findAllByOrderByDisplayOrderAscCreatedAtDesc();
}
