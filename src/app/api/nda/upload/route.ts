import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * POST /api/nda/upload
 * Accepts a FormData body with:
 *   - file: the signed NDA file
 *   - requestId: the NDA request ID (from the URL /nda/[id])
 *
 * Assumptions (adjust to your project):
 *  - There is a Supabase Storage bucket named "ndas"
 *  - (Optional) There is a table "nda_requests" with column "signed_nda_url"
 *    and primary key "id" = requestId
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const requestId = formData.get("requestId") as string | null;

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "No file uploaded." },
        { status: 400 }
      );
    }

    if (!requestId) {
      return NextResponse.json(
        { error: "Missing requestId." },
        { status: 400 }
      );
    }

    // Create a unique path for this file
    const safeName = file.name.replace(/\s+/g, "-");
    const path = `${requestId}/${Date.now()}-${safeName}`;

    // 1) Upload to Supabase Storage bucket "ndas"
    const { error: uploadError } = await supabase.storage
      .from("ndas")        // 👈 change bucket name if yours is different
      .upload(path, file, {
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload NDA file." },
        { status: 500 }
      );
    }

    // 2) Get a public URL for the uploaded file
    const { data: publicData } = supabase.storage
      .from("ndas")
      .getPublicUrl(path);

    const publicUrl = publicData.publicUrl;

    // 3) (Optional) Save URL to NDA request row
    //    Adjust table name / column names to match your schema.
    const { error: dbError } = await supabase
      .from("nda_requests")            // 👈 change if your table name differs
      .update({ signed_nda_url: publicUrl })
      .eq("id", requestId);

    if (dbError) {
      console.warn("Could not update nda_requests row:", dbError);
      // Not fatal for the upload itself – still return success for now
    }

    return NextResponse.json(
      {
        success: true,
        url: publicUrl,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("Unexpected error in /api/nda/upload:", err);
    return NextResponse.json(
      { error: "Unexpected error processing NDA upload." },
      { status: 500 }
    );
  }
}