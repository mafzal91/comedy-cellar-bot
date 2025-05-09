import { Section, Img, Text, Row, Column, Link } from "@react-email/components";

export function Footer() {
  return (
    <Section className="text-center">
      <table className="w-full">
        <tr className="w-full">
          <td align="center">
            <Link href="https://comedycellar.mafz.al">
              https://comedycellar.mafz.al
            </Link>
          </td>
        </tr>
      </table>
    </Section>
  );
}
