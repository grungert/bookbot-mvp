"use client";

import { useState, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LogOut, User, LayoutDashboard, CalendarDays } from "lucide-react";

interface UserMenuProps {
  showDashboardLink?: boolean;
  companySlug?: string;
}

interface UserProfile {
  name: string | null;
  email: string;
  image: string | null;
}

export function UserMenu({ showDashboardLink = true, companySlug }: UserMenuProps) {
  const { data: session } = useSession();
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch user profile to get the latest image
  useEffect(() => {
    if (session?.user) {
      fetch("/api/user/profile")
        .then((res) => res.ok ? res.json() : null)
        .then((data) => {
          if (data) {
            setProfile(data);
          }
        })
        .catch(() => {
          // Silently fail - will use session data as fallback
        });
    }
  }, [session?.user]);

  // Render placeholder during SSR to prevent hydration mismatch
  if (!mounted) {
    return (
      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
        <Avatar className="h-8 w-8">
          <AvatarFallback>...</AvatarFallback>
        </Avatar>
      </Button>
    );
  }

  if (!session?.user) {
    return (
      <Link href="/login">
        <Button variant="outline" size="sm">
          {t("login")}
        </Button>
      </Link>
    );
  }

  const user = session.user;
  const displayName = profile?.name || user.name;
  const displayEmail = profile?.email || user.email;
  const displayImage = profile?.image || user.image;

  const initials = displayName
    ? displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : displayEmail?.charAt(0).toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={displayImage || undefined} alt={displayName || ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {displayEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {showDashboardLink && companySlug && (
          <DropdownMenuItem asChild>
            <Link
              href={`/c/${companySlug}/my-appointments`}
              className="cursor-pointer"
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {tNav("allBookings")}
            </Link>
          </DropdownMenuItem>
        )}
        {showDashboardLink && !companySlug && (
          <DropdownMenuItem asChild>
            <Link href="/user" className="cursor-pointer">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {tNav("dashboard")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href={companySlug ? `/c/${companySlug}/admin/profile` : "/user/profile"} className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            {tNav("profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t("logout")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
