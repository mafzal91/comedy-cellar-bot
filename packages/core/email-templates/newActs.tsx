import {
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Link,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

import * as React from "react";
import { SelectShow } from "@core/sql/show.sql";
import { comic, SelectComic } from "@core/sql/comic.sql";
import { removeSizeFromUrl } from "@core/utils";

export function NewActsEmail({
  showsWithActs,
}: {
  showsWithActs: {
    show: SelectShow;
    comics: SelectComic[];
  }[];
}) {
  return (
    <Html>
      <Head />
      <Preview>New Comics Added</Preview>

      <Tailwind>
        <Container className="my-[16px] max-w-[600px]">
          <Section>
            <Row>
              <Text className="m-0 font-semibold text-[24px] text-gray-900 leading-[32px]">
                Shows have been assigned comics
              </Text>
              <Text className="mt-[8px] text-[16px] text-gray-500 leading-[24px]">
                The following shows have been assigned comics. Be sure to check
                them out by clicking their name in this email
              </Text>
            </Row>
          </Section>
          <Section>
            <Hr className="!border-gray-300 mx-0 my-[32px] w-full border border-solid" />
            {showsWithActs.map(({ show, comics }) => (
              <React.Fragment key={show.id}>
                <Section>
                  <Row>
                    <Column>
                      <Link
                        href={`https://comedycellar.mafz.al/reservations/${show.timestamp}`}
                      >
                        <Text className="m-0 font-semibold text-[20px] text-gray-900 leading-[28px]">
                          {show.description}
                        </Text>
                      </Link>
                      <Row>
                        {comics.map((comic) => (
                          <Column key={comic.id}>
                            <ComicRow comic={comic} />
                          </Column>
                        ))}
                      </Row>
                    </Column>
                  </Row>
                </Section>

                <Hr className="!border-gray-300 mx-0 my-[32px] w-full border border-solid" />
              </React.Fragment>
            ))}
          </Section>
        </Container>
      </Tailwind>
    </Html>
  );
}

function ComicRow({ comic }: { comic: SelectComic }) {
  return (
    <Row>
      <Column className="align-baseline">
        <Img
          src={removeSizeFromUrl(comic.img)}
          width="100%"
          height="168px"
          alt={`Comic image - ${comic.name}`}
          className="block w-full rounded-[4px] object-cover object-center"
        />
      </Column>
      <Column className="w-[85%]">
        <Text className="m-0 mt-[8px] text-[16px] text-gray-500 leading-[24px]">
          {comic.name}
        </Text>
      </Column>
    </Row>
  );
}
