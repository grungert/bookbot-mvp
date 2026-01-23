import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import {
  validatePasswordResetToken,
  consumePasswordResetToken,
} from "@/lib/tokens";
import { resetFailedLogins } from "@/lib/account-lockout";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { token, password } = parsed.data;

    // Validate the token
    const validation = await validatePasswordResetToken(token);

    if (!validation) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await hashPassword(password);

    // Update user's password and consume the token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: validation.userId },
        data: { password: hashedPassword },
      }),
    ]);

    await consumePasswordResetToken(token);

    // Reset any account lockout
    await resetFailedLogins(validation.userId);

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET endpoint to validate token (for checking before showing form)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");

    if (!token) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const validation = await validatePasswordResetToken(token);

    return NextResponse.json({
      valid: !!validation,
    });
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}
