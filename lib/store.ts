import { create } from "zustand";
import {
  linkedInDegreeHighlightingLogger,
  bookmarks2ActionLogger,
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

interface ExtensionState {
  // Degree Highlighter State
  isHighlighting: boolean;
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
}

function getFormAction(actionType: TrackActionType) {
  switch (actionType) {
    case "new_connection":
      return "New%20Connection";
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
  isHighlighting: false,
  highlightStatus: "Ready",
  highlightError: null,

  // Initial State - Track Profile
  trackProfileStatus: "Ready",
  trackProfileError: null,

  // Initial State - Track Bookmark
  trackBookmarkStatus: "Ready",
  trackBookmarkError: null,

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
        isHighlighting: response?.isActive ?? false,
        highlightStatus: response?.isActive ? "Highlighting active" : "Ready",
      });
    } catch {
      set({ highlightStatus: "Ready" });
    }
  },

  // Toggle highlighting on/off
  toggleHighlightingV2: async () => {
    const { isHighlighting } = get();
    linkedInDegreeHighlightingLogger.debug("toggleHighlighting", {
      isHighlighting,
    });

    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      linkedInDegreeHighlightingLogger.debug("toggleHighlighting", {
        isHighlighting,
        tab,
      });

      if (!tab?.id) {
        linkedInDegreeHighlightingLogger.debug("toggleHighlighting", {
          isHighlighting,
          tab,
        });
        set({ highlightStatus: "No active tab found" });
        return;
      }

      set({ highlightError: null });
      const action = isHighlighting
        ? "degree_highlight_stop"
        : "degree_highlight_start";
      linkedInDegreeHighlightingLogger.debug("toggleHighlighting", {
        isHighlighting,
        action,
      });
      const response = await browser.tabs.sendMessage(tab.id, { action });
      linkedInDegreeHighlightingLogger.debug("toggleHighlighting", {
        isHighlighting,
        action,
        response,
      });

      if (response?.success) {
        set({ isHighlighting: !isHighlighting });
        if (action === "degree_highlight_start") {
          set({ highlightStatus: `Highlighted ${response.count} connections` });
        } else {
          set({ highlightStatus: `Cleaned up ${response.cleaned} highlights` });
        }
      } else {
        set({
          highlightStatus: "Error communicating with page",
          highlightError: new Error("Error communicating with page"),
        });
      }
    } catch (err) {
      const error = err as Error;
      linkedInDegreeHighlightingLogger.error("toggleHighlighting", {
        isHighlighting,
        error,
      });
      set({
        highlightStatus: "Error communicating with page",
        highlightError: error,
      });
    }
  },

  // Track profile for new connections or DTM
  trackProfile: async (actionType: TrackActionType) => {
    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) {
        set({ trackProfileStatus: "No active tab found" });
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
      console.error("Error:", error);
      set({
        trackProfileStatus: "Error communicating with page",
        trackProfileError: error,
      });
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
              // https://app.youform.com/forms/f6gffax5
              window.open(
                `https://app.youform.com/forms/f6gffax5?url=${response.data.url}&caption=${response.data.caption}`,
                "_blank",
              );
            }
            return;
          }
          bookmarks2ActionLogger.debug("trackBookmark", {
            youFormUrl: `https://app.youform.com/forms/f6gffax5?url=${response.data.url}&caption=${response.data.caption}`,
          });
          // https://app.youform.com/forms/f6gffax5
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
