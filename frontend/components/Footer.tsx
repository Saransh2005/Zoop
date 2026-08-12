"use client";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  // Hide footer inside meeting room
  if (pathname?.startsWith("/meeting/")) return null;

  return (
    <footer className="site-footer">
      <div className="footer-main">
        <div className="footer-col">
          <h4 className="footer-col-title">About</h4>
          <ul className="footer-links">
            <li><a href="#">Zoom Blog</a></li>
            <li><a href="#">Customers</a></li>
            <li><a href="#">Our Team</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Integrations</a></li>
            <li><a href="#">Partners</a></li>
            <li><a href="#">Investors</a></li>
            <li><a href="#">Press</a></li>
            <li><a href="#">Sustainability &amp; ESG</a></li>
            <li><a href="#">Zoom Cares</a></li>
            <li><a href="#">Media Kit</a></li>
            <li><a href="#">How to Videos</a></li>
            <li><a href="#">Developer Platform</a></li>
            <li><a href="#">Zoom Ventures</a></li>
            <li><a href="#">Zoom Merchandise Store</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Download</h4>
          <ul className="footer-links">
            <li><a href="#">Zoom Workplace App</a></li>
            <li><a href="#">Zoom Room Apps</a></li>
            <li><a href="#">Zoom Rooms Controller</a></li>
            <li><a href="#">Browser Extension</a></li>
            <li><a href="#">Outlook Plug-in</a></li>
            <li><a href="#">Android App</a></li>
            <li><a href="#">Zoom Virtual Backgrounds</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Sales</h4>
          <ul className="footer-links">
            <li><a href="#" className="footer-phone">0008000503335</a></li>
            <li><a href="#">Contact Sales</a></li>
            <li><a href="#">Plans &amp; Pricing</a></li>
            <li><a href="#">Request a Demo</a></li>
            <li><a href="#">Webinars and Events</a></li>
            <li><a href="#">Zoom Experience Center</a></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-col-title">Support</h4>
          <ul className="footer-links">
            <li><a href="#">Test Zoom</a></li>
            <li><a href="#">Account</a></li>
            <li><a href="#">Support Center</a></li>
            <li><a href="#">Learning Center</a></li>
            <li><a href="#">Zoom Community</a></li>
            <li><a href="#">Feedback</a></li>
            <li><a href="#">Contact Us</a></li>
            <li><a href="#">Accessibility</a></li>
            <li><a href="#">Developer support</a></li>
            <li><a href="#">Privacy, Security, Legal Policies,<br />and Modern Slavery Act</a></li>
            <li><a href="#">Transparency Statement</a></li>
          </ul>
        </div>

        <div className="footer-col footer-col-right">
          <div className="footer-selectors">
            <div className="footer-selector-group">
              <h4 className="footer-col-title">Language</h4>
              <select className="footer-select" id="footer-language">
                <option>English</option>
                <option>हिन्दी</option>
                <option>Español</option>
                <option>Français</option>
                <option>Deutsch</option>
                <option>日本語</option>
                <option>中文</option>
              </select>
            </div>

            <div className="footer-selector-group" style={{ marginTop: 20 }}>
              <h4 className="footer-col-title">Currency</h4>
              <select className="footer-select" id="footer-currency">
                <option>Indian Rupee ₹</option>
                <option>US Dollar $</option>
                <option>Euro €</option>
                <option>GBP £</option>
              </select>
            </div>
          </div>

          {/* Social Icons */}
          <div className="footer-social">
            {/* WordPress */}
            <a href="#" className="footer-social-icon" id="footer-social-wp" title="WordPress">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM3.5 12c0-1.232.255-2.4.706-3.463l3.889 10.658A8.5 8.5 0 0 1 3.5 12zm8.5 8.5a8.5 8.5 0 0 1-2.42-.351l2.571-7.47 2.635 7.217a.752.752 0 0 0 .056.109A8.49 8.49 0 0 1 12 20.5zm1.172-11.533c.512-.027.973-.08.973-.08.459-.054.405-.729-.054-.702 0 0-1.378.108-2.267.108-.836 0-2.241-.108-2.241-.108-.459-.027-.513.675-.054.702 0 0 .432.053.89.08l1.322 3.62-1.857 5.568-3.088-9.188c.512-.027.973-.08.973-.08.459-.054.405-.729-.054-.702 0 0-1.378.108-2.267.108-.16 0-.348-.004-.547-.01A8.5 8.5 0 0 1 12 3.5c2.227 0 4.257.855 5.773 2.253-.037-.002-.073-.007-.11-.007-1.016 0-1.737.885-1.737 1.837 0 .854.493 1.575 1.016 2.431.394.69.854 1.575.854 2.854 0 .887-.34 1.913-.783 3.343l-1.027 3.43-3.814-11.174zm3.516 10.506 2.621-7.576c.49-1.226.653-2.205.653-3.078 0-.316-.021-.61-.058-.885A8.497 8.497 0 0 1 20.5 12a8.48 8.48 0 0 1-3.812 7.073z"/>
              </svg>
            </a>
            {/* LinkedIn */}
            <a href="#" className="footer-social-icon" id="footer-social-li" title="LinkedIn">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            {/* X / Twitter */}
            <a href="#" className="footer-social-icon" id="footer-social-x" title="X (Twitter)">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            {/* YouTube */}
            <a href="#" className="footer-social-icon" id="footer-social-yt" title="YouTube">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
            </a>
            {/* Facebook */}
            <a href="#" className="footer-social-icon" id="footer-social-fb" title="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </a>
            {/* Instagram */}
            <a href="#" className="footer-social-icon" id="footer-social-ig" title="Instagram">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="footer-bottom">
        <p className="footer-copyright">
          Copyright ©2026 Zoom Communications, Inc. All rights reserved.
        </p>
        <div className="footer-bottom-links">
          <a href="#">Terms</a>
          <span className="footer-sep">|</span>
          <a href="#">Privacy</a>
          <span className="footer-sep">|</span>
          <a href="#">Trust Center</a>
          <span className="footer-sep">|</span>
          <a href="#">Acceptable Use Guidelines</a>
          <span className="footer-sep">|</span>
          <a href="#">Legal &amp; Compliance</a>
          <span className="footer-sep">|</span>
          <a href="#" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              background: "#0E72ED", borderRadius: 4,
              width: 26, height: 16, fontSize: 9, fontWeight: 700, color: "white",
              letterSpacing: 0.5,
            }}>CA</span>
            Your Privacy Choices
          </a>
          <span className="footer-sep">|</span>
          <a href="#">Cookie Preferences</a>
        </div>
      </div>
    </footer>
  );
}
