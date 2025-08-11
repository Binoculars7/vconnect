"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send } from "lucide-react";

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  isTyping?: boolean;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [hasGreeted, setHasGreeted] = useState(false);

  // Ref for auto-scrolling
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Initial greeting when chat opens
  useEffect(() => {
    if (isOpen && !hasGreeted) {
      const greetingMessage = `Hi there, I'm Vconnect 👋 Welcome to VConnect!

Please select from the following options (1-12):

1 – How to login
2 – How to signup  
3 – About Vconnect
4 – How to create events (event owners)
5 – How to apply as a volunteer (volunteers)
6 – How to approve/decline Volunteers (event owners)
7 – How to check application status (volunteers)
8 – How to logout
9 – How to go back to home
10 – How to go to dashboard
11 – Event Owner Tips
12 – Volunteer Tips

Just type the number (1-12) to get your answer!`;

      addTypingMessage(greetingMessage, true);
      setHasGreeted(true);
    }
  }, [isOpen, hasGreeted]);

  const responses = {
    "1": "How to login:\nGo to login, enter username/email & password, click Sign In.",
    "2": "How to signup:\nSelect role (Volunteer/Event Owner), fill form, click Create Account.",
    "3": "About Vconnect:\nVconnect is connecting volunteers to events that matter.",
    "4": "How to create events (event owners):\nClick Create Event, fill details, submit.",
    "5": "How to apply as a volunteer (volunteers):\nBrowse events, read details, click Apply Now. Track status in dashboard.",
    "6": "How to approve/decline Volunteers (event owners):\nReview apps in dashboard, approve ✅ or decline ❌.",
    "7": "How to check application status (volunteers):\nCheck status (pending/approved/declined) in dashboard.",
    "8": "How to logout:\nFrom profile menu, click Logout.",
    "9": "How to go back to home:\nClick Vconnect logo, menu Home, browser back, or type URL.",
    "10": "How to go to dashboard:\nFrom menu bar or profile menu, click dashbard.",
    "11": "Event Owner Tips:\nWrite clear event info, reply status, proceed with event, thank volunteers.",
    "12": "Volunteer Tips:\nComplete profile, volunteer, go for the event, give feedback.",
  };

  const addTypingMessage = (text: string, isBot: boolean) => {
    const messageId = Date.now().toString();

    // Add typing indicator first
    if (isBot) {
      const typingMessage: Message = {
        id: messageId + "_typing",
        text: "",
        isBot: true,
        timestamp: new Date(),
        isTyping: true,
      };
      setMessages((prev) => [...prev, typingMessage]);

      // Simulate typing delay
      setTimeout(() => {
        // Remove typing indicator and add actual message
        setMessages((prev) => {
          const filtered = prev.filter(
            (msg) => msg.id !== messageId + "_typing"
          );
          return [
            ...filtered,
            {
              id: messageId,
              text: text,
              isBot: true,
              timestamp: new Date(),
            },
          ];
        });
      }, 1500);
    } else {
      const userMessage: Message = {
        id: messageId,
        text: text,
        isBot: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    addTypingMessage(inputValue, false);

    const userInput = inputValue.trim();

    // Check if input is a valid option (1-12)
    if (responses[userInput as keyof typeof responses]) {
      setTimeout(() => {
        addTypingMessage(responses[userInput as keyof typeof responses], true);
      }, 500);
    } else {
      // Invalid option
      setTimeout(() => {
        const errorMessage = `Option not found! For more answers, please contact: support@vconnect.com

Please select from options 1-12:

1 – How to login
2 – How to signup  
3 – About Vconnect
4 – How to create events
5 – How to apply as volunteer
6 – How to approve/decline volunteers
7 – How to check application status
8 – How to logout
9 – How to go back to home
10 – How to go to dashboard
11 – Event Owner Tips
12 – Volunteer Tips`;

        addTypingMessage(errorMessage, true);
      }, 500);
    }

    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const TypingIndicator = () => (
    <div className="flex space-x-1">
      <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
      <div
        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
        style={{ animationDelay: "0.1s" }}
      ></div>
      <div
        className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
        style={{ animationDelay: "0.2s" }}
      ></div>
    </div>
  );

  return (
    <>
      {/* Chat Button */}
      <Button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 shadow-lg z-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-24 right-6 w-80 h-96 shadow-xl z-50 flex flex-col overflow-hidden">
          <CardHeader className="bg-orange-500 text-white rounded-t-lg py-3 flex-shrink-0 mt-[-25px]">
            <CardTitle className="text-lg flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Chat with Vconnect
            </CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 min-h-0">
            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.isBot ? "justify-start" : "justify-end"
                  }`}
                >
                  <div
                    className={`max-w-[85%] p-3 rounded-lg text-sm break-words hyphens-auto overflow-wrap-anywhere ${
                      message.isBot
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        : "bg-orange-500 text-white"
                    }`}
                    style={{
                      wordBreak: "break-word",
                      overflowWrap: "anywhere",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {message.isTyping ? <TypingIndicator /> : message.text}
                  </div>
                </div>
              ))}
              {/* Invisible element for scrolling */}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Container */}
            <div className="p-4 border-t flex gap-2 flex-shrink-0">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type option number (1-12)..."
                className="flex-1"
              />
              <Button
                size="sm"
                onClick={handleSendMessage}
                className="bg-orange-500 hover:bg-orange-600 flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
