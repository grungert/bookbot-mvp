"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Clock, MessageSquare, Calendar, CheckCircle } from "lucide-react";
import { UseCaseLayout } from "@/components/use-cases";

interface ContactPageProps {
  supportEmail: string;
}

export function ContactPageComponent({ supportEmail }: ContactPageProps) {
  const t = useTranslations("contactPage");
  const prefersReducedMotion = useReducedMotion();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: prefersReducedMotion ? 0 : 0.1,
        delayChildren: prefersReducedMotion ? 0 : 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: prefersReducedMotion ? 0 : 0.5, ease: [0, 0, 0.2, 1] },
    },
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const contactInfo = [
    {
      icon: Mail,
      title: t("emailTitle"),
      value: supportEmail,
    },
    {
      icon: Clock,
      title: t("hoursTitle"),
      value: t("hoursValue"),
    },
    {
      icon: MessageSquare,
      title: t("responseTitle"),
      value: t("responseValue"),
    },
  ];

  return (
    <UseCaseLayout>
      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            className="max-w-4xl mx-auto text-center"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
              style={{
                textShadow: "rgb(255 255 255 / 80%) 0px 0px 20px, rgb(255 255 255 / 60%) 0px 0px 40px"
              }}
              variants={itemVariants}
            >
              {t("heroTitle")}
            </motion.h1>
            <motion.p
              className="text-xl md:text-2xl text-foreground/80"
              variants={itemVariants}
            >
              {t("heroSubtitle")}
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            {/* Form */}
            <motion.div
              className="p-8 rounded-2xl bg-background/60 backdrop-blur-md border border-white/10"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
            >
              <motion.h2 className="text-2xl font-bold mb-6" variants={itemVariants}>
                {t("formTitle")}
              </motion.h2>

              {isSubmitted ? (
                <motion.div
                  className="text-center py-12"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{t("successTitle")}</h3>
                  <p className="text-foreground/70">{t("successMessage")}</p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <motion.div variants={itemVariants}>
                    <Label htmlFor="name">{t("nameLabel")}</Label>
                    <Input
                      id="name"
                      placeholder={t("namePlaceholder")}
                      required
                      className="mt-2"
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Label htmlFor="email">{t("emailLabel")}</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={t("emailPlaceholder")}
                      required
                      className="mt-2"
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Label htmlFor="subject">{t("subjectLabel")}</Label>
                    <Input
                      id="subject"
                      placeholder={t("subjectPlaceholder")}
                      required
                      className="mt-2"
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Label htmlFor="message">{t("messageLabel")}</Label>
                    <Textarea
                      id="message"
                      placeholder={t("messagePlaceholder")}
                      required
                      rows={5}
                      className="mt-2"
                    />
                  </motion.div>

                  <motion.div variants={itemVariants}>
                    <Button
                      type="submit"
                      variant="gradient"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? t("submitting") : t("submitButton")}
                    </Button>
                  </motion.div>
                </form>
              )}
            </motion.div>

            {/* Info */}
            <motion.div
              className="space-y-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
            >
              <motion.h2 className="text-2xl font-bold" variants={itemVariants}>
                {t("infoTitle")}
              </motion.h2>

              <motion.div className="space-y-6" variants={itemVariants}>
                {contactInfo.map((info, index) => {
                  const Icon = info.icon;
                  return (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 rounded-xl bg-background/60 backdrop-blur-md border border-white/10"
                    >
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                        <Icon className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <div className="font-medium">{info.title}</div>
                        <div className="text-foreground/70">{info.value}</div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>

              {/* Demo CTA */}
              <motion.div
                className="p-6 rounded-xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20"
                variants={itemVariants}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">{t("demoTitle")}</div>
                    <p className="text-foreground/70 text-sm mb-3">
                      {t("demoDesc")}
                    </p>
                    <Button variant="outline" size="sm">
                      {t("demoButton")}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </UseCaseLayout>
  );
}
