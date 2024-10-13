import { useQuery } from "react-query";
import { getHealth } from "../../utils/api";
import { PageLoader } from "../../components/PageLoader";

export default function Profile() {
  const { data, isFetching } = useQuery(["health"], async () => {
    const health = await getHealth();
    return health;
  });
  if (isFetching) {
    return <PageLoader />;
  }
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}
