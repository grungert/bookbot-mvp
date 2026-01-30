"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

export default function VerifyEmailTokenPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const params = useParams();
  const token = params.token as string;

  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verify email on mount
  useEffect(() => {
    async function verifyEmail() {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Verification failed");
          setIsSuccess(false);
        } else {
          setIsSuccess(true);
        }
      } catch {
        setError("An error occurred during verification");
        setIsSuccess(false);
      } finally {
        setIsVerifying(false);
      }
    }

    verifyEmail();
  }, [token]);

  const cardClassName = "w-full max-w-md bg-white/60 dark:bg-gray-900/60 backdrop-blur-md border-white/20 dark:border-gray-700/30 shadow-xl";

  // Loading state
  if (isVerifying) {
    return (
      <Card className={cardClassName}>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
          <CardTitle className="text-2xl">{t("verifyingEmail")}</CardTitle>
          <CardDescription>{t("pleaseWait")}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <Card className={cardClassName}>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">{t("emailVerified")}</CardTitle>
          <CardDescription>{t("emailVerifiedDescription")}</CardDescription>
        </CardHeader>
        <CardFooter className="flex justify-center">
          <Link href="/login">
            <Button>{t("login")}</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  // Error state
  return (
    <Card className={cardClassName}>
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center mb-4">
          <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <CardTitle className="text-2xl">{t("verificationFailed")}</CardTitle>
        <CardDescription>{t("verificationFailedDescription")}</CardDescription>
      </CardHeader>
      <CardFooter className="flex justify-center gap-2">
        <Link href="/login">
          <Button variant="outline">{t("login")}</Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
