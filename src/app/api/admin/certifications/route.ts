import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AdminAuthError } from "@/app/api/admin/_utils/require-admin";
import type { TablesInsert } from "@/shared/types/database";

export async function GET(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin();
    const { searchParams } = new URL(request.url);
    const gemstoneId = searchParams.get("gemstone_id");

    let query = supabase
      .from("certifications")
      .select("*")
      .order("created_at", { ascending: false });

    if (gemstoneId) {
      query = query.eq("gemstone_id", gemstoneId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching certifications:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Unexpected error fetching certifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase } = await requireAdmin();
    const body = await request.json();

    const payload: TablesInsert<"certifications"> = {
      gemstone_id: body.gemstone_id,
      certificate_type: body.certificate_type,
      certificate_number: body.certificate_number || null,
      certificate_url: body.certificate_url || null,
      issued_date: body.issued_date || null,
    };

    const { data, error } = await supabase
      .from("certifications")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Error creating certification:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Unexpected error creating certification:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

