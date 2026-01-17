"use client";

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
import { LogOut, User, LayoutDashboard } from "lucide-react";

interface UserMenuProps {
  showDashboardLink?: boolean;
  companySlug?: string;
}

export function UserMenu({ showDashboardLink = true, companySlug }: UserMenuProps) {
  const { data: session } = useSession();
  const t = useTranslations("auth");
  const tNav = useTranslations("nav");

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
  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user.email?.charAt(0).toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image || undefined} alt={user.name || ""} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {showDashboardLink && (
          <DropdownMenuItem asChild>
            <Link
              href={companySlug ? `/c/${companySlug}/my-appointments` : "/user"}
              className="cursor-pointer"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {companySlug ? tNav("myAppointments") : tNav("dashboard")}
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link href={companySlug ? `/c/${companySlug}/user/profile` : "/user/profile"} className="cursor-pointer">
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
