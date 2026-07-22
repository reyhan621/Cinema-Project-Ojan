import {
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Twitter,
  Youtube,
  Home,
  Clapperboard,
  Popcorn,
  Sparkles,
  Clock,
  ChevronRight,
} from "lucide-react";
import { Link } from "react-router-dom";

import logo from "../assets/logo.png";

const quickLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/movies", label: "Movies", icon: Clapperboard },
  { href: "#", label: "Cinemas", icon: Popcorn },
  { href: "#", label: "Promotions", icon: Sparkles },
];

const socialLinks = [
  { icon: Facebook, label: "Facebook", href: "#" },
  { icon: Twitter, label: "Twitter", href: "#" },
  { icon: Instagram, label: "Instagram", href: "#" },
  { icon: Youtube, label: "YouTube", href: "#" },
];

const bottomLinks = [
  { label: "Privacy", href: "#" },
  { label: "Terms", href: "#" },
  { label: "Support", href: "#" },
];

export default function Footer() {
  return (
    <footer className="relative mt-24 overflow-hidden">
      {/* Gradient divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

      <div className="bg-dark-950">
        {/* Subtle radial glow at top */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-gradient-to-b from-primary-500/[0.05] via-accent-500/[0.02] to-transparent" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-10">
          {/* Main grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-14 lg:gap-10">
            {/* Brand — spans 5 cols on desktop */}
            <div className="lg:col-span-5">
              <Link
                to="/"
                className="inline-flex items-center gap-3 mb-8 group"
                aria-label="CINELUX Home"
              >
                <div className="relative">
                  <span className="relative flex h-12 w-12 items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 overflow-hidden">
                    <img
                      src={logo}
                      alt="CineLux Logo"
                      className="h-full w-full object-contain"
                    />
                    <span className="absolute inset-0 rounded-xl bg-primary-500/30 blur-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-2xl font-display font-bold text-white tracking-tight">
                    CINE<span className="text-gradient-premium">LUX</span>
                  </span>
                  <span className="text-[9px] font-medium uppercase tracking-[0.3em] text-neutral-500 -mt-0.5">
                    Premium Cinema
                  </span>
                </div>
              </Link>
              <p className="text-neutral-400 text-sm leading-relaxed max-w-sm mb-10">
                Premium moviegoing with curated showtimes, comfortable halls,
                quick checkout, and e-tickets ready before the lights go down.
              </p>

              {/* Social icons */}
              <div className="flex gap-3">
                {socialLinks.map(({ icon: Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    aria-label={label}
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-neutral-400 transition-all duration-300 hover:text-white hover:border-primary-500/40 hover:bg-primary-500/10 hover:scale-110 hover:shadow-lg hover:shadow-primary-500/15 active:scale-95 backdrop-blur-xl"
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links — spans 3 cols */}
            <div className="lg:col-span-3">
              <h3 className="text-xs font-bold text-white mb-7 uppercase tracking-widest">
                Quick Links
              </h3>
              <ul className="space-y-1.5">
                {quickLinks.map(({ href, label, icon: Icon }) => (
                  <li key={label}>
                    <Link
                      to={href}
                      className="group flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-neutral-400 transition-all duration-300 hover:text-white hover:translate-x-1.5 hover:bg-white/[0.05]"
                    >
                      <Icon className="h-4 w-4 text-neutral-500 transition-colors duration-300 group-hover:text-primary-400" />
                      <span>{label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact — spans 4 cols */}
            <div className="lg:col-span-4">
              <h3 className="text-xs font-bold text-white mb-7 uppercase tracking-widest">
                Contact Us
              </h3>
              <ul className="space-y-4 text-sm">
                <li className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-primary-400 border border-white/[0.06]">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-neutral-300">BPPTIK</p>
                  </div>
                </li>
                <li className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-primary-400 border border-white/[0.06]">
                    <Phone className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-neutral-300">+62 21 555 0199</p>
                  </div>
                </li>
                <li className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-primary-400 border border-white/[0.06]">
                    <Mail className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-neutral-300">care@platoscloud.id</p>
                  </div>
                </li>
                <li className="flex items-start gap-3.5">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-primary-400 border border-white/[0.06]">
                    <Clock className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-neutral-300">Monday – Sunday</p>
                    <p className="text-neutral-500 text-xs mt-0.5">
                      08:00 – 22:00
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom divider */}
          <div className="mt-16 h-px w-full bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

          {/* Footer bottom */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-neutral-500">
              &copy; 2026 Plato&apos;s Cloud. All rights reserved.
            </p>
            <nav
              className="flex items-center gap-1"
              aria-label="Footer legal links"
            >
              {bottomLinks.map(({ label, href }, i) => (
                <span key={label} className="flex items-center">
                  {i > 0 && (
                    <ChevronRight className="h-3 w-3 text-neutral-600 mx-1.5" />
                  )}
                  <a
                    href={href}
                    className="text-xs text-neutral-500 transition-colors duration-300 hover:text-neutral-300"
                  >
                    {label}
                  </a>
                </span>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
