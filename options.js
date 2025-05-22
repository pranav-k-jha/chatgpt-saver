const pickBtn = document.getElementById("pick-folder");
const status = document.getElementById("status");

pickBtn.addEventListener("click", async () => {
  try {
    // Show directory picker
    const dirHandle = await window.showDirectoryPicker();
    // Persist handle in chrome.storage
    await chrome.storage.local.set({ saveDir: dirHandle });
    status.textContent = `Folder set: ${dirHandle.name}`;
  } catch (err) {
    console.error(err);
    status.textContent = "Folder selection cancelled.";
  }
});

// On load, show current setting if any
(async () => {
  const { saveDir } = await chrome.storage.local.get("saveDir");
  if (saveDir) {
    status.textContent = `Current folder: ${saveDir.name}`;
  }
})();
