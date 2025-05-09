import {
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

import * as React from "react";
// import { SelectComic } from "@core/sql/comic.sql";

export default function NewComicEmail() {
  const comics = [
    {
      id: 257429,
      externalId: "comic_tyhcnkc7xuegtsuybveyomq9",
      img: "https://www.comedycellar.com//wp-content/uploads/2024/06/aaron-berg.jpg",
      name: "Aaron Berg",
      description:
        '"25 sets" on amazon new special out jan. "standing down", this is not happening on comedy central',
      website: "https://aaronberg.com/",
      enabled: null,
      createdAt: "2024-11-14T00:00:38.009Z",
      showCount: "0",
    },
    {
      id: 724646,
      externalId: "comic_w5s8m5ds6y8c7dbs1lfoqd94",
      img: "https://www.comedycellar.com//wp-content/uploads/2025/03/aaron-chen.jpg",
      name: "Aaron Chen",
      description: `from late night with seth meyers, 'fisk",`,
      website: "http://instagram.com/chennylifestyle/?hl=en",
      enabled: null,
      createdAt: "2025-04-16T15:47:03.337Z",
      showCount: "5",
    },
    {
      id: 156,
      externalId: "comic_fr04qjtu1q4zs9fa5jg6hno4",
      img: "https://www.comedycellar.com//wp-content/uploads/2013/02/adamferrara-e1361473980333.jpeg",
      name: "Adam Ferrara",
      description: `hbo's "nurse jackie",from the movie "paul blart: mall cop", "dirty movie", "winter of frozen dreams", "definitely maybe", fx denis leary's "rescue me", comedy central's "tough crowd", abc's "the job", and "the letterman show".`,
      website: "http://Adamferrara.com",
      enabled: null,
      createdAt: "2024-10-03T15:06:31.373Z",
      showCount: "0",
    },
  ];
  return (
    <Html>
      <Head />

      <Tailwind>
        <Container className="my-[16px] max-w-[600px]">
          <Section>
            <Row>
              <Text className="m-0 font-semibold text-[24px] text-gray-900 leading-[32px]">
                New Comics Added
              </Text>
              <Text className="mt-[8px] text-[16px] text-gray-500 leading-[24px]">
                We've added some new comics to the system. Which means they have
                upcoming show. Be sure to check them out by clicking their name
                in this email
              </Text>
            </Row>
          </Section>
          <Section>
            <Hr className="!border-gray-300 mx-0 my-[32px] w-full border border-solid" />
            {comics.map((comic) => (
              <>
                <Section>
                  <Row>
                    <Column className="w-2/5 pr-[24px]">
                      <Img
                        src={comic.img}
                        width="100%"
                        height="168px"
                        alt={`Comic image - ${comic.name}`}
                        className="block w-full rounded-[4px] object-cover object-center"
                      />
                    </Column>
                    <Column className="w-3/5 pr-[24px]">
                      <Link
                        href={`https://comedycellar.mafz.al/comics/${comic.externalId}`}
                      >
                        <Text className="m-0 font-semibold text-[20px] text-gray-900 leading-[28px]">
                          {comic.name}
                        </Text>
                      </Link>
                      <Text className="m-0 mt-[8px] text-[16px] text-gray-500 leading-[24px]">
                        {comic.description}
                      </Text>
                    </Column>
                  </Row>
                </Section>

                <Hr className="!border-gray-300 mx-0 my-[32px] w-full border border-solid" />
              </>
            ))}
          </Section>
        </Container>
      </Tailwind>
    </Html>
  );
}
