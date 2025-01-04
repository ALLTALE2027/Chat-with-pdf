import { loadGcpIntoPinecone } from "@/lib/pinecone";
import { NextResponse } from "next/server";

import { db } from '@/db';
import { chats } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { GetGcpUrl } from "@/lib/googleStorage";
export async function POST(req: Request, res: Response) {

    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    try {
        const body = await req.json();

        const { file_key, file_name } = body;
        await loadGcpIntoPinecone(file_key);
        let fileUrl: string = await GetGcpUrl(file_key)
        const chat_id = await db.insert(chats).values({
            fileKey: file_key,
            pdfName: file_name,
            pdfUrl: fileUrl,
            userId
        }).returning({
            insertedId: chats.id
        })

        return NextResponse.json({
            chat_id: chat_id[0].insertedId
        }, { status: 200 });
    } catch (error) {
        console.log("Error in create chat POST", error);
        return NextResponse.json({
            error: "Internal Server Error",
        }, {
            status: 500
        })
    }
}