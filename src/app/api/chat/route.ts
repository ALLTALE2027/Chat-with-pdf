import { streamText } from 'ai'
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { db } from '@/db';
import { chats, messages as _messages } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { getContext } from '@/lib/context';

const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: Request) {
    try {
        const { messages, chatId } = await req.json();
        console.log("messages", messages);;

        const _chats = await db.select().from(chats).where(eq(chats.id, chatId));

        if (_chats.length != 1) {
            return NextResponse.json({ error: "Chat not found" }, { status: 404 });
        }

        const fileKey = _chats[0].fileKey;
        const lastMessage = messages[messages.length - 1];
        const context = await getContext(lastMessage.content, fileKey);

        const prompt = {
            role: 'system',
            content: `AI assistant is a brand new, powerful, human-like artificial intelligence.
      The traits of AI include expert knowledge, helpfulness, cleverness, and articulateness.
      AI is a well-behaved and well-mannered individual.
      AI is always friendly, kind, and inspiring, and he is eager to provide vivid and thoughtful responses to the user.
      AI has the sum of all knowledge in their brain, and is able to accurately answer nearly any question about any topic in conversation.
      AI assistant is a big fan of Pinecone and Vercel.
      START CONTEXT BLOCK
      ${context}
      END OF CONTEXT BLOCK
      AI assistant will take into account any CONTEXT BLOCK that is provided in a conversation.
      If the context does not provide the answer to question, the AI assistant will say, "I'm sorry, but I don't know the answer to that question".
      AI assistant will not apologize for previous responses, but instead will indicated new information was gained.
      AI assistant will not invent anything that is not drawn directly from the context.
      `
        }

        await db.insert(_messages).values({
            chatId,
            content: lastMessage.content,
            role: "user"
        })
        const result = streamText({
            model: google("gemini-1.5-flash"),
            system: prompt.content,
            messages,
            onFinish: async (result) => {
                console.log("onFinish", result.response.messages);
                console.log("onFinish", JSON.stringify(result.response.messages));
                await db.insert(_messages).values({
                    chatId,
                    content: result.response.messages[0].content[0]["text"],  // it is throwing error but it works
                    role: "system",
                });
            }
        })

        // console.log("result", result);

        return result.toDataStreamResponse({
            headers: {
                'Content-Type': 'text/event-stream',
            },
        });

    } catch (error) {
        console.log("Error in POST streamText", error);
    }
}