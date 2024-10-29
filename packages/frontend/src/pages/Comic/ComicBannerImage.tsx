const coverImg = [
  "/cellar.webp",
  "/ComedyCellar_MacDougalstNYC.jpg",
  "/TheStairs_empty.jpg",
];

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export default function ComicBannerImage(props) {
  return <img src={coverImg[getRandomInt(3)]} {...props} />;
}
