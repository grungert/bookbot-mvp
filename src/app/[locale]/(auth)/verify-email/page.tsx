"use client";

import { useState, Suspense } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";

function VerifyEmailContent() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const [isResending, setIsResending] = useState(false);

  async function handleResend() {
    if (!email) {
      toast.error(t("noEmailProvided"));
      return;
    }

    setIsResending(true);

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, locale }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || tCommon("error"));
        return;
      }

      toast.success(t("verificationResent"));
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsResending(false);
    }
  }

  return (
    <Card className="w-full max-w-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-white/20 dark:border-gray-700/30 shadow-xl">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">{t("checkYourEmail")}</CardTitle>
        <CardDescription>
          {email ? t("verificationSentTo", { email }) : t("verificationSent")}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-sm text-muted-foreground mb-4">
          {t("verificationInstructions")}
        </p>
        <p className="text-sm text-muted-foreground">
          {t("didNotReceiveEmail")}
        </p>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        {email && (
          <Button
            variant="outline"
            className="w-full"
            onClick={handleResend}
            disabled={isResending}
          >
            {isResending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {tCommon("loading")}
              </>
            ) : (
              t("resendVerification")
            )}
          </Button>
        )}
        <Link href="/login" className="w-full">
          <Button variant="ghost" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToLogin")}
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

function VerifyEmailLoading() {
  return (
    <div className="flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
