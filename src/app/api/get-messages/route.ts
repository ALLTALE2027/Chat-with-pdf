import { db } from "@/db";
import { messages } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const POST = async (req: Request) => {

    const { chatId } = await req.json();
    // const _messages = db.select().from(messages).where(eq(messages.chatId, chatId));
    const _messages = await db
        .select({
            id: messages.id,
            content: messages.content,
            createdOn: messages.createdOn,
            role: messages.role,
        })
        .from(messages)
        .where(eq(messages.chatId, chatId));

    console.log("messages", _messages);

    return NextResponse.json(_messages);
}