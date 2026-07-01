import { Card, CardBody } from "../../components/Card";
import { Link } from "../../components/Link";
import { PageHeader } from "../../components/ui/PageHeader";

const sectionTitle =
  "mb-4 font-display text-d-md leading-none tracking-tightcap text-text";
const subHeading = "mb-4 font-sans text-lead font-bold text-text";
const proseP = "font-sans text-body leading-relaxed text-muted";
const proseList =
  "list-inside list-disc space-y-1 font-sans text-body leading-relaxed text-muted";
const effectiveDate = "mb-8 font-mono text-caption text-muted";

export default function Terms() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-10">
      <PageHeader
        eyebrow="The Fine Print"
        title="Terms & Privacy"
        subline="The house rules, privacy policy, and a note from the developer."
      />

      <Card>
        <CardBody>
          <section id="terms-and-conditions" className="mb-12">
            <h2 className={sectionTitle}>Terms and Conditions ("Terms")</h2>
            <p className={effectiveDate}>
              <strong>Effective Date:</strong> 2024-10-01
            </p>

            <h3 className={subHeading}>1. Acceptance of Terms</h3>
            <p className={`${proseP} mb-4`}>
              This site is a personal, non-commercial project. By using the site,
              you agree to these Terms. If you choose to create an account to access
              personalized features, additional terms will apply to your use.
            </p>

            <h3 className={subHeading}>2. Using the Site Without an Account</h3>
            <ul className={`${proseList} mb-4`}>
              <li>
                Most features on the site are accessible{" "}
                <strong>without an account</strong>.
              </li>
              <li>You can browse show listings and view general content freely.</li>
              <li>You can reserve tickets to a show.</li>
            </ul>

            <h3 className={subHeading}>
              3. Creating an Account for Personalized Features
            </h3>
            <ul className={`${proseList} mb-4`}>
              <li>
                To access individualized features (e.g., tracking new shows or
                receiving notifications), you must create an account.
              </li>
              <li>
                You are responsible for keeping your account information
                confidential.
              </li>
              <li>
                If we detect misuse (e.g., spam, multiple accounts, or improper
                behavior), we may suspend or delete your account.
              </li>
            </ul>

            <h3 className={subHeading}>4. User Responsibilities</h3>
            <ul className={`${proseList} mb-4`}>
              <li>You agree to use the site lawfully and respectfully.</li>
              <li>
                You will not engage in activities that could harm the site or
                disrupt the experience of other users.
              </li>
              <li>
                The site offers a voluntary{" "}
                <Link
                  href="https://www.buymeacoffee.com/mafzal91"
                  variant="underline"
                >
                  "Buy Me a Coffee"
                </Link>{" "}
                link. Donations are optional and do not guarantee additional
                services or benefits.
              </li>
            </ul>

            <h3 className={subHeading}>5. Third-Party Content</h3>
            <p className={`${proseP} mb-4`}>
              This site displays information from external sources (like TV networks
              or public APIs). We do not own or guarantee the accuracy of this
              content.
            </p>

            <h3 className={subHeading}>6. Modifications and Availability</h3>
            <p className={`${proseP} mb-4`}>
              We reserve the right to change or remove features at any time without
              notice. We do not guarantee the site will always be available or
              error-free.
            </p>

            <h3 className={subHeading}>7. Limitation of Liability</h3>
            <p className={`${proseP} mb-4`}>
              The site is provided "as is" without warranties of any kind. We are
              not responsible for any damages arising from your use or inability to
              use the site.
            </p>

            <h3 className={subHeading}>8. Termination</h3>
            <p className={`${proseP} mb-8`}>
              We reserve the right to terminate or suspend your account if you
              violate these Terms or misuse the site.
            </p>
          </section>

          <hr className="my-12 border-line" />

          <section id="privacy-policy">
            <h2 className={sectionTitle}>Privacy Policy</h2>
            <p className={effectiveDate}>
              <strong>Effective Date:</strong> 2024-10-01
            </p>

            <h3 className={subHeading}>1. Information We Collect</h3>
            <ul className={`${proseList} mb-4`}>
              <li>
                We use <strong>Clerk</strong> for authentication and user
                management. When you sign up or log in, Clerk may collect your email
                and other personal information to manage your account.
              </li>
              <li>
                <strong>Without an Account:</strong> We do not collect personal
                information unless you create an account.
              </li>
              <li>
                <strong>With an Account:</strong> We collect your email to manage
                personalized features (like tracking shows or sending
                notifications).
              </li>
              <li>
                <strong>Cookies:</strong> We use cookies for login sessions and to
                enhance your experience.
              </li>
              <li>
                <strong>Log Data:</strong> We may collect IP addresses and browser
                data to monitor site performance and troubleshoot issues.
              </li>
            </ul>

            <h3 className={subHeading}>2. How We Use Your Information</h3>
            <ul className={`${proseList} mb-4`}>
              <li>To authenticate users through Clerk's services.</li>
              <li>
                To manage personalized features (like saving comics you want to be
                notified about).
              </li>
              <li>
                To communicate with you about important updates or account-related
                issues.
              </li>
              <li>To analyze site performance and improve functionality.</li>
            </ul>

            <h3 className={subHeading}>3. Sharing of Information</h3>
            <ul className={`${proseList} mb-4`}>
              <li>
                We use <strong>Clerk</strong> for authentication and user
                management. Clerk may collect and store your information according
                to their{" "}
                <Link
                  href="https://clerk.dev/privacy"
                  target="_blank"
                  variant="underline"
                >
                  privacy policy
                </Link>
                .
              </li>
              <li>
                We do not sell or share your personal information with third
                parties.
              </li>
              <li>
                We may use <strong>third-party services</strong> (e.g., hosting,
                analytics) that may collect non-personal data.
              </li>
              <li>
                We use{" "}
                <Link
                  href="https://www.buymeacoffee.com/"
                  target="_blank"
                  variant="underline"
                >
                  Buy Me a Coffee
                </Link>{" "}
                for optional donations. Please refer to their
                <Link
                  href="https://www.buymeacoffee.com/privacy-policy"
                  variant="underline"
                >
                  privacy policy
                </Link>{" "}
                to understand how your data is handled during transactions.
              </li>
            </ul>

            <h3 className={subHeading}>4. Data Security</h3>
            <p className={`${proseP} mb-4`}>
              We use reasonable security measures to protect your data, but no
              service is entirely secure.
            </p>

            <h3 className={subHeading}>5. Your Rights and Choices</h3>
            <ul className={`${proseList} mb-4`}>
              <li>
                You can delete your account at any time on your{" "}
                <Link href="/profile" variant="underline">
                  profile
                </Link>{" "}
                page.
              </li>
              <li>
                You can disable cookies in your browser settings, though this may
                affect certain features.
              </li>
            </ul>

            <h3 className={subHeading}>6. Children&apos;s Privacy</h3>
            <p className={`${proseP} mb-4`}>
              This site is not intended for users under 13, and we do not knowingly
              collect data from children.
            </p>

            <h3 className={subHeading}>7. Changes to the Policy</h3>
            <p className={`${proseP} mb-8`}>
              We may update this policy occasionally. If there are significant
              changes, we will notify you via email or on the site.
            </p>
          </section>

          <hr className="my-12 border-line" />

          <section id="author-message">
            <h2 className={sectionTitle}>Message from the Developer:</h2>
            <ul className={proseList}>
              <li>I built this website to fulfill my own needs.</li>
              <li>
                You don't have to use this website to reserve tickets. I provide
                links so you can reserve directly through{" "}
                <Link
                  href="https://comedycellar.com"
                  target="_blank"
                  variant="underline"
                >
                  Comedy Cellar
                </Link>
                .
              </li>
              <li>
                Authentication and user management are handled by{" "}
                <Link href="https://clerk.com" target="_blank" variant="underline">
                  Clerk
                </Link>
                . I don't collect or manage any personal data. However, to offer
                personalized features, I need to identify users. You can delete your
                account at any time for any reason. When you delete your account,
                all associated data, including personalized settings, will also be
                deleted and cannot be recovered.
              </li>
            </ul>
          </section>

          {/* <section id="contact">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p>
              If you have any questions about these Terms or our Privacy Policy,
              contact us at
              <strong>[email here] </strong>.
            </p>
          </section> */}
        </CardBody>
      </Card>
    </div>
  );
}
