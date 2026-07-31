import track1Mp3 from "../assets/mp3Tracks/noVoice/02. Vincenzo Colaluca - No Voice.mp3";
import cover1Jpg from "../assets/mp3Tracks/noVoice/cover.jpg";

import track2Mp3 from "../assets/mp3Tracks/SpotiMate.io - Ripple On The Beat - Disco Remake - Vincenzo Colaluca.mp3";
import cover2Jpg from "../assets/mp3Tracks/SpotiMate.io - Ripple On The Beat - Disco Remake - Vincenzo Colaluca-cover.jpg";

import track3Mp3 from "../assets/mp3Tracks/Vincenzo Colaluca – Deluxe.mp3";
import track4Mp3 from "../assets/mp3Tracks/Vincenzo Colaluca – Net Post.mp3";

// Cover personalizzata per Deluxe e Net Post
import img8672Jpg from "../assets/mp3Tracks/IMG_8672.JPG.jpeg";

export const tracks = [
  {
    id: 1,
    title: "No Voice",
    artist: "Vincenzo Colaluca",
    src: track1Mp3,
    cover: cover1Jpg,
  },
  {
    id: 2,
    title: "Ripple On The Beat (Disco Remake)",
    artist: "Vincenzo Colaluca",
    src: track2Mp3,
    cover: cover2Jpg,
  },
  {
    id: 3,
    title: "Deluxe",
    artist: "Vincenzo Colaluca",
    src: track3Mp3,
    cover: img8672Jpg,
  },
  {
    id: 4,
    title: "Net Post",
    artist: "Vincenzo Colaluca",
    src: track4Mp3,
    cover: img8672Jpg,
  },
];

export default tracks;
