import { handleShowList } from "../core/handleShowList";

export const handler = async (_evt) => {
  const days = parseInt(_evt?.queryStringParameters?.days || "1", 10);

  const response = await handleShowList({ days });
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(response),
  };
};
