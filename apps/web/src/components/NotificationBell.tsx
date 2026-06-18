"use client";

import { useState } from "react";
import { useNotifications } from "@/hooks/useNotifications";

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useNotifications();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl p-2 hover:bg-white/5 transition-colors"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-80 rounded-xl border border-white/10 bg-zinc-900 shadow-2xl">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
            <span className="text-sm font-medium">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs text-zinc-500 hover:text-white transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <ul className="max-h-72 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-zinc-500">
                No notifications
              </li>
            )}
            {notifications.map((n) => (
              <li key={n.id}>
              <button
                type="button"
                className={`flex w-full items-start gap-3 px-4 py-3 text-left cursor-pointer transition-colors ${
                  !n.read ? "bg-white/5" : "hover:bg-white/5"
                }`}
                onClick={() => markRead(n.id)}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{n.title}</p>
                  <p className="text-xs text-zinc-500 truncate">{n.body}</p>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                  className="shrink-0 text-zinc-600 hover:text-zinc-400 transition-colors"
                  aria-label={`Dismiss notification: ${n.title}`}
                >
                  ✕
                </button>
              </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
