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
};

let observer: MutationObserver | null = null;
let isActive = false;

// Main badge handling logic
function handleDegreeBadge(node: HTMLElement) {
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
    if (container) {
      utils.applyHighlight(container, CONFIG.DEGREE["1st"].HIGHLIGHT_STYLE);
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
    if (container) {
      utils.applyHighlight(container, CONFIG.DEGREE["2nd"].HIGHLIGHT_STYLE);
    }
  }
}

// Process existing badges on page
function processExistingBadges(): number {
  const badges = document.querySelectorAll<HTMLElement>(
    CONFIG.SELECTORS.DEGREE_BADGE
  );
  badges.forEach(handleDegreeBadge);
  return badges.length;
}

// Create mutation observer for dynamic content
function createMutationObserver(): MutationObserver {
  const obs = new MutationObserver((mutationsList) => {
    for (const mutation of mutationsList) {
      if (mutation.type !== "childList") continue;

      mutation.addedNodes.forEach((node) => {
        if (!utils.isValidElement(node)) return;

        if (node.matches?.(CONFIG.SELECTORS.DEGREE_BADGE)) {
          handleDegreeBadge(node);
        }

        node
          .querySelectorAll?.<HTMLElement>(CONFIG.SELECTORS.DEGREE_BADGE)
          .forEach(handleDegreeBadge);
      });
    }
  });

  obs.observe(document.body, { childList: true, subtree: true });
  return obs;
}

// Start highlighting
function startHighlighting(): { success: boolean; count: number } {
  if (isActive) {
    return { success: true, count: 0 };
  }

  logger.info("Starting 2nd degree connection highlighter...");
  isActive = true;

  const count = processExistingBadges();
  observer = createMutationObserver();

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

export default defineContentScript({
  matches: ["*://*.linkedin.com/feed/*", "*://*.linkedin.com/in/*"],
  main() {
    logger.info("Content script loaded, waiting for activation...");

    // Listen for messages from popup
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      logger.debug("Received message:", message);

      switch (message.action) {
        case "start":
          const startResult = startHighlighting();
          sendResponse(startResult); // ✅ Send response
          break;
        case "stop":
          const stopResult = stopHighlighting();
          sendResponse(stopResult); // ✅ Send response
          break;
        case "status":
          sendResponse({ isActive });
          break;
        default:
          sendResponse({ success: false, error: "Invalid action" });
      }
      return true; // Keep message channel open for async response
    });
  },
});
