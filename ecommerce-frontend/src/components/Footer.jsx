
import React from 'react';
import { Link } from 'react-router-dom';
import {
  FaTwitter,
  FaFacebookF,
  FaInstagram,
} from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-content">

        {/* About */}
        <div className="footer-col">
          <h4>About cai</h4>
          <ul>
            <li>
              <Link to="/about/story">Our Story</Link>
            </li>
            <li>
              <Link to="/about/philosophy">Philosophy</Link>
            </li>
            <li>
              <Link to="/about/careers">Careers</Link>
            </li>
            <li>
              <Link to="/about/press">Press</Link>
            </li>
          </ul>
        </div>

        {/* Customer Care */}
        <div className="footer-col">
          <h4>Customer Care</h4>
          <ul>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
            <li>
              <Link to="/shipping-returns">
                Shipping &amp; Returns
              </Link>
            </li>
            <li>
              <Link to="/faq">FAQ</Link>
            </li>
            <li>
              <Link to="/size-guide">Size Guide</Link>
            </li>
          </ul>
        </div>

        {/* Information */}
        <div className="footer-col">
          <h4>Information</h4>
          <ul>
            <li>
              <Link to="/privacy-policy">
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link to="/terms">
                Terms &amp; Conditions
              </Link>
            </li>
            <li>
              <Link to="/order-tracking">
                Order Tracking
              </Link>
            </li>
          </ul>
        </div>

        {/* News */}
        <div className="footer-col">
          <h4>News</h4>
          <ul>
            <li>
              <Link to="/blog">Blog</Link>
            </li>
            <li>
              <Link to="/events">Events</Link>
            </li>
            <li>
              <Link to="/newsletter">Newsletter</Link>
            </li>
          </ul>
        </div>

        {/* Contact Information */}
        <div className="footer-col footer-contact">
          <h4>Contact Information</h4>

          <ul>
            <li>
              <strong>HEADQUARTERS</strong>
              <br />
              312, Vasan Udhyog Bhavan, Sunmill Compound
            </li>

            <li>
              Phoenix Palladium - Lower Parel, Mumbai
            </li>

            <li>
              +918591237531
            </li>

            <li>
              info@Aureya.com
            </li>
          </ul>

          {/* Social Media */}
          <div className="footer-socials">

            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
            >
              <FaTwitter size={18} />
            </a>

            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <FaFacebookF size={18} />
            </a>

            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram size={18} />
            </a>

          </div>
        </div>
      </div>

      {/* Footer Bottom */}
      <div className="footer-bottom">
        <p>
          &copy; {year} Aureya Store Private Limited.
          All Rights Reserved
        </p>
      </div>
    </footer>
  );
};

export default Footer;
