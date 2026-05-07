"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

import { APP_ASSETS } from "../../../constants/assets";

export default function MerchantSelectionPage() {
  const router = useRouter();

  const handleNavigation = (route: string) => {
    router.push(route);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ fontFamily: "'DM Sans', 'Outfit', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@400;600&display=swap');

        .home-shell {
          background: #f6f7f4;
        }
        .merchant-card {
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .merchant-card:hover {
          transform: translateY(-6px);
        }
        .card-fino:hover {
          border-color: #d4a000 !important;
          box-shadow: 0 12px 40px rgba(212, 160, 0, 0.12);
        }
        .card-easybuzz:hover {
          border-color: #3a7d3a !important;
          box-shadow: 0 12px 40px rgba(58, 125, 58, 0.12);
        }
        .underline-bar {
          height: 2px;
          width: 0;
          border-radius: 99px;
          transition: width 0.4s ease;
        }
        .merchant-card:hover .underline-bar {
          width: 40px;
        }
        .arrow-btn {
          transition: background 0.25s, border-color 0.25s;
        }
        .card-fino:hover .arrow-btn {
          background: #fffae6;
          border-color: #d4a000;
        }
        .card-easybuzz:hover .arrow-btn {
          background: #f0faf0;
          border-color: #3a7d3a;
        }
        .card-fino:hover .card-label {
          color: #b8860b;
        }
        .card-easybuzz:hover .card-label {
          color: #2e6b2e;
        }
        .divider-line {
          height: 1px;
          background: #e0e0e0;
          margin: 0 auto;
          width: 96px;
        }
        .hero-panel {
          width: min(100%, 1040px);
          margin: 0 auto;
          background: #ffffff;
          border: 1px solid #e4e4e4;
          border-radius: 28px;
          box-shadow: 0 28px 80px rgba(20, 30, 48, 0.08);
        }
        @media (max-width: 768px) {
          .hero-panel {
            border-radius: 22px;
          }
        }
      `}</style>

      <header
        style={{
          background: "#f6f7f4",
          padding: "24px clamp(20px, 4vw, 40px) 0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "min(100%, 1040px)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <img
            src={APP_ASSETS.branding.companyLogo}
            alt="Company Logo"
            style={{ height: "44px", width: "auto", objectFit: "contain" }}
          />
        </div>
      </header>

      <main
        style={{
          background: "#f6f7f4",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px 56px",
        }}
      >
        <section className="hero-panel" style={{ padding: "clamp(28px, 4vw, 44px)" }}>
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <p
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "13px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#8d8d84",
                marginBottom: "10px",
                fontWeight: 400,
              }}
            >
              Payment Gateway
            </p>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(30px, 4vw, 42px)",
                fontWeight: 600,
                color: "#1a1a1a",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Select a Merchant
            </h1>
            <p
              style={{
                margin: "14px auto 0",
                maxWidth: "540px",
                fontSize: "15px",
                lineHeight: 1.7,
                color: "#666",
              }}
            >
              Choose the merchant workspace below to upload transaction data, review records, and generate invoices.
            </p>
            <div className="divider-line" style={{ marginTop: "20px" }} />
          </div>

          <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => handleNavigation("/fino")}
              className="merchant-card card-fino"
              style={{
                width: "min(100%, 300px)",
                padding: "34px 28px 30px",
                background: "#ffffff",
                border: "1.5px solid #ebebeb",
                borderRadius: "20px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "18px",
                outline: "none",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "14px",
                  background: "#d4a000",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                ₹
              </div>

              <div>
                <h3
                  className="card-label"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "#1a1a1a",
                    margin: "0 0 6px",
                    letterSpacing: "-0.02em",
                    transition: "color 0.25s",
                  }}
                >
                  FINO
                </h3>
                <div className="underline-bar" style={{ background: "#d4a000" }} />
              </div>

              <div
                className="arrow-btn"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  border: "1.5px solid #e0e0e0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowRight size={16} color="#888" />
              </div>
            </button>

            <button
              onClick={() => handleNavigation("/easybuzz")}
              className="merchant-card card-easybuzz"
              style={{
                width: "min(100%, 300px)",
                padding: "34px 28px 30px",
                background: "#ffffff",
                border: "1.5px solid #ebebeb",
                borderRadius: "20px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "18px",
                outline: "none",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "14px",
                  background: "#2e7d2e",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "28px",
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                ₹
              </div>

              <div>
                <h3
                  className="card-label"
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "#1a1a1a",
                    margin: "0 0 6px",
                    letterSpacing: "-0.02em",
                    transition: "color 0.25s",
                  }}
                >
                  Easybuzz
                </h3>
                <div className="underline-bar" style={{ background: "#2e7d2e" }} />
              </div>

              <div
                className="arrow-btn"
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  border: "1.5px solid #e0e0e0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowRight size={16} color="#888" />
              </div>
            </button>
          </div>

          <p
            style={{
              marginTop: "34px",
              textAlign: "center",
              fontSize: "12px",
              color: "#96968d",
              letterSpacing: "0.04em",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Select your preferred payment gateway to continue
          </p>
        </section>
      </main>
    </div>
  );
}
