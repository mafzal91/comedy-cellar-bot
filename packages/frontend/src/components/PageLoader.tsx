import { Spinner } from "./Spinner";
export function PageLoader() {
  return (
    <div className="flex justify-center items-center h-[calc(100vh-72px)]">
      <Spinner size={10} />
    </div>
  );
}
