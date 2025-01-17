import ChatComponent from "@/components/ChatComponent";
import ChatSideBar from "@/components/ChatSideBar";
import PDFViewer from "@/components/ViewerPDF";
import { db } from "@/db";
import { chats } from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import React from "react";

type Props = {
  params: {
    chatId: string;
  };
};

const ChatPage = async ({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) => {
  const { chatId } = await params;
  const { userId } = await auth();

  if (!userId) {
    return redirect("/sign-in");
  }
  const _chats = await db.select().from(chats).where(eq(chats.userId, userId));

  if (!_chats || _chats.length === 0) {
    return redirect("/");
  }

  if (!_chats.find((chat) => chat.id == parseInt(chatId))) {
    return redirect("/");
  }

  const currentChat = _chats.find((chat) => chat.id == parseInt(chatId));

  return (
    <div className="flex max-h-screen">
      <div className="flex w-full max-h-screen">
        {/* chat sidebar */}
        <div className="flex-[1] max-w-xs">
          <ChatSideBar chats={_chats} chatId={parseInt(chatId)} />
        </div>
        {/* pdf viewer */}
        <div className="max-h-screen p-4 flex-[5]">
          <PDFViewer pdf_url={currentChat?.pdfUrl || ""} />
        </div>

        {/* chat section */}
        <div className="flex-[3] border-l-4 border-l-slate-400">
          <ChatComponent chatId={parseInt(chatId)} />
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
