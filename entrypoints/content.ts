import {
  contentScriptLogger,
  linkedInDegreeHighlightingLogger,
  bookmarks2ActionLogger,
} from "@/lib/logger";
import { highlight1stAnd2ndDegreeConnections } from "./popup/linkedin-content";

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

type TrackBookmarkResultTwitter = TrackResult<{
  url: string;
  tweetsMap: Record<string, string[]>;
}>;

function trackBookmarkInstagram(): TrackBookmarkResult {
  const url = window.location.href;
  try {
    const h1Tags = Array.from(document.querySelectorAll("h1"));
    bookmarks2ActionLogger.debug("trackBookmarkInstagram", { h1Tags });

    if (!h1Tags.length) {
      const span = document.querySelector(
        "span." +
          "x193iq5w xeuugli x13faqbe x1vvkbs xt0psk2 x1i0vuye xvs91rp xo1l8bm x5n08af x10wh9bi xpm28yp x8viiok x1o7cslx x126k92a"
            .split(" ")
            .join("."),
      );
      bookmarks2ActionLogger.debug("trackBookmarkInstagram", { span });
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
      const captionFromSpan =
        "innerText" in span ? ((span.innerText as string) ?? "") : "";
      bookmarks2ActionLogger.debug("trackBookmarkInstagram", {
        url,
        captionFromSpan,
      });
      return {
        success: true,
        data: {
          url,
          caption: captionFromSpan,
        },
      };
    }
    const captionFromH1Tags =
      h1Tags.length > 1 ? h1Tags[1].innerText : h1Tags[0].innerText;
    bookmarks2ActionLogger.debug("trackBookmarkInstagram", {
      url,
      captionFromH1Tags,
    });
    return {
      success: true,
      data: {
        url,
        caption: captionFromH1Tags,
      },
    };
  } catch (err: unknown) {
    bookmarks2ActionLogger.error("trackBookmarkInstagram", err);
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

function trackBookmarkTwitter(): TrackBookmarkResultTwitter {
  const url = window.location.href;
  try {
    const tweetsMap: Record<string, string[]> = {};
    Array.from(document.querySelectorAll("[data-testid='tweet']")).forEach(
      (tweet) => {
        const userNameNode = tweet.querySelector("[data-testid='User-Name']");
        let userName = (
          userNameNode && "innerText" in userNameNode
            ? userNameNode.innerText
            : ""
        ) as string;
        if (userName.includes("\n")) {
          userName = userName.split("\n")[0];
        }
        const userProfileLinkNode = tweet.querySelector("a[role='link']");
        const userProfileLink = (
          userProfileLinkNode && "href" in userProfileLinkNode
            ? userProfileLinkNode.href
            : ""
        ) as string;
        const key = `${userName}-${userProfileLink}`;
        const tweetTextNode = tweet.querySelector("[data-testid='tweetText']");
        const tweetText = (
          tweetTextNode && "innerText" in tweetTextNode
            ? tweetTextNode.innerText
            : ""
        ) as string;
        if (tweetsMap[key]) {
          tweetsMap[key].push(tweetText);
        } else {
          tweetsMap[key] = [tweetText];
        }
      },
    );
    const caption = Object.values(tweetsMap).join("\n\n");
    bookmarks2ActionLogger.debug("trackBookmarkTwitter", {
      tweetsMap,
      caption,
    });
    return {
      success: true,
      data: {
        url,
        tweetsMap,
      },
    };
  } catch (err: unknown) {
    const error = err as Error;
    bookmarks2ActionLogger.error("trackBookmarkTwitter", error);
    return {
      success: false,
      issues: [{ message: error.message }],
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
