import { useSelector } from "react-redux";
import { translations } from "../utils/translations";

function About() {
  const lang = useSelector((state) => state.ui.language);
  const t = translations[lang].about;

  return (
    <div className="container py-5 my-5 text-center">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <h1 className="display-4 fw-bold mb-4 font-heading">{t.title}</h1>
          <p className="lead mb-4">{t.subtitle}</p>
          <div className="border border-secondary border-opacity-25 rounded p-4 bg-body-tertiary">
            <p className="mb-0 text-muted">{t.content}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default About;
