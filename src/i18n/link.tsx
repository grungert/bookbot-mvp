"use client";

import { ComponentProps } from "react";
import { Link as IntlLink, usePathname } from "@/i18n/routing";
import { useTransitionRouter } from "next-view-transitions";
import { useLocale } from "next-intl";

type IntlLinkProps = ComponentProps<typeof IntlLink>;

/**
 * Link component that combines next-intl locale-aware routing
 * with next-view-transitions for smooth page transitions.
 *
 * Use this for landing page navigation to get animated transitions.
 * Falls back gracefully on browsers that don't support View Transitions API.
 */
export function TransitionLink({
  href,
  onClick,
  children,
  ...props
}: IntlLinkProps) {
  const router = useTransitionRouter();
  const locale = useLocale();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Call original onClick if provided
    onClick?.(e);

    // If default was prevented or it's a modified click, let browser handle it
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) {
      return;
    }

    // For internal navigation, use transition router with locale prefix
    if (typeof href === "string" && !href.startsWith("http")) {
      e.preventDefault();
      const localePath = `/${locale}${href.startsWith("/") ? href : `/${href}`}`;
      router.push(localePath);
    } else if (typeof href === "object" && href.pathname) {
      e.preventDefault();
      const localePath = `/${locale}${href.pathname.startsWith("/") ? href.pathname : `/${href.pathname}`}`;
      router.push(localePath);
    }
  };

  return (
    <IntlLink href={href} onClick={handleClick} {...props}>
      {children}
    </IntlLink>
  );
}
