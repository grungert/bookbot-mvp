import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET all saved scenarios for the current user
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const scenarios = await prisma.pricingScenario.findMany({
      where: { createdBy: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        name: true,
        parameters: true,
        results: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ scenarios });
  } catch (error) {
    console.error("Error fetching scenarios:", error);
    return NextResponse.json(
      { error: "Failed to fetch scenarios" },
      { status: 500 }
    );
  }
}

// POST to create a new scenario
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, parameters, results } = body;

    // Validation
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 }
      );
    }

    if (name.length > 100) {
      return NextResponse.json(
        { error: "Scenario name must be 100 characters or less" },
        { status: 400 }
      );
    }

    if (!parameters || typeof parameters !== "object") {
      return NextResponse.json(
        { error: "Missing required field: parameters (must be an object)" },
        { status: 400 }
      );
    }

    if (!results || typeof results !== "object") {
      return NextResponse.json(
        { error: "Missing required field: results (must be an object)" },
        { status: 400 }
      );
    }

    const scenario = await prisma.pricingScenario.create({
      data: {
        name: name.trim(),
        parameters,
        results,
        createdBy: user.id,
      },
    });

    return NextResponse.json({ success: true, scenario });
  } catch (error) {
    console.error("Error creating scenario:", error);
    return NextResponse.json(
      { error: "Failed to create scenario" },
      { status: 500 }
    );
  }
}

// PUT to update an existing scenario
export async function PUT(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, name, parameters, results } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Missing required field: id" },
        { status: 400 }
      );
    }

    // Check if scenario exists and belongs to user
    const existing = await prisma.pricingScenario.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Scenario not found" },
        { status: 404 }
      );
    }

    if (existing.createdBy !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to update this scenario" },
        { status: 403 }
      );
    }

    // Validation
    if (name !== undefined && (typeof name !== "string" || name.trim().length === 0)) {
      return NextResponse.json(
        { error: "Name must be a non-empty string" },
        { status: 400 }
      );
    }

    if (name && name.length > 100) {
      return NextResponse.json(
        { error: "Scenario name must be 100 characters or less" },
        { status: 400 }
      );
    }

    const updated = await prisma.pricingScenario.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(parameters !== undefined && { parameters }),
        ...(results !== undefined && { results }),
      },
    });

    return NextResponse.json({ success: true, scenario: updated });
  } catch (error) {
    console.error("Error updating scenario:", error);
    return NextResponse.json(
      { error: "Failed to update scenario" },
      { status: 500 }
    );
  }
}

// DELETE a scenario
export async function DELETE(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing required parameter: id" },
        { status: 400 }
      );
    }

    // Check if scenario exists and belongs to user
    const existing = await prisma.pricingScenario.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Scenario not found" },
        { status: 404 }
      );
    }

    if (existing.createdBy !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized to delete this scenario" },
        { status: 403 }
      );
    }

    await prisma.pricingScenario.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting scenario:", error);
    return NextResponse.json(
      { error: "Failed to delete scenario" },
      { status: 500 }
    );
  }
}
