"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import useSupportChat from "@/hooks/useSupportChat";
import { useSettings } from "@/context/SettingsContext";
import { ChevronLeftIcon, HeadsetIcon, XIcon } from "@/components/icons";

const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const MAX_MB = 10;

function PaperclipIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 2 11 13" />
      <path d="M22 2 15 22l-4-9-9-4z" />
    </svg>
  );
}

export default function LiveChatPage() {
  const router = useRouter();
  const { t } = useSettings();
  const { messages, ready, error, sendText, sendImage, retry, endChat, uid } = useSupportChat();

  const [input, setInput] = useState("");
  const [fileError, setFileError] = useState("");
  const fileRef = useRef(null);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  const submit = (e) => {
    e?.preventDefault();
    if (!input.trim()) return;
    sendText(input);
    setInput("");
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) submit(e);
  };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileError("");
    if (!ALLOWED.includes(file.type)) return setFileError("Please choose a JPG, PNG or WebP image.");
    if (file.size > MAX_MB * 1024 * 1024) return setFileError(`Images must be under ${MAX_MB} MB.`);
    sendImage(file);
  };

  const handleEnd = async () => {
    if (!confirm("End this chat? A new chat will start next time you open Live Chat.")) return;
    try {
      await endChat();
      router.push("/customer-service");
    } catch (err) {
      console.error("Closing chat failed:", err);
      alert("Could not end the chat. Please try again.");
    }
  };

  return (
    <div className="container-page flex h-[calc(100dvh-8rem)] max-w-2xl flex-col py-4 md:h-[calc(100dvh-6rem)]">
      {/* Header */}
      <div className="mb-3 flex items-center gap-3">
        <button
          onClick={() => router.push("/customer-service")}
          className="grid h-9 w-9 place-items-center rounded-xl hover:bg-ink-100"
          aria-label="Back"
        >
          <ChevronLeftIcon size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-base font-extrabold text-ink-900">{t.supportTeam}</h1>
          <p className="text-xs text-ink-500">{t.responseTime}</p>
        </div>
        <button
          onClick={handleEnd}
          className="rounded-xl border border-ink-200 px-3 py-1.5 text-xs font-bold text-ink-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600"
        >
          End chat
        </button>
      </div>

      {/* Messages */}
      <div className="card flex-1 overflow-y-auto p-4">
        {!ready ? (
          <p className="py-10 text-center text-sm text-ink-400">Loading...</p>
        ) : error ? (
          <p className="py-10 text-center text-sm text-rose-500">
            Could not load the chat. Please try again in a moment.
          </p>
        ) : messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <span className="mb-3 grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-brand-600">
              <HeadsetIcon size={28} />
            </span>
            <h2 className="text-lg font-extrabold text-ink-900">{t.liveChat}</h2>
            <p className="mt-1 max-w-xs text-sm text-ink-500">{t.chatGreeting}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((m) => {
              const mine = m.senderId === uid;
              return (
                <div key={m.id || m.clientId} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  {!mine && (
                    <span className="mr-2 mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                      <HeadsetIcon size={14} />
                    </span>
                  )}
                  <div
                    className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${
                      mine
                        ? "rounded-br-md bg-brand-600 text-white"
                        : "rounded-bl-md bg-ink-100 text-ink-900"
                    }`}
                  >
                    {m.text && <p className="whitespace-pre-wrap break-words">{m.text}</p>}
                    {m.imageUrl && (
                      <a href={m.imageUrl} target="_blank" rel="noreferrer">
                        <img
                          src={m.imageUrl}
                          alt="Attachment"
                          className="mt-1 max-h-60 rounded-xl object-cover"
                        />
                      </a>
                    )}
                    <div
                      className={`mt-1 flex items-center justify-end gap-2 text-[10px] ${
                        mine ? "text-white/70" : "text-ink-400"
                      }`}
                    >
                      {m.time && (
                        <span>{m.time.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      )}
                      {mine && m.status === "pending" && <span>Sending...</span>}
                      {mine && m.status === "failed" && (
                        <button
                          onClick={() => retry(m.clientId)}
                          className="font-bold text-rose-200 underline"
                        >
                          Failed. Retry
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={endRef} />
          </div>
        )}
      </div>

      {fileError && (
        <p role="alert" className="mt-2 flex items-center justify-between rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
          {fileError}
          <button onClick={() => setFileError("")} aria-label="Dismiss">
            <XIcon size={14} />
          </button>
        </p>
      )}

      {/* Input */}
      <form onSubmit={submit} className="mt-3 flex items-end gap-2">
        <input ref={fileRef} type="file" accept={ALLOWED.join(",")} className="hidden" onChange={handleFile} />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={!ready || !!error}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-ink-100 text-brand-600 transition hover:bg-ink-200 disabled:opacity-50"
          aria-label="Attach an image"
        >
          <PaperclipIcon />
        </button>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          rows={1}
          maxLength={500}
          placeholder={t.chatPlaceholder}
          className="input max-h-32 min-h-[44px] flex-1 resize-none"
          disabled={!ready || !!error}
        />
        <button
          type="submit"
          disabled={!input.trim() || !ready || !!error}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700 disabled:opacity-50"
          aria-label="Send"
        >
          <SendIcon />
        </button>
      </form>
    </div>
  );
}