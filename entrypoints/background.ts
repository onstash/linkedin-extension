export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(() => {
    browser.contextMenus.create({
      id: "track-bookmark",
      title: "Track Bookmark",
      contexts: ["selection"],
    });
  });

  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "track-bookmark") {
      const caption = info.selectionText;
      const url = tab?.url || "";

      if (caption) {
        const targetUrl = `https://app.youform.com/forms/f6gffax5?url=${encodeURIComponent(url)}&caption=${encodeURIComponent(caption)}`;
        browser.tabs.create({ url: targetUrl });
      }
    }
  });
});
