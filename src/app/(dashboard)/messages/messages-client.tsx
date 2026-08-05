"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Send } from "lucide-react";
import { sendMessage } from "./actions";

type Message = {
  id: string;
  content: string;
  createdAt: Date;
  senderId: string;
  sender: { id: string; name: string; role: string };
  receiverId: string;
  receiver: { id: string; name: string; role: string };
};

export function MessagesClient({ 
  viewerId, 
  messages, 
  contacts 
}: { 
  viewerId: string; 
  messages: Message[]; 
  contacts: any[] 
}) {
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const conversationMessages = messages.filter(
    m => (m.senderId === viewerId && m.receiverId === selectedContact) ||
         (m.receiverId === viewerId && m.senderId === selectedContact)
  ).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  function handleSend(formData: FormData) {
    if (!selectedContact) return;
    
    startTransition(async () => {
      try {
        await sendMessage(formData);
        const form = document.getElementById("message-form") as HTMLFormElement;
        form?.reset();
      } catch (err: any) {
        alert(err.message || "Failed to send message");
      }
    });
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8">
      <header className="mb-8">
        <p className="text-sm font-semibold tracking-wide text-blue-700 dark:text-blue-500">COMMUNICATION</p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950 dark:text-slate-100">Messages</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Communicate directly with parents and teachers.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden min-h-[600px] shadow-sm">
        
        {/* Contacts Sidebar */}
        <aside className="border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex flex-col">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="font-bold text-slate-900 dark:text-slate-100">Contacts</h2>
          </div>
          <div className="overflow-y-auto flex-1">
            {contacts.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">No contacts available.</p>
            ) : (
              contacts.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedContact(c.id)}
                  className={`w-full text-left p-4 border-b border-slate-100 dark:border-slate-800 transition-colors ${selectedContact === c.id ? "bg-blue-50 dark:bg-slate-800" : "hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                >
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{c.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{c.role}</p>
                </button>
              ))
            )}
          </div>
        </aside>

        {/* Chat Area */}
        <section className="flex flex-col bg-white dark:bg-slate-950 relative h-[600px] lg:h-auto">
          {selectedContact ? (
            <>
              <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  {contacts.find(c => c.id === selectedContact)?.name}
                </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {conversationMessages.length === 0 ? (
                  <p className="text-center text-sm text-slate-500 mt-10">No messages yet. Start the conversation!</p>
                ) : (
                  conversationMessages.map(msg => {
                    const isMe = msg.senderId === viewerId;
                    return (
                      <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${isMe ? "bg-blue-600 text-white rounded-br-none" : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-none"}`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1">
                          {format(new Date(msg.createdAt), "MMM d, h:mm a")}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <form id="message-form" action={handleSend} className="flex gap-2">
                  <input type="hidden" name="receiverId" value={selectedContact} />
                  <input 
                    name="content"
                    required
                    placeholder="Type a message..."
                    className="flex-1 rounded-full border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button 
                    type="submit"
                    disabled={isPending}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-slate-500 flex-col gap-2">
              <p>Select a contact to start messaging</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
