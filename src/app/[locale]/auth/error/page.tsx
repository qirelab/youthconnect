"use client";

import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";

function ErrorContent() {
  const t = useTranslations("auth");
  const params = useSearchParams();
  const error = params.get("error");

  const errorMessages: Record<string, string> = {
    AccessDenied: t("error.accessDenied"),
    Configuration: "Server configuration error",
    Verification: "Verification failed",
  };

  return (
    <div className="center">
      <div className="card" style={{ maxWidth: 420, width: "100%" }}>
        <Image src="/logo.webp" alt="YouthConnect" width={96} height={96} className="logo" />
        <h1 className="title">{t("error.title")}</h1>
        <p className="error" style={{ marginTop: 0, marginBottom: 24 }}>
          {errorMessages[error || ""] || t("error.default")}
        </p>
        <Link href="/auth/signin" className="btn block">
          {t("error.tryAgain")}
        </Link>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div className="center">Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
