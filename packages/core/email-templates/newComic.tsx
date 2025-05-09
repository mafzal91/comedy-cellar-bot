import {
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { Footer } from "./footer";
import * as React from "react";
import { SelectComic } from "@core/sql/comic.sql";
import { removeSizeFromUrl } from "@core/utils";

export default function NewComicEmail({ comics }: { comics: SelectComic[] }) {
  return (
    <Html>
      <Head />
      <Preview>New Comics Added</Preview>

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
                        src={removeSizeFromUrl(comic.img)}
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
          <Footer />
        </Container>
      </Tailwind>
    </Html>
  );
}
