import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AdminAuthError } from "@/app/api/admin/_utils/require-admin";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string; mediaId: string }> }
) {
  try {
    const { supabase } = await requireAdmin();
    const { id: gemstoneId, mediaId } = await context.params;
    const body = await request.json();

    // Update the gemstone_images table
    const { error } = await supabase
      .from("gemstone_images")
      .update({
        alt_text: body.alt_text,
        has_watermark: body.has_watermark,
      })
      .eq("id", mediaId)
      .eq("gemstone_id", gemstoneId);

    if (error) {
      console.error("Error updating media metadata:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Unexpected error updating media metadata:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

