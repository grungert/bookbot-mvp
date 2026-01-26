"use client";

import { useTranslations } from "next-intl";
import {
  AppointmentDetailSheet,
  AppointmentDetailData,
} from "./appointment-detail-sheet";

interface AppointmentSheetProps {
  appointment: AppointmentDetailData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCancel: (id: string) => void;
  isCancelling: boolean;
  companySlug: string;
  t: ReturnType<typeof useTranslations<"appointments">>;
  tCommon: ReturnType<typeof useTranslations<"common">>;
}

export function AppointmentSheet(props: AppointmentSheetProps) {
  return <AppointmentDetailSheet {...props} showCompany={false} />;
}
