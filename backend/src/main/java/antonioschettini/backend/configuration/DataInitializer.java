package antonioschettini.backend.configuration;

import antonioschettini.backend.entities.GalleryItem;
import antonioschettini.backend.entities.ServiceEntity;
import antonioschettini.backend.entities.User;
import antonioschettini.backend.enums.Role;
import antonioschettini.backend.repositories.GalleryRepository;
import antonioschettini.backend.repositories.ServiceRepository;
import antonioschettini.backend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ServiceRepository serviceRepository;

    @Autowired
    private GalleryRepository galleryRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Value("${admin.password:RipBigVincoEventi!}")
    private String adminPassword;

    @Override
    public void run(String... args) throws Exception {
        seedAdminUser();
        seedDefaultServices();
        seedDefaultGalleryItems();
    }

    private void seedAdminUser() {
        String adminEmail = "vincoeventi@gmail.com";
        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            User admin = User.builder()
                    .email(adminEmail)
                    .password(passwordEncoder.encode(adminPassword))
                    .role(Role.ROLE_ADMIN)
                    .build();
            userRepository.save(admin);
            System.out.println(">>> Seed Admin eseguito con successo per: " + adminEmail);
        }
    }

    private void seedDefaultServices() {
        if (serviceRepository.count() == 0) {
            ServiceEntity basic = ServiceEntity.builder()
                    .titleIta("BASIC")
                    .titleEng("BASIC")
                    .subtitleIta("Pacchetto essenziale per intrattenimento e service audio/luci professionale")
                    .subtitleEng("Essential package for entertainment and professional audio/lighting service")
                    .category("PACKAGE")
                    .badge("BASIC")
                    .imageUrlIta("/src/assets/serviziOfferti/basicIta.png")
                    .imageUrlEng("/src/assets/serviziOfferti/basicEng.png")
                    .featuresIta("Service audio e luci;DJ (a scelta dal team VINCO EVENTI)")
                    .featuresEng("Audio and lighting service;DJ (selected from VINCO EVENTI team)")
                    .displayOrder(1)
                    .build();

            ServiceEntity plus = ServiceEntity.builder()
                    .titleIta("PLUS")
                    .titleEng("PLUS")
                    .subtitleIta("Soluzione completa con sottofondo musicale e strumenti solisti dal vivo")
                    .subtitleEng("Complete solution with background music and live solo instruments")
                    .category("PACKAGE")
                    .badge("PLUS")
                    .imageUrlIta("/src/assets/serviziOfferti/plusIta.png")
                    .imageUrlEng("/src/assets/serviziOfferti/plusEng.png")
                    .featuresIta("Service audio e luci;DJ (a scelta dal team VINCO EVENTI);Musica di sottofondo (Cerimonia, Aperitivo);Musicista a scelta di accompagnamento al djset (violino, sax, percussioni ecc.)")
                    .featuresEng("Audio and lighting service;DJ (selected from VINCO EVENTI team);Background music (Ceremony, Cocktail Hour);Musician of choice to accompany DJ set (violin, sax, percussion, etc.)")
                    .displayOrder(2)
                    .build();

            ServiceEntity full = ServiceEntity.builder()
                    .titleIta("FULL")
                    .titleEng("FULL")
                    .subtitleIta("L'esperienza totale di intrattenimento con band dal vivo, attrazioni speciali e scenografie luminose")
                    .subtitleEng("The total entertainment experience with live band, special attractions and scenic lighting")
                    .category("PACKAGE")
                    .badge("FULL")
                    .imageUrlIta("/src/assets/serviziOfferti/fullIta.png")
                    .imageUrlEng("/src/assets/serviziOfferti/fullEng.png")
                    .featuresIta("Service audio e luci;DJ (a scelta dal team VINCO EVENTI);Musica di sottofondo (Cerimonia, Aperitivo);Live Band [BROCHURE];Musicisti a scelta di accompagnamento al djset (violino, sax, percussioni ecc.);Photobooth, Videobooth 360°, Telefono degli Ospiti [BROCHURE];Illuminazioni, Fontane luminose sparkular, Fuochi d’artificio e Fumogeni Colorati [BROCHURE]")
                    .featuresEng("Audio and lighting service;DJ (selected from VINCO EVENTI team);Background music (Ceremony, Cocktail Hour);Live Band [BROCHURE];Musicians of choice to accompany DJ set (violin, sax, percussion, etc.);Photobooth, 360° Videobooth, Guest Audio Guestbook [BROCHURE];Lighting, Sparkular fountains, Fireworks & Colored smoke [BROCHURE]")
                    .brochureUrlIta("https://drive.google.com/file/d/1oXiV9ACF0xkTOiNtkyxHYVK0dVMDCvdw/view")
                    .brochureUrlEng("https://drive.google.com/file/d/1arWt9Ex8Wd7gDGAdKPkuKDNRMXiqBhIn/view")
                    .displayOrder(3)
                    .build();

            serviceRepository.saveAll(List.of(basic, plus, full));
            System.out.println(">>> Seed Servizi eseguito con successo (BASIC, PLUS, FULL).");
        }
    }

    private void seedDefaultGalleryItems() {
        if (galleryRepository.count() < 31) {
            galleryRepository.deleteAll();
            List<GalleryItem> items = List.of(
                    // 1
                    GalleryItem.builder()
                            .titleIta("Set ELETTRICO - Promo on Fire!")
                            .titleEng("ELECTRICAL Set - Promo on Fire!")
                            .subtitleIta("La carica travolgente del nostro set elettrico live (minuto 1:00)")
                            .subtitleEng("The overwhelming energy of our live electric set (start minute 1:00)")
                            .type("video")
                            .src("/src/assets/nuove Foto VIdeo/Sotto Alle Casere Vostre - Set ELETTRICO - ð¬ Promo on Fire!!! ð¥.mov")
                            .category("djset")
                            .featured(true)
                            .startTime(60.0)
                            .displayOrder(1)
                            .build(),
                    // 2
                    GalleryItem.builder()
                            .titleIta("Crossroads Live Performance")
                            .titleEng("Crossroads Live Performance")
                            .subtitleIta("Spettacolo musicale d'impatto e ritmo coinvolgente")
                            .subtitleEng("High impact musical performance with engaging rhythm")
                            .type("video")
                            .src("/src/assets/nuove Foto VIdeo/crossroads_-_musicontacts (1080p) (1).mov")
                            .category("band")
                            .featured(true)
                            .displayOrder(2)
                            .build(),
                    // 3
                    GalleryItem.builder()
                            .titleIta("DJ Set Exclusive Live")
                            .titleEng("DJ Set Exclusive Live")
                            .subtitleIta("Carica ed energia per eventi unici")
                            .subtitleEng("Energy and passion for unique events")
                            .type("video")
                            .src("/src/assets/galleria/DjsetEnzo.mp4")
                            .category("djset")
                            .featured(true)
                            .displayOrder(3)
                            .build(),
                    // 4
                    GalleryItem.builder()
                            .titleIta("Console DJ Set")
                            .titleEng("Console DJ Set")
                            .subtitleIta("Musica e regia per la serata")
                            .subtitleEng("Music and direction for your evening")
                            .type("image")
                            .src("/src/assets/home/foto enzo dj set.jpeg")
                            .category("djset")
                            .featured(true)
                            .displayOrder(4)
                            .build(),
                    // 5
                    GalleryItem.builder()
                            .titleIta("Exclusive Night Party")
                            .titleEng("Exclusive Night Party")
                            .subtitleIta("Pista piena e grande energia per una serata indimenticabile")
                            .subtitleEng("Packed dancefloor and intense energy for an unforgettable night")
                            .type("video")
                            .src("/src/assets/nuove Foto VIdeo/89517126987d42a6b79ea10e8ff5f00c.mov")
                            .category("djset")
                            .featured(true)
                            .displayOrder(5)
                            .build(),
                    // 6
                    GalleryItem.builder()
                            .titleIta("Live Band Night Performance")
                            .titleEng("Live Band Night Performance")
                            .subtitleIta("Spettacolo e musica dal vivo")
                            .subtitleEng("Live show and music performance")
                            .type("video")
                            .src("/src/assets/galleria/videobandsera.mp4")
                            .category("band")
                            .featured(true)
                            .displayOrder(6)
                            .build(),
                    // 7
                    GalleryItem.builder()
                            .titleIta("Esibizione Vocalist & Cantante")
                            .titleEng("Vocalist & Singer Performance")
                            .subtitleIta("Emozione pura durante il party")
                            .subtitleEng("Pure emotion during the party")
                            .type("image")
                            .src("/src/assets/home/foto cantante sera.webp")
                            .category("band")
                            .featured(true)
                            .displayOrder(7)
                            .build(),
                    // 8
                    GalleryItem.builder()
                            .titleIta("Luci LED & Console Show")
                            .titleEng("LED Lights & Console Show")
                            .subtitleIta("Scenografie luminose e sound system")
                            .subtitleEng("Lighting design and sound system")
                            .type("video")
                            .src("/src/assets/galleria/video luci led console.mp4")
                            .category("lightshow")
                            .featured(false)
                            .displayOrder(8)
                            .build(),
                    // 9
                    GalleryItem.builder()
                            .titleIta("Live Energy & Dj Set")
                            .titleEng("Live Energy & Dj Set")
                            .subtitleIta("Intrattenimento e regia musicale sul palco")
                            .subtitleEng("Entertainment and musical direction on stage")
                            .type("video")
                            .src("/src/assets/nuove Foto VIdeo/IMG_4008.mov")
                            .category("live")
                            .featured(false)
                            .displayOrder(9)
                            .build(),
                    // 10
                    GalleryItem.builder()
                            .titleIta("Illuminazione Cielo Stellato")
                            .titleEng("Starry Sky Lighting")
                            .subtitleIta("Atmosfera magica per la cena all'aperto")
                            .subtitleEng("Magical atmosphere for outdoor dinner")
                            .type("image")
                            .src("/src/assets/home/cielo stellato.jpg")
                            .category("decor")
                            .featured(false)
                            .displayOrder(10)
                            .build(),
                    // 11
                    GalleryItem.builder()
                            .titleIta("Wedding Party Highlights")
                            .titleEng("Wedding Party Highlights")
                            .subtitleIta("I momenti più belli ed emozionanti del party")
                            .subtitleEng("The best and most exciting moments of the party")
                            .type("video")
                            .src("/src/assets/nuove Foto VIdeo/Snapinsta.app_video_10000000_1551940282224134_8348662047970059600_n.mov")
                            .category("wedding")
                            .featured(false)
                            .displayOrder(11)
                            .build(),
                    // 12
                    GalleryItem.builder()
                            .titleIta("Party & Clubbing Vibe")
                            .titleEng("Party & Clubbing Vibe")
                            .subtitleIta("Pista piena e divertimento assicurato")
                            .subtitleEng("Full dancefloor and guaranteed fun")
                            .type("video")
                            .src("/src/assets/galleria/djsetEnzo2.mp4")
                            .category("djset")
                            .featured(false)
                            .displayOrder(12)
                            .build(),
                    // 13
                    GalleryItem.builder()
                            .titleIta("Il Primo Bacio degli Sposi")
                            .titleEng("The Bride & Groom First Kiss")
                            .subtitleIta("Momento romantico accompagnato dalla musica")
                            .subtitleEng("Romantic moment accompanied by music")
                            .type("image")
                            .src("/src/assets/home/foto bacio sposi.jpg")
                            .category("wedding")
                            .featured(false)
                            .displayOrder(13)
                            .build(),
                    // 14
                    GalleryItem.builder()
                            .titleIta("Live Vibes & Social Reel")
                            .titleEng("Live Vibes & Social Reel")
                            .subtitleIta("La magia dell'evento vista da vicino")
                            .subtitleEng("The magic of the event up close")
                            .type("video")
                            .src("/src/assets/nuove Foto VIdeo/SaveInsta.App - 3139297599736122252.mov")
                            .category("live")
                            .featured(false)
                            .displayOrder(14)
                            .build(),
                    // 15
                    GalleryItem.builder()
                            .titleIta("Live Acoustics Aperitivo")
                            .titleEng("Live Acoustics Cocktail Hour")
                            .subtitleIta("Musica dal vivo elegante durante il cocktail")
                            .subtitleEng("Elegant live music during cocktail hour")
                            .type("video")
                            .src("/src/assets/galleria/videobandgiorno.mp4")
                            .category("band")
                            .featured(false)
                            .displayOrder(15)
                            .build(),
                    // 16
                    GalleryItem.builder()
                            .titleIta("Atmosphere & Lights")
                            .titleEng("Atmosphere & Lights")
                            .subtitleIta("Service luci ed effetti per un'atmosfera elegante")
                            .subtitleEng("Lighting and effects service for an elegant atmosphere")
                            .type("video")
                            .src("/src/assets/nuove Foto VIdeo/SaveInsta.App - 3245450917325219612.mov")
                            .category("lightshow")
                            .featured(false)
                            .displayOrder(16)
                            .build(),
                    // 17
                    GalleryItem.builder()
                            .titleIta("Brindisi & Taglio Torta")
                            .titleEng("Toast & Cake Cutting")
                            .subtitleIta("Il culmine dei festeggiamenti")
                            .subtitleEng("The climax of the celebrations")
                            .type("image")
                            .src("/src/assets/home/foto brindisi torta.jpg")
                            .category("wedding")
                            .featured(false)
                            .displayOrder(17)
                            .build(),
                    // 18
                    GalleryItem.builder()
                            .titleIta("Fumogeni & Effetti Scenografici")
                            .titleEng("Smoke Effects & Special Effects")
                            .subtitleIta("Effetti speciali per ingressi e momenti clou")
                            .subtitleEng("Special effects for grand entrances and key moments")
                            .type("video")
                            .src("/src/assets/galleria/videofumogenipromessa.mp4")
                            .category("effects")
                            .featured(false)
                            .displayOrder(18)
                            .build(),
                    // 19
                    GalleryItem.builder()
                            .titleIta("Festeggiamenti in Musica")
                            .titleEng("Music Celebrations")
                            .subtitleIta("Ritmo e divertimento scatenato per gli invitati")
                            .subtitleEng("Rhythm and wild fun for the guests")
                            .type("video")
                            .src("/src/assets/nuove Foto VIdeo/SaveInsta.App - 3251025503930964991.mov")
                            .category("djset")
                            .featured(false)
                            .displayOrder(19)
                            .build(),
                    // 20
                    GalleryItem.builder()
                            .titleIta("Fumogeni Colorati Sposi")
                            .titleEng("Colored Smoke Effects")
                            .subtitleIta("Esplosione di colori per un ricordo indimenticabile")
                            .subtitleEng("Burst of colors for an unforgettable memory")
                            .type("image")
                            .src("/src/assets/home/14. fumogeni color 2.jpg")
                            .category("effects")
                            .featured(false)
                            .displayOrder(20)
                            .build(),
                    // 21
                    GalleryItem.builder()
                            .titleIta("DJ Set & Live Mix")
                            .titleEng("DJ Set & Live Mix")
                            .subtitleIta("Selezione musicale personalizzata")
                            .subtitleEng("Customized music selection")
                            .type("video")
                            .src("/src/assets/galleria/vdjsetenzo3.mp4")
                            .category("djset")
                            .featured(false)
                            .displayOrder(21)
                            .build(),
                    // 22
                    GalleryItem.builder()
                            .titleIta("Live Show Console")
                            .titleEng("Live Show Console")
                            .subtitleIta("Performance ed energia con la regia di Vinco Eventi")
                            .subtitleEng("Performance and energy directed by Vinco Eventi")
                            .type("video")
                            .src("/src/assets/nuove Foto VIdeo/Snapinsta.app_video_9A437956E2219ABD208CFD29E91D0DBA_video_dashinit.mov")
                            .category("djset")
                            .featured(false)
                            .displayOrder(22)
                            .build(),
                    // 23
                    GalleryItem.builder()
                            .titleIta("Band Live Aperitivo")
                            .titleEng("Live Band Cocktail Hour")
                            .subtitleIta("Ritmi lounge e pop acustico")
                            .subtitleEng("Lounge rhythms and acoustic pop")
                            .type("image")
                            .src("/src/assets/home/foto band aperitivo.jpg")
                            .category("band")
                            .featured(false)
                            .displayOrder(23)
                            .build(),
                    // 24
                    GalleryItem.builder()
                            .titleIta("DJ Set Moment")
                            .titleEng("DJ Set Moment")
                            .subtitleIta("Sound system e selezione musicale d'eccellenza")
                            .subtitleEng("Sound system and music selection of excellence")
                            .type("video")
                            .src("/src/assets/nuove Foto VIdeo/Snapinsta.app_video_C94D52BE73E5D8675DD97F33FE59B688_video_dashinit.mov")
                            .category("djset")
                            .featured(false)
                            .displayOrder(24)
                            .build(),
                    // 25
                    GalleryItem.builder()
                            .titleIta("Live Show Finale")
                            .titleEng("Live Show Finale")
                            .subtitleIta("Gran finale con la band al completo")
                            .subtitleEng("Grand finale with full band")
                            .type("video")
                            .src("/src/assets/galleria/videobandsera2.mp4")
                            .category("band")
                            .featured(false)
                            .displayOrder(25)
                            .build(),
                    // 26
                    GalleryItem.builder()
                            .titleIta("Show dal Vivo")
                            .titleEng("Live Performance Show")
                            .subtitleIta("Coinvolgimento e spettacolo per tutti gli ospiti")
                            .subtitleEng("Engagement and show for all guests")
                            .type("video")
                            .src("/src/assets/nuove Foto VIdeo/IMG_2047.mov")
                            .category("live")
                            .featured(false)
                            .displayOrder(26)
                            .build(),
                    // 27
                    GalleryItem.builder()
                            .titleIta("Cocktail & Sax Vibe")
                            .titleEng("Cocktail & Sax Vibe")
                            .subtitleIta("Eleganza e sonorità moderne")
                            .subtitleEng("Elegance and modern sounds")
                            .type("image")
                            .src("/src/assets/home/foto musica aperitivo.jpg")
                            .category("band")
                            .featured(false)
                            .displayOrder(27)
                            .build(),
                    // 28
                    GalleryItem.builder()
                            .titleIta("Live Session Highlight")
                            .titleEng("Live Session Highlight")
                            .subtitleIta("Un assaggio del nostro intrattenimento dal vivo")
                            .subtitleEng("A taste of our live entertainment")
                            .type("video")
                            .src("/src/assets/nuove Foto VIdeo/84b1ee1c-ceaa-491a-9c13-1ca014f10e2d.mov")
                            .category("band")
                            .featured(false)
                            .displayOrder(28)
                            .build(),
                    // 29
                    GalleryItem.builder()
                            .titleIta("I Nostri Musicisti")
                            .titleEng("Our Musicians")
                            .subtitleIta("Professionisti al servizio del tuo evento")
                            .subtitleEng("Professionals at the service of your event")
                            .type("image")
                            .src("/src/assets/home/foto band.png")
                            .category("band")
                            .featured(false)
                            .displayOrder(29)
                            .build(),
                    // 30
                    GalleryItem.builder()
                            .titleIta("Live Sound Experience")
                            .titleEng("Live Sound Experience")
                            .subtitleIta("Musica e passione al servizio del tuo evento")
                            .subtitleEng("Music and passion at the service of your event")
                            .type("video")
                            .src("/src/assets/nuove Foto VIdeo/a7d0ff0b-2962-4d9b-8826-2d32a93135ef.mov")
                            .category("band")
                            .featured(false)
                            .displayOrder(30)
                            .build(),
                    // 31
                    GalleryItem.builder()
                            .titleIta("Accoglienza Ospiti in Musica")
                            .titleEng("Guest Welcome in Music")
                            .subtitleIta("L'atmosfera ideale fin dai primi minuti")
                            .subtitleEng("The ideal atmosphere from the very first minutes")
                            .type("image")
                            .src("/src/assets/home/fotoband aperitivo.webp")
                            .category("band")
                            .featured(false)
                            .displayOrder(31)
                            .build()
            );

            galleryRepository.saveAll(items);
            System.out.println(">>> Seed Galleria eseguito con successo per tutti i 31 media.");
        }
    }
}
