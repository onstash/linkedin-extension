import {
  contentScriptLogger,
  linkedInDegreeHighlightingLogger,
} from "@/lib/logger";
import { highlight1stAnd2ndDegreeConnections } from "./popup/linkedin-content";

// Configuration constants
const classNameToQuerySelector = (val: string) =>
  `.${val.split(" ").join(".")}`;

const CONFIG = {
  SELECTORS: {
    DEGREE_BADGE: classNameToQuerySelector(
      "_8fc3671d dcfb0537 a48f26ff _4560f919 _672e5870",
    ),
    CONTAINER: classNameToQuerySelector(
      "e0744685 cba660dd bbfbb7c5 f0150480 c11ce368 b9adc9a2 _6a90e9a7 _13057166 _9b4be851 d6ae496c",
    ),
  },
  DEGREE: {
    "1st": {
      DEGREE_TEXT: "1st",
      PARENT_LEVELS: 4,
      HIGHLIGHT_STYLE: {
        border: "2px solid green",
        backgroundColor: "rgba(0, 255, 0, 0.1)",
      },
    },
    "2nd": {
      DEGREE_TEXT: "2nd",
      PARENT_LEVELS: 4,
      HIGHLIGHT_STYLE: {
        border: "2px solid yellow",
        backgroundColor: "rgba(255, 255, 0, 0.1)",
      },
    },
  },
  DEBUG: true,
};

const CONFIG2 = {
  SELECTORS: {
    CONTAINER: "[data-view-name='view-likers']",
  },
};

function trackProfile() {
  const fullName = document.querySelector<HTMLElement>("a > h1");
  if (!fullName) {
    return { success: false, issues: [{ message: "Full name not found" }] };
  }
  const profileLink = window.location.href;
  return {
    success: true,
    data: {
      fullName: fullName.innerText,
      profileLink,
    },
  };
}

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

type TrackBookmarkResult = TrackResult<{
  url: string;
  caption: string;
}>;

function trackBookmarkInstagram(): TrackBookmarkResult {
  const url = window.location.href;
  try {
    const h1Tags = Array.from(document.querySelectorAll("h1"));
    console.log("trackBookmarkInstagram", { h1Tags });

    if (!h1Tags.length) {
      const span = document.querySelector(
        "span." +
          "x193iq5w xeuugli x13faqbe x1vvkbs xt0psk2 x1i0vuye xvs91rp xo1l8bm x5n08af x10wh9bi xpm28yp x8viiok x1o7cslx x126k92a"
            .split(" ")
            .join("."),
      );
      console.log("trackBookmarkInstagram", { span });
      if (!span) {
        //
        return {
          success: true,
          data: {
            url,
            caption: "",
          },
        };
      }
      return {
        success: true,
        data: {
          url,
          caption:
            "innerText" in span ? ((span.innerText as string) ?? "") : "",
        },
      };
    }
    const caption =
      h1Tags.length > 1 ? h1Tags[1].innerText : h1Tags[0].innerText;
    return {
      success: true,
      data: {
        url,
        caption,
      },
    };
  } catch (err: unknown) {
    console.error("trackBookmarkInstagram", err);
    //
    return {
      success: true,
      data: {
        url,
        caption: "",
      },
    };
  }
}

function trackBookmarkTwitter() {
  try {
    const url = window.location.href;
    const tweets = Array.from(
      document.querySelectorAll("[data-testid='tweetText']"),
    );
    const tweetsCount = tweets.length;
    if (!tweetsCount) {
      return {
        success: false,
        issues: [{ message: "Content not found" }],
      };
    }
    if (tweetsCount > 1) {
      // return {
      //   success: false,
      //   issues: [{ message: "Multiple tweets found" }],
      // };
      return {
        success: true,
        data: {
          url,
          caption: "",
        },
      };
    }

    console.log("trackBookmarkTwitter", { tweets });
    // @ts-ignore
    const caption = tweets[0].innerText;
    if (!caption) {
      return {
        success: false,
        issues: [{ message: "Content not found" }],
      };
    }
    return {
      success: true,
      data: {
        url,
        caption,
      },
    };
  } catch (err: unknown) {
    return {
      success: false,
      issues: [{ message: (err as Error).message }],
    };
  }
}

export default defineContentScript({
  matches: [
    "*://*.linkedin.com/feed/*",
    "*://*.linkedin.com/in/*",
    "*://*.instagram.com/*",
    "*://*.x.com/*",
  ],
  main() {
    contentScriptLogger.info(
      "Content script loaded, waiting for activation...",
    );

    // Listen for messages from popup
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      contentScriptLogger.debug("Received message:", message);

      switch (message.action) {
        case "degree_highlight_start":
          linkedInDegreeHighlightingLogger.debug(
            "[contentScript] toggleHighlighting",
            {
              action: "degree_highlight_start",
            },
          );
          highlight1stAnd2ndDegreeConnections("start");
          sendResponse({
            success: true,
            data: {
              action: "degree_highlight_start",
            },
          });
          break;
        case "degree_highlight_stop":
          linkedInDegreeHighlightingLogger.debug(
            "[contentScript] toggleHighlighting",
            {
              action: "degree_highlight_stop",
            },
          );
          highlight1stAnd2ndDegreeConnections("stop");
          sendResponse({
            success: true,
            data: {
              action: "degree_highlight_stop",
            },
          });
          break;
        case "degree_highlight_status":
          sendResponse({ isActive: false });
          break;
        case "track_profile_add_connection":
        case "track_profile_dtm":
        case "track_profile_birthday":
        case "track_profile_work_anniversary":
        case "track_profile_start_conversation":
          const trackProfileResult = trackProfile();
          contentScriptLogger.info("Track profile result:", trackProfileResult);
          sendResponse(trackProfileResult);
          break;
        case "track_bookmark":
          const url = window.location.href;
          const isInstagram = url.includes("instagram.com");
          const isTwitter = url.includes("x.com");
          if (isInstagram) {
            const trackBookmarkInstagramResult = trackBookmarkInstagram();
            sendResponse(trackBookmarkInstagramResult);
          } else if (isTwitter) {
            const trackBookmarkTwitterResult = trackBookmarkTwitter();
            sendResponse(trackBookmarkTwitterResult);
          } else {
            sendResponse({
              success: false,
              issues: [
                {
                  message: "Invalid action - track_bookmark [1]",
                },
                {
                  message: url,
                },
                {
                  message: `isInstagram=${isInstagram}`,
                },
                {
                  message: `isTwitter=${isTwitter}`,
                },
              ],
            });
          }
          break;
        default:
          contentScriptLogger.info("Invalid action - default", message);
          sendResponse({
            success: false,
            issues: [
              {
                message: "Invalid action - default",
              },
            ],
          });
          break;
      }
      return true; // Keep message channel open for async response
    });
  },
});
