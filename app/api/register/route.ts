import { NextResponse } from "next/server";
import { inngest } from "@/inngest/client";

export async function POST(req: Request) {
  const { email, name } = await req.json();
  const user = { id: "user-123", email, name };

  await inngest.send({
    name: "user/registered",
    data: { userId: user.id, email: user.email, name: user.name },
  });

  return NextResponse.json({ success: true, user });
}
