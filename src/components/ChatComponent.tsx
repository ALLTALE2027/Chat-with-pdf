"use client";
import { Send } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useChat } from "ai/react";
import MessageList from "./MessageList";
import { Message } from "ai";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
type Props = {
  chatId: number;
};

const ChatComponent = ({ chatId }: Props) => {
  const { data, isLoading } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: async () => {
      const response = await axios.post<Message[]>("/api/get-messages", {
        chatId,
      });
      return response.data;
    },
  });

  const { input, handleInputChange, handleSubmit, messages } = useChat({
    api: "/api/chat",
    body: { chatId },
    experimental_throttle: 30,
    initialMessages: data || [],
    onFinish: (result) => {
      console.log("Result fom usechat", result);
    },

    onError: (error) => {
      console.log("Error in chat component", error);
    },
  });

  React.useEffect(() => {
    const messageContainer = document.getElementById("message-container");
    if (messageContainer) {
      messageContainer.scrollTo({
        top: messageContainer.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // "/api/chat" message submit our message will be send to chat gpt to process
  return (
    <div className="relative max-h-screen " id="message-container">
      {/* header */}

      <div className="sticky top-0 inset-x-0 p-2 bg-white h-fit">
        <h3 className="text-xl font-bold">Chat</h3>
      </div>

      {/* message */}

      <MessageList messages={messages} isLoading={isLoading} />
      <form
        onSubmit={handleSubmit}
        className="sticky bottom-0 inset-x-0 px-2 py-4 bg-white"
      >
        <div className="flex">
          <Input
            name="prompt"
            value={input}
            onChange={handleInputChange}
            placeholder="Ask any question..."
            className="w-full"
          />
          <Button className="bg-blue-600 ml-2">
            <Send className="h-4 w-4 " />
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ChatComponent;
