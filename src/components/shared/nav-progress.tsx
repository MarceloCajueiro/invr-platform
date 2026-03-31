"use client";

import { useLinkStatus } from "next/link";

/**
 * Spinner for desktop sidebar links.
 * Must be rendered as a child of a <Link> component.
 */
export function NavLinkPending() {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden
      className={`nav-link-pending ${pending ? "is-pending" : ""}`}
    />
  );
}

/**
 * Dot pulse for mobile bottom nav links.
 * Must be rendered as a child of a <Link> component.
 */
export function NavLinkPendingMobile() {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden
      className={`nav-link-pending-mobile ${pending ? "is-pending" : ""}`}
    />
  );
}
