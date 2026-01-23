import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createEmailVerificationToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { z } from "zod";

const resendVerificationSchema = z.object({
  email: z.string().email(),
  locale: z.string().optional().default("en"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resendVerificationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email, locale } = parsed.data;

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        success: true,
        message: "If an unverified account exists with this email, a verification link has been sent.",
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: "If an unverified account exists with this email, a verification link has been sent.",
      });
    }

    // Create new verification token
    const token = await createEmailVerificationToken(user.id);

    // Send verification email
    const emailResult = await sendVerificationEmail(user.email, token, locale);

    if (!emailResult.success) {
      console.error("Failed to send verification email:", emailResult.error);
      // Still return success to prevent enumeration
    }

    return NextResponse.json({
      success: true,
      message: "If an unverified account exists with this email, a verification link has been sent.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
