import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Mail, MapPin, MessageSquare, PackageSearch } from "lucide-react";
import { PublicShell } from "@/components/remitship/public-shell";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/remitship";

export const Route = createFileRoute("/contact")({
  head: () =>
    pageHead(
      "Contact",
      "Contact RemitShip about international shipping, shipment tracking, and service availability.",
      "/contact",
    ),
  component: Contact,
});

function Contact() {
  return (
    <PublicShell>
      <section className="page-title">
        <div className="page-width">
          <div className="eyebrow">LET’S START A CONVERSATION</div>
          <h1>
            Contact RemitShip<span className="text-primary">.</span>
          </h1>
          <p>Your shipment matters. Your questions do, too.</p>
        </div>
      </section>
      <section className="page-width contact-content">
        <article>
          <MessageSquare size={32} />
          <h2>Shipping enquiries</h2>
          <p>For shipping questions and support, email our team:</p>
          <p>
            <Mail size={18} aria-hidden="true" />{" "}
            <a href="mailto:support@remitship.online">support@remitship.online</a>
          </p>
          <p>RemitShip serves customers online and nationwide across the United States.</p>
          <p>
            <MapPin size={18} aria-hidden="true" /> Business address:{" "}
            <a
              href="https://www.google.com/maps/search/?api=1&query=800%20East%20Grace%20Street%2C%20Richmond%2C%20VA%2023219%2C%20USA"
              target="_blank"
              rel="noreferrer"
            >
              800 East Grace Street, Richmond, VA 23219, USA
            </a>
          </p>
          <p>
            Have your origin, destination, parcel weight, and tracking number ready when contacting
            us.
          </p>
        </article>
        <article>
          <PackageSearch size={32} />
          <h2>Looking for an update?</h2>
          <p>Check the most recent recorded checkpoints and any available delivery estimate.</p>
          <Button asChild>
            <Link to="/track" search={{ number: "", demo: false }}>
              Track your shipment <ArrowRight />
            </Link>
          </Button>
        </article>
      </section>
    </PublicShell>
  );
}
