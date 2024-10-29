import { useRoute } from "preact-iso";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { BellIcon as BellIconSolid } from "@heroicons/react/24/solid";
import { BellIcon } from "@heroicons/react/24/outline";
import { fetchSettings, updateSettings } from "../../utils/api";
import { Button } from "../../components/Button";
import { Spinner } from "../../components/Spinner";

export default function ComicNotification() {
  const { params } = useRoute();
  const queryClient = useQueryClient();

  const comicSettings = useQuery(
    ["settings", params.id],
    async () => {
      const settings = await fetchSettings();

      return (
        settings.comicNotifications.find(
          (setting) => setting.comicId === params.id
        ) ?? {
          comicId: params.id,
          enabled: false,
        }
      );
    },
    {
      refetchOnWindowFocus: false,
      initialData: {
        comicId: params.id,
        enabled: false,
      },
    }
  );

  const mutation = useMutation({
    mutationFn: (enabled: boolean) => {
      return updateSettings({
        comicNotifications: [
          {
            comicId: params.id,
            enabled: enabled,
          },
        ],
      });
    },
    onMutate: async (newState) => {
      await queryClient.cancelQueries(["settings", params.id]);
      const previousState = queryClient.getQueryData(["settings", params.id]);
      queryClient.setQueryData(
        ["settings", params.id],
        (old: Record<string, any>) => ({
          ...old,
          enabled: newState,
        })
      );
      return { previousState };
    },
  });

  if (comicSettings.isLoading) {
    return <Spinner size={5} />;
  }

  const isEnabled = comicSettings.data.enabled ?? false;
  const handleToggle = () => {
    mutation.mutate(!isEnabled);
  };

  return (
    <Button
      type="button"
      className="inline-flex gap-x-1.5"
      onClick={handleToggle}
    >
      {mutation.isLoading ? (
        <>
          <Spinner size={5} />
          Updating
        </>
      ) : isEnabled ? (
        <>
          <BellIconSolid
            aria-hidden="true"
            className="-ml-0.5 h-5 w-5 text-gray-400"
          />
          Notified
        </>
      ) : (
        <>
          <BellIcon
            aria-hidden="true"
            className="-ml-0.5 h-5 w-5 text-gray-400"
          />
          Get Notified
        </>
      )}
    </Button>
  );
}
