import { create } from "zustand";

type TrackActionType = "new_connection" | "dtm";

interface TrackProfileResult {
  success: boolean;
  data:
    | {
        success: true;
        data: {
          fullName: string;
          profileLink: string;
        };
      }
    | {
        success: false;
        issues: {
          message: string;
        }[];
      };
}

interface ExtensionState {
  // Degree Highlighter State
  isHighlighting: boolean;
  highlightStatus: string;
  highlightError: Error | null;

  // Track Profile State
  trackStatus: string;
  trackError: Error | null;

  // Highlight Actions
  checkHighlightStatus: () => Promise<void>;
  toggleHighlighting: () => Promise<void>;

  // Track Profile Actions
  trackProfile: (actionType: TrackActionType) => Promise<void>;
}

export const useExtensionStore = create<ExtensionState>((set, get) => ({
  // Initial State - Highlighting
  isHighlighting: false,
  highlightStatus: "Ready",
  highlightError: null,

  // Initial State - Track Profile
  trackStatus: "Ready",
  trackError: null,

  // Check current status from content script
  checkHighlightStatus: async () => {
    try {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab?.id) return;

      const response = await browser.tabs.sendMessage(tab.id, {
        action: "status",
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
  toggleHighlighting: async () => {
    const { isHighlighting } = get();

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
      const action = isHighlighting ? "stop" : "start";
      const response = await browser.tabs.sendMessage(tab.id, { action });

      if (response?.success) {
        set({ isHighlighting: !isHighlighting });
        if (action === "start") {
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
      console.error("Error:", error);
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
        set({ trackStatus: "No active tab found" });
        return;
      }

      set({ trackError: null });
      const action = `track_profile_${actionType}`;
      const response = (await browser.tabs.sendMessage(tab.id, {
        action,
      })) as TrackProfileResult;

      if (response?.success) {
        if (response?.data?.success) {
          set({ trackStatus: `Profile tracked - ${actionType}` });
          const formAction =
            actionType === "new_connection" ? "Add%20connection" : "DTM";
          window.open(
            `https://app.youform.com/forms/u5msmgsv?fullname=${response.data.data.fullName}&profilelink=${response.data.data.profileLink}&action=${formAction}`,
            "_blank"
          );
        } else {
          set({ trackStatus: `Profile tracked - ${actionType}` });
        }
      } else {
        set({
          trackStatus: "Error communicating with page",
          trackError: new Error("Error communicating with page"),
        });
      }
    } catch (err) {
      const error = err as Error;
      console.error("Error:", error);
      set({
        trackStatus: "Error communicating with page",
        trackError: error,
      });
    }
  },
}));
