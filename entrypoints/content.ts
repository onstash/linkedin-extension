// Configuration constants
const CONFIG = {
  SELECTORS: {
    DEGREE_BADGE:
      ".social-details-reactors-modal >* .artdeco-entity-lockup__degree",
    CONTAINER: ".social-details-reactors-modal",
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

// Centralized logging with levels
const logger = {
  debug: (...args: unknown[]) =>
    CONFIG.DEBUG && console.log("[LinkedIn++]", ...args),
  info: (...args: unknown[]) => console.log("[LinkedIn++]", ...args),
  warn: (...args: unknown[]) => console.warn("[LinkedIn++]", ...args),
  error: (...args: unknown[]) => console.error("[LinkedIn++]", ...args),
};

type OnHighlightCallback = (node: HTMLElement) => void;

// Helper functions
const utils = {
  isValidElement: (element: Node | null): element is HTMLElement =>
    element !== null && element.nodeType === Node.ELEMENT_NODE,

  findContainer: (
    startElement: HTMLElement,
    levels: number
  ): HTMLElement | null => {
    let container: HTMLElement | null = startElement;
    for (let i = 0; i < levels; i++) {
      if (!container?.parentElement) {
        logger.warn(
          `Container traversal stopped at level ${i}, no parent found`
        );
        return null;
      }
      container = container.parentElement;
    }
    return container;
  },

  isDegreeConnection: (element: HTMLElement, degreeText: string): boolean => {
    const text = element.innerText?.trim() || "";
    return text.endsWith(degreeText);
  },

  applyHighlight: (
    element: HTMLElement,
    styles: Partial<CSSStyleDeclaration>
  ): boolean => {
    try {
      Object.assign(element.style, styles);
      element.setAttribute("data-degree-highlighted", "true");
      return true;
    } catch (error) {
      logger.error("Failed to apply highlight:", error);
      return false;
    }
  },

  isAlreadyHighlighted: (element: HTMLElement): boolean => {
    return element.hasAttribute("data-degree-highlighted");
  },
};

let observer: MutationObserver | null = null;
let isActive = false;

// Main badge handling logic
function handleDegreeBadge(
  node: HTMLElement,
  onHighlight: OnHighlightCallback
) {
  if (!utils.isValidElement(node)) return;

  const isFirstDegree = utils.isDegreeConnection(
    node,
    CONFIG.DEGREE["1st"].DEGREE_TEXT
  );
  if (isFirstDegree) {
    const container = utils.findContainer(
      node,
      CONFIG.DEGREE["1st"].PARENT_LEVELS
    );
    if (container && !utils.isAlreadyHighlighted(container)) {
      utils.applyHighlight(container, CONFIG.DEGREE["1st"].HIGHLIGHT_STYLE);
      onHighlight?.(container);
      return;
    }
  }
  const isSecondDegree = utils.isDegreeConnection(
    node,
    CONFIG.DEGREE["2nd"].DEGREE_TEXT
  );
  if (isSecondDegree) {
    const container = utils.findContainer(
      node,
      CONFIG.DEGREE["2nd"].PARENT_LEVELS
    );
    if (container && !utils.isAlreadyHighlighted(container)) {
      utils.applyHighlight(container, CONFIG.DEGREE["2nd"].HIGHLIGHT_STYLE);
      onHighlight?.(container);
    }
  }
}

// Process existing badges on page
function processExistingBadges(onHighlight: OnHighlightCallback): number {
  const badges = document.querySelectorAll<HTMLElement>(
    CONFIG.SELECTORS.DEGREE_BADGE
  );
  badges.forEach((badge) => handleDegreeBadge(badge, onHighlight));
  return badges.length;
}

// Create mutation observer for dynamic content
function createMutationObserver(
  onHighlight: (node: HTMLElement) => void,
  onHighlightRemoved: (node: HTMLElement) => void
): MutationObserver {
  const obs = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type !== "childList") continue;

      mutation.addedNodes.forEach((node) => {
        if (!utils.isValidElement(node)) return;

        if (node.matches?.(CONFIG.SELECTORS.DEGREE_BADGE)) {
          handleDegreeBadge(node, onHighlight);
        }

        const badges = node.querySelectorAll?.<HTMLElement>(
          CONFIG.SELECTORS.DEGREE_BADGE
        );
        badges?.forEach((badge) => handleDegreeBadge(badge, onHighlight));
      });

      mutation.removedNodes.forEach((node) => {
        if (!utils.isValidElement(node)) return;

        if (node.matches?.(CONFIG.SELECTORS.DEGREE_BADGE)) {
          // handleDegreeBadge(node, onHighlight);
          if (utils.isAlreadyHighlighted(node)) {
            onHighlightRemoved(node);
          }
        }

        const badges = node.querySelectorAll?.<HTMLElement>(
          CONFIG.SELECTORS.DEGREE_BADGE
        );
        badges?.forEach((badge) => {
          if (utils.isAlreadyHighlighted(badge)) {
            onHighlightRemoved(badge);
          }
        });
      });
    }
  });

  obs.observe(document.body, { childList: true, subtree: true });
  return obs;
}

// Start highlighting
function startHighlighting(
  onHighlight: OnHighlightCallback,
  onHighlightRemoved: OnHighlightCallback
): {
  success: boolean;
  count: number;
} {
  if (isActive && observer) {
    observer.disconnect();
  }

  logger.info("Starting 2nd degree connection highlighter...");
  isActive = true;
  observer = createMutationObserver(onHighlight, onHighlightRemoved);

  const count = processExistingBadges(onHighlight);

  logger.info(`Highlighted ${count} existing badges, watching for new ones...`);
  return { success: true, count };
}

// Stop highlighting and clean up
function stopHighlighting(): { success: boolean; cleaned: number } {
  if (!isActive) {
    return { success: true, cleaned: 0 };
  }

  logger.info("Stopping highlighter...");
  isActive = false;

  observer?.disconnect();
  observer = null;

  // Remove highlights
  const highlightedElements = document.querySelectorAll<HTMLElement>(
    '[data-degree-highlighted="true"]'
  );
  highlightedElements.forEach((element) => {
    element.style.border = "";
    element.style.backgroundColor = "";
    element.removeAttribute("data-degree-highlighted");
  });

  logger.info(`Cleaned up ${highlightedElements.length} highlighted elements`);
  return { success: true, cleaned: highlightedElements.length };
}

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

export default defineContentScript({
  matches: ["*://*.linkedin.com/feed/*", "*://*.linkedin.com/in/*"],
  main() {
    logger.info("Content script loaded, waiting for activation...");

    // Listen for messages from popup
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      logger.debug("Received message:", message);

      switch (message.action) {
        case "degree_highlight_start":
          const startResult = startHighlighting(
            (node) => {
              logger.info("Highlighting node:", node);
            },
            (node) => {
              logger.info("Highlight removed node:", node);
            }
          );
          sendResponse(startResult); // ✅ Send response
          break;
        case "degree_highlight_stop":
          const stopResult = stopHighlighting();
          sendResponse(stopResult); // ✅ Send response
          break;
        case "degree_highlight_status":
          sendResponse({ isActive });
          break;
        case "track_profile_new_connection":
        case "track_profile_dtm":
          const trackProfileResult = trackProfile();
          sendResponse({ success: true, data: trackProfileResult });
          break;
        default:
          sendResponse({ success: false, error: "Invalid action" });
      }
      return true; // Keep message channel open for async response
    });
  },
});
