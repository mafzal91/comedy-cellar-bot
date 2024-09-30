import { removeSizeFromUrl } from "../utils/helpers";

export function Img(props) {
  return <img {...props} src={removeSizeFromUrl(props.src)} />;
}
