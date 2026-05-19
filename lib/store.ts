import { create } from "zustand";
import {
  linkedInDegreeHighlightingLogger,
  bookmarks2ActionLogger,
  linkedInLogger,
  appLogger,
} from "./logger";

export type TrackActionType =
  | "new_connection"
  | "dtm"
  | "birthday"
  | "work_anniversary"
  | "start_conversation";

type TrackResult<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      issues: {
        message: string;
      }[];
    };

type TrackProfileResult = TrackResult<{
  fullName: string;
  profileLink: string;
}>;
type TrackBookmarkResult = TrackResult<{
  url: string;
  caption: string;
}>;
type TrackBookmarkResultTwitter = TrackResult<{
  url: string;
  tweetsMap: Record<string, string[]>;
}>;

export const HIGHLIGHT_STATES = {
  IDLE: "IDLE",
  WAITING: "WAITING",
  ACTIVE: "ACTIVE",
} as const;

export type HighlightState = keyof typeof HIGHLIGHT_STATES;

interface ExtensionState {
  // Degree Highlighter State
  highlightState: HighlightState;
  highlightStatus: string;
  highlightError: Error | null;

  // Track Profile State
  trackProfileStatus: string;
  trackProfileError: Error | null;

  // Highlight Actions
  checkHighlightStatus: () => Promise<void>;
  toggleHighlightingV2: () => Promise<void>;

  // Track Profile Actions
  trackProfile: (actionType: TrackActionType) => Promise<void>;

  // Track Bookmark State
  trackBookmarkStatus: string;
  trackBookmarkError: Error | null;

  // Track Bookmark
  trackBookmark: () => Promise<void>;

  // WhatsApp
  whatsAppNumber: string | null;
  getWhatsAppNumber: () => Promise<void>;
  openWhatsApp: () => void;
}

function getFormAction(actionType: TrackActionType) {
  switch (actionType) {
    case "new_connection":
      return "Add%20Connection";
    case "dtm":
      return "DTM";
    case "birthday":
      return "Birthday";
    case "work_anniversary":
      return "Work%20Anniversary";
    case "start_conversation":
      return "Start%20Conversation";
  }
}

