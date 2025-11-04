let extensionTab: chrome.tabs.Tab | null = null

export function getExtensionTab() {
  return extensionTab
}

export function setExtensionTab(tab: chrome.tabs.Tab | null = null) {
  extensionTab = tab
}
