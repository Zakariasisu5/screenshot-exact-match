/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  // eslint-disable-next-line prettier/prettier
  ArrowRight,
  Plane,
  Ship,
  Truck,
  ShieldCheck,
  Package,
  Clock,
  Globe2,
  Building2,
  User,
  ChevronRight,
} from "lucide-react";
import { PublicShell } from "@/components/remitship/public-shell";
import { TrackingForm } from "@/components/remitship/tracking-form";
import { Button } from "@/components/ui/button";
import { pageHead } from "@/lib/remitship";
import { useEffect, useRef, useState } from "react";
import freight from "@/assets/remitship-hq.jpg";
import manship from "@/assets/manship.jpeg";
import remitship from "@/assets/remitship.jpeg";

export const Route = createFileRoute("/")({
  head: () => {
    const headData = pageHead(
      "International Shipping, Air & Sea Cargo",
      "International shipping, air freight, sea cargo & road transport. Track your RemitShip shipment across borders with real-time updates."
    );
    return {
      ...headData,
      meta: [
        ...(headData.meta || []),
        { name: "google-site-verification", content: "-AGYwky1GR5qBvq_o9jJezfh7bTmJE65Y0a3Ehl4FQk" }
      ]
    };
  },
  component: Home,
});

function Home() {
  const [scrollY, setScrollY] = useState(0);
  const imageRef1 = useRef<HTMLDivElement>(null);
  const imageRef2 = useRef<HTMLDivElement>(null);

  // Debug: Log image paths
  console.log("Image paths:", { freight, manship, remitship });

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    // Intersection Observer for fade-in animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("scroll-visible");
          }
        });
      },
      { threshold: 0.1 },
    );

    if (imageRef1.current) observer.observe(imageRef1.current);
    if (imageRef2.current) observer.observe(imageRef2.current);

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <PublicShell>
      {/* Hero with integrated tracking */}
      <section
        className="dhl-hero"
        style={{
          position: "relative",
          minHeight: "600px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          background: "#10284B",
        }}
      >
        <img
          src={freight}
          alt="RemitShip headquarters on Logistics Drive, Accra, Ghana"
          width={1536}
          height={1024}
          className="hero-image"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            zIndex: 0,
          }}
        />
        <div
          className="hero-shade"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(135deg, rgba(16, 40, 75, 0.5) 0%, rgba(16, 40, 75, 0.4) 100%)",
            zIndex: 1,
          }}
        />
        <div
          className="page-width hero-content-dhl"
          style={{
            position: "relative",
            zIndex: 2,
            textAlign: "center",
            color: "white",
            padding: "3rem 2rem",
            maxWidth: "800px",
            margin: "0 auto",
          }}
        >
          <h1
            style={{
              fontSize: "3.5rem",
              fontWeight: 800,
              marginBottom: "1rem",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              textShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
              color: "white",
            }}
          >
            Welcome to RemitShip
          </h1>
          <p
            className="hero-subtitle"
            style={{ fontSize: "1.25rem", marginBottom: "3rem", opacity: 0.95 }}
          >
            Excellence in international shipping and logistics
          </p>

          {/* Inline tracking */}
          <div
            className="hero-tracking-card"
            style={{
              background: "white",
              borderRadius: "12px",
              padding: "2.5rem",
              boxShadow: "0 10px 40px rgba(0, 0, 0, 0.15)",
              textAlign: "left",
            }}
          >
            <h2
              style={{
                color: "#10284B",
                fontSize: "1.75rem",
                fontWeight: 700,
                marginBottom: "1.5rem",
              }}
            >
              Track Your Shipment
            </h2>
            <TrackingForm />
            <p
              className="tracking-hint"
              style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#6b7280" }}
            >
              Enter your tracking number to see real-time updates
            </p>
          </div>
        </div>
      </section>

      {/* Service Categories - DHL Structure */}
      <section className="page-width service-categories">
        {/* Document & Parcel Shipping */}
        <div className="service-category-card">
          <div className="category-header">
            <div className="category-icon">
              <Package size={40} strokeWidth={1.5} />
            </div>
            <div>
              <h2>Document and Parcel Shipping</h2>
              <span className="category-badge">For All Shippers</span>
            </div>
          </div>

          <p className="category-description">
            Fast, reliable express shipping for documents and parcels. Perfect for businesses and
            individuals sending internationally.
          </p>

          <h3 className="services-heading">Services Available</h3>
          <div className="service-options-grid">
            <div className="service-option">
              <Plane size={24} />
              <div>
                <strong>Express Air Delivery</strong>
                <p>Next possible business day</p>
              </div>
              <ChevronRight size={18} />
            </div>
            <div className="service-option">
              <Clock size={24} />
              <div>
                <strong>Flexible Delivery Times</strong>
                <p>Choose your delivery window</p>
              </div>
              <ChevronRight size={18} />
            </div>
            <div className="service-option">
              <ShieldCheck size={24} />
              <div>
                <strong>Insurance & Protection</strong>
                <p>Secure your valuable items</p>
              </div>
              <ChevronRight size={18} />
            </div>
            <div className="service-option">
              <Globe2 size={24} />
              <div>
                <strong>Import & Export Services</strong>
                <p>Flexible international options</p>
              </div>
              <ChevronRight size={18} />
            </div>
          </div>

          <Button asChild className="category-cta">
            <Link to="/services">
              Learn more about express shipping <ArrowRight />
            </Link>
          </Button>
        </div>

        {/* Cargo Shipping */}
        <div className="service-category-card">
          <div className="category-header">
            <div className="category-icon cargo">
              <Truck size={40} strokeWidth={1.5} />
            </div>
            <div>
              <h2>Cargo Shipping</h2>
              <span className="category-badge business">Business Solutions</span>
            </div>
          </div>

          <p className="category-description">
            Comprehensive freight forwarding for businesses. Air, ocean, road, and rail solutions
            for your commercial cargo needs.
          </p>

          <h3 className="services-heading">Services Available</h3>
          <div className="service-options-grid">
            <div className="service-option">
              <Plane size={24} />
              <div>
                <strong>Air Freight</strong>
                <p>Fast international cargo transport</p>
              </div>
              <ChevronRight size={18} />
            </div>
            <div className="service-option">
              <Truck size={24} />
              <div>
                <strong>Road Freight</strong>
                <p>Reliable ground transportation</p>
              </div>
              <ChevronRight size={18} />
            </div>
            <div className="service-option">
              <Ship size={24} />
              <div>
                <strong>Ocean Freight</strong>
                <p>Cost-effective sea shipping</p>
              </div>
              <ChevronRight size={18} />
            </div>
            <div className="service-option">
              <Building2 size={24} />
              <div>
                <strong>Warehousing Solutions</strong>
                <p>Secure storage and distribution</p>
              </div>
              <ChevronRight size={18} />
            </div>
          </div>

          <Button asChild className="category-cta" variant="outline">
            <Link to="/services">
              Explore cargo solutions <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      {/* Image Section 1 - Parallax Effect with Content */}
      <section
        ref={imageRef1}
        className="scroll-image-section"
        style={{
          position: "relative",
          minHeight: "600px",
          display: "flex",
          alignItems: "center",
          overflow: "hidden",
          background: "#10284B",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <img
            src={manship}
            alt="RemitShip fleet and logistics operations"
            onError={(e) => {
              console.error("Failed to load manship image:", manship);
              console.error("Error event:", e);
            }}
            onLoad={() => console.log("✅ Manship image loaded successfully:", manship)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              display: "block",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to right, rgba(16, 40, 75, 0.9) 0%, rgba(16, 40, 75, 0.4) 100%)",
            }}
          />
        </div>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "4rem 2rem",
            color: "white",
          }}
        >
          <div style={{ maxWidth: "600px" }}>
            <h2
              style={{
                fontSize: "3rem",
                fontWeight: 700,
                marginBottom: "1.5rem",
                lineHeight: 1.2,
              }}
            >
              Our Fleet, Your Trust
            </h2>
            <p
              style={{
                fontSize: "1.25rem",
                lineHeight: 1.6,
                marginBottom: "2rem",
                opacity: 0.95,
              }}
            >
              With a modern fleet and experienced logistics team, we ensure your shipments arrive
              safely and on time, every time.
            </p>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Button
                asChild
                size="lg"
                style={{
                  background: "white",
                  color: "#10284B",
                  fontWeight: 600,
                }}
              >
                <Link
                  to="/services"
                  style={{ color: "#10284B", display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  Explore Services <ArrowRight />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                style={{
                  borderColor: "white",
                  color: "white",
                  background: "transparent",
                }}
              >
                <Link
                  to="/contact"
                  style={{ color: "white", display: "flex", alignItems: "center", gap: "0.5rem" }}
                >
                  Get a Quote <ArrowUpRight />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        style={{
          background: "var(--card)",
          borderTop: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
          padding: "4rem 2rem",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "3rem",
            textAlign: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "3.5rem",
                fontWeight: 700,
                color: "#10284B",
                marginBottom: "0.5rem",
              }}
            >
              15+
            </div>
            <div
              style={{ fontSize: "1.125rem", color: "var(--muted-foreground)", fontWeight: 500 }}
            >
              Years of Excellence
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "3.5rem",
                fontWeight: 700,
                color: "#10284B",
                marginBottom: "0.5rem",
              }}
            >
              50K+
            </div>
            <div
              style={{ fontSize: "1.125rem", color: "var(--muted-foreground)", fontWeight: 500 }}
            >
              Shipments Delivered
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "3.5rem",
                fontWeight: 700,
                color: "#10284B",
                marginBottom: "0.5rem",
              }}
            >
              100+
            </div>
            <div
              style={{ fontSize: "1.125rem", color: "var(--muted-foreground)", fontWeight: 500 }}
            >
              Countries Served
            </div>
          </div>
          <div>
            <div
              style={{
                fontSize: "3.5rem",
                fontWeight: 700,
                color: "#10284B",
                marginBottom: "0.5rem",
              }}
            >
              99.8%
            </div>
            <div
              style={{ fontSize: "1.125rem", color: "var(--muted-foreground)", fontWeight: 500 }}
            >
              On-Time Delivery
            </div>
          </div>
        </div>
      </section>

      {/* Image Section 2 - Slide-in Effect */}
      <section
        ref={imageRef2}
        className="scroll-image-section"
        style={{
          position: "relative",
          minHeight: "500px",
          display: "grid",
          gridTemplateColumns: window.innerWidth > 1024 ? "1fr 1fr" : "1fr",
          gap: 0,
        }}
      >
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            minHeight: "500px",
          }}
        >
          <img
            src={remitship}
            alt="RemitShip international shipping services"
            onError={(e) => {
              console.error("Failed to load remitship image:", remitship);
              e.currentTarget.style.display = "none";
            }}
            onLoad={() => console.log("Remitship image loaded successfully:", remitship)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              transform: `scale(${1 + scrollY * 0.0001})`,
              transition: "transform 0.1s ease-out",
            }}
          />
        </div>

        <div
          style={{
            background: "#10284B",
            color: "white",
            padding: "4rem 3rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <h2
            style={{
              fontSize: "2.5rem",
              fontWeight: 700,
              marginBottom: "1.5rem",
              lineHeight: 1.2,
            }}
          >
            Technology-Driven Logistics
          </h2>
          <p
            style={{
              fontSize: "1.125rem",
              lineHeight: 1.7,
              marginBottom: "2rem",
              opacity: 0.95,
            }}
          >
            Track your shipments in real-time with our advanced tracking system. Get instant
            notifications and complete visibility from pickup to delivery.
          </p>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.5rem",
              marginBottom: "2rem",
            }}
          >
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <ShieldCheck size={24} style={{ flexShrink: 0, marginTop: "0.25rem" }} />
              <div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Real-Time Tracking
                </h3>
                <p style={{ opacity: 0.9, fontSize: "0.9375rem" }}>
                  Monitor every step of your shipment's journey
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <Globe2 size={24} style={{ flexShrink: 0, marginTop: "0.25rem" }} />
              <div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Global Coverage
                </h3>
                <p style={{ opacity: 0.9, fontSize: "0.9375rem" }}>
                  Seamless shipping to over 100 countries
                </p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <Clock size={24} style={{ flexShrink: 0, marginTop: "0.25rem" }} />
              <div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "0.25rem" }}>
                  Instant Notifications
                </h3>
                <p style={{ opacity: 0.9, fontSize: "0.9375rem" }}>
                  Stay updated with SMS and email alerts
                </p>
              </div>
            </div>
          </div>

          <Button
            asChild
            size="lg"
            style={{
              background: "white",
              color: "#10284B",
              fontWeight: 600,
              alignSelf: "flex-start",
            }}
          >
            <Link
              to="/"
              style={{ color: "#10284B", display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              Track Now <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      {/* Trust indicators */}
      <section className="trust-band">
        <div className="page-width trust-content">
          <h2>Why Ship with RemitShip?</h2>
          <div className="trust-grid">
            <div className="trust-item">
              <ShieldCheck size={32} />
              <h3>Secure Handling</h3>
              <p>Every shipment protected with care and professional handling standards</p>
            </div>
            <div className="trust-item">
              <Globe2 size={32} />
              <h3>Global Network</h3>
              <p>Connected routes spanning continents with reliable local partners</p>
            </div>
            <div className="trust-item">
              <Clock size={32} />
              <h3>On-Time Delivery</h3>
              <p>Committed to meeting delivery estimates with verified tracking updates</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="page-width cta-section">
        <div className="cta-grid">
          <div className="cta-card">
            <User size={48} />
            <h3>Personal Shipping</h3>
            <p>Send packages to family and friends anywhere in the world</p>
            <Button asChild variant="outline">
              <Link to="/contact">
                Get started <ArrowUpRight />
              </Link>
            </Button>
          </div>
          <div className="cta-card">
            <Building2 size={48} />
            <h3>Business Solutions</h3>
            <p>Tailored logistics for growing businesses and established enterprises</p>
            <Button asChild>
              <Link to="/contact">
                Request a quote <ArrowUpRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