export const useExtensionStore = create<ExtensionState>((set, get) => ({
  // Initial State - Highlighting
  highlightState: HIGHLIGHT_STATES.IDLE,
  highlightStatus: "Ready",
  highlightError: null,

  // Initial State - Track Profile
  trackProfileStatus: "Ready",
  trackProfileError: null,

  // Initial State - Track Bookmark
  trackBookmarkStatus: "Ready",
  trackBookmarkError: null,

  // Initial State - WhatsApp
  whatsAppNumber: null,

  // Check current status from content script
  checkHighlightStatus: async () => {
    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) return;

      const response = await browser.tabs.sendMessage(tab.id, {
        action: "degree_highlight_status",
      });

      set({
        highlightState: response?.isActive
          ? HIGHLIGHT_STATES.ACTIVE
          : HIGHLIGHT_STATES.IDLE,
        highlightStatus: response?.isActive ? "Highlighting active" : "Ready",
      });
    } catch {
      set({ highlightStatus: "Ready" });
    }
  },

  // Toggle highlighting on/off
  toggleHighlightingV2: async () => {
    const { highlightState } = get();
    const isHighlighting = highlightState !== HIGHLIGHT_STATES.IDLE;

    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) {
        set({ highlightStatus: "No active tab found" });
        return;
      }

      set({ highlightError: null });
      const action = isHighlighting
        ? "degree_highlight_stop"
        : "degree_highlight_start";

      const response = await browser.tabs.sendMessage(tab.id, { action });

      if (response?.success) {
        if (action === "degree_highlight_stop") {
          set({
            highlightState: HIGHLIGHT_STATES.IDLE,
            highlightStatus: `Cleaned up ${response.cleaned ?? 0} highlights`,
          });
        } else {
          set({
            highlightState: response.found
              ? HIGHLIGHT_STATES.ACTIVE
              : HIGHLIGHT_STATES.WAITING,
            highlightStatus: response.found
              ? `Highlighted ${response.count} connections`
              : "Waiting for reactions modal...",
          });
        }
      } else {
        set({
          highlightStatus: "Error communicating with page",
          highlightError: new Error("Error communicating with page"),
        });
      }
    } catch (err) {
      const error = err as Error;
      set({
        highlightStatus: "Error communicating with page",
        highlightError: error,
      });
    }
  },

  // Track profile for new connections or DTM
  trackProfile: async (actionType: TrackActionType) => {
    linkedInLogger.debug("trackProfile", {
      actionType,
    });
    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) {
        set({ trackProfileStatus: "No active tab found" });
        linkedInLogger.debug("trackProfile", {
          actionType,
          tab,
        });
        return;
      }

      set({ trackProfileError: null });
      const action = `track_profile_${actionType}`;
      const response = (await browser.tabs.sendMessage(tab.id, {
        action,
      })) as TrackProfileResult;

      if (response?.success) {
        set({ trackProfileStatus: `Profile tracked - ${actionType}` });
        const formAction = getFormAction(actionType);
        window.open(
          `https://app.youform.com/forms/u5msmgsv?fullname=${response.data.fullName}&profilelink=${response.data.profileLink}&action=${formAction}`,
          "_blank",
        );
      } else {
        set({
          trackProfileStatus: "Error communicating with page",
          trackProfileError: new Error("Error communicating with page"),
        });
      }
    } catch (err) {
      const error = err as Error;
      linkedInLogger.error("trackProfile", {
        actionType,
        error,
      });
      set({
        trackProfileStatus: "Error communicating with page",
        trackProfileError: error,
      });
    }
  },

  getWhatsAppNumber: async () => {
    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      appLogger.debug("getWhatsAppNumber", {
        tab,
      });
      if (!tab?.id) return;
      const response = await browser.tabs.sendMessage(tab.id, {
        action: "get_whatsapp_number",
      });
      appLogger.debug("getWhatsAppNumber", {
        response,
      });
      if (response?.success) {
        set({ whatsAppNumber: response.phoneNumber ?? null });
      } else {
        set({ whatsAppNumber: null });
      }
    } catch (err) {
      const error = err as Error;
      appLogger.error("getWhatsAppNumber", {
        error,
      });
      set({ whatsAppNumber: null });
    }
  },

  openWhatsApp: () => {
    const { whatsAppNumber } = get();
    if (whatsAppNumber) {
      window.open(`https://wa.me/${whatsAppNumber}`, "_blank");
    }
  },

  // Track bookmark
  trackBookmark: async () => {
    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) {
        set({ trackBookmarkStatus: "No active tab found" });
        return;
      }

      set({ trackBookmarkError: null });
      const action = "track_bookmark";
      const response = (await browser.tabs.sendMessage(tab.id, {
        action,
      })) as TrackBookmarkResult | TrackBookmarkResultTwitter;
      bookmarks2ActionLogger.debug("trackBookmark", { response });

      if (response?.success) {
        if (response?.data) {
          set({ trackBookmarkStatus: `Bookmark tracked` });
          if (
            "tweetsMap" in response?.data &&
            Object.keys(response?.data?.tweetsMap).length > 0
          ) {
            if (
              confirm(
                `Do you want to track tweets from ${Object.keys(response?.data?.tweetsMap).join(" & ")} accounts?`,
              )
            ) {
              window.open(
                `https://app.youform.com/forms/f6gffax5?url=${response.data.url}&caption=${response.data.caption}`,
                "_blank",
              );
            }
            return;
          }
          window.open(
            `https://app.youform.com/forms/f6gffax5?url=${response.data.url}&caption=${response.data.caption}`,
            "_blank",
          );
        } else {
          set({ trackBookmarkStatus: `Bookmark tracked` });
        }
      } else {
        const errorMessage = `Error communicating with page: ${response.issues.map((issue) => issue.message).join(", ")}`;
        alert(errorMessage);
        set({
          trackBookmarkStatus: errorMessage,
          trackBookmarkError: new Error(errorMessage),
        });
      }
    } catch (err) {
      const error = err as Error;
      bookmarks2ActionLogger.error("trackBookmark", error);
      set({
        trackBookmarkStatus: `Error communicating with page: ${error.message}`,
        trackBookmarkError: error,
      });
    }
  },
}));
