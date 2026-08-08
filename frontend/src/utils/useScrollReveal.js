import { useEffect } from "react";

/**
 * Hook custom per simulare l'effetto hover / illuminazione dinamica durante lo scroll (particolarmente su mobile).
 * Utilizza la IntersectionObserver API per rilevare quando le card o le Hero Section entrano nel campo visivo del lettore,
 * attivando la classe CSS 'is-in-view' che applica il passaggio da scala di grigi a colore pieno e l'illuminazione dello sfondo.
 */
export function useScrollReveal(
  selector = ".scroll-reveal, .entertainment-card, .hero-gallery-section, .hero-bio-section, .service-card-box, .stat-card, .pillar-card, .story-img-wrapper, .about-quote-wrapper, .instagram-mockup-container, .gallery-media-card, .footer-section"
) {
  useEffect(() => {
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll(selector).forEach((el) => {
        el.classList.add("is-in-view");
      });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in-view");
          } else {
            entry.target.classList.remove("is-in-view");
          }
        });
      },
      {
        threshold: 0.2, // Attiva l'effetto quando almeno il 20% dell'elemento entra nel campo visivo
        rootMargin: "0px 0px -40px 0px", // Margine per far scattare l'animazione poco prima del centro schermo
      }
    );

    const elements = document.querySelectorAll(selector);
    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [selector]);
}

export default useScrollReveal;
