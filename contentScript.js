console.log("ChatGPT Saver: Content script loaded");

// Wait for the page to be fully loaded
window.addEventListener("load", () => {
  console.log("ChatGPT Saver: Page loaded, initializing...");
  initializeObserver();
});

function initializeObserver() {
  console.log("ChatGPT Saver: Initializing mutation observer");

  // First, try to find and process any existing messages
  processExistingMessages();

  // Then set up observer for new messages

  const observer = new MutationObserver((mutations) => {
    let shouldProcess = false;

    // Check if any added nodes contain chat messages
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        shouldProcess = true;
        break;
      }
    }

    if (shouldProcess) {
      // Use setTimeout to ensure the DOM is fully updated
      setTimeout(processExistingMessages, 500);
    }
  });

  // Start observing the document with the configured parameters
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log("ChatGPT Saver: Mutation observer started");
}

function processExistingMessages() {
  console.log("ChatGPT Saver: Processing existing messages");

  // Find all message containers
  const messageContainers = document.querySelectorAll(
    '[data-message-author-role="assistant"]'
  );
  console.log(`Found ${messageContainers.length} assistant messages`);

  messageContainers.forEach((container) => {
    try {
      // Find the button group that contains the copy button
      const buttonGroup = container
        .querySelector('button[aria-label="Copy code"]')
        ?.closest("div");

      if (buttonGroup && !buttonGroup.querySelector(".chatgpt-saver-btn")) {
        console.log("ChatGPT Saver: Adding save button to message");
        addSaveButton(buttonGroup, container);
      }
    } catch (error) {
      console.error("ChatGPT Saver: Error processing message:", error);
    }
  });
}

function addSaveButton(buttonGroup, messageContainer) {
  try {
    // Create the save button
    const saveBtn = document.createElement("button");
    saveBtn.className = "chatgpt-saver-btn";
    saveBtn.innerHTML = "💾";
    saveBtn.title = "Save to file";
    saveBtn.style.cssText = `
      margin-left: 8px;
      padding: 4px 8px;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: transparent;
      cursor: pointer;
      font-size: 16px;
      line-height: 1;
      vertical-align: middle;
    `;

    // Add hover effect
    saveBtn.addEventListener("mouseover", () => {
      saveBtn.style.background = "rgba(0, 0, 0, 0.05)";
    });
    saveBtn.addEventListener("mouseout", () => {
      saveBtn.style.background = "transparent";
    });

    // Add click handler
    saveBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        console.log("ChatGPT Saver: Save button clicked");
        const messageContent =
          messageContainer.querySelector("[data-message-id]")?.textContent ||
          messageContainer.textContent;

        if (messageContent) {
          await saveToFile(messageContent);
        } else {
          console.warn("ChatGPT Saver: No message content found");
        }
      } catch (error) {
        console.error("ChatGPT Saver: Error saving message:", error);
      }
    });

    // Add the button to the button group
    buttonGroup.appendChild(saveBtn);
    console.log("ChatGPT Saver: Save button added");
  } catch (error) {
    console.error("ChatGPT Saver: Error adding save button:", error);
  }
}

async function saveToFile(content) {
  try {
    // Try using the File System Access API first
    if ("showSaveFilePicker" in window) {
      try {
        const options = {
          suggestedName: `chatgpt-${new Date()
            .toISOString()
            .replace(/[:.]/g, "-")}.md`,
          types: [
            {
              description: "Markdown File",
              accept: { "text/markdown": [".md"] },
            },
          ],
        };

        const fileHandle = await window.showSaveFilePicker(options);
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();

        console.log("ChatGPT Saver: File saved successfully");
        showNotification("File saved successfully!");
        return;
      } catch (err) {
        console.warn(
          "ChatGPT Saver: File System Access API not available:",
          err
        );
      }
    }

    // Fallback: Download file
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chatgpt-${new Date().toISOString().replace(/[:.]/g, "-")}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log("ChatGPT Saver: File downloaded");
    showNotification("File downloaded!");
  } catch (error) {
    console.error("ChatGPT Saver: Error saving file:", error);
    showNotification("Error saving file: " + error.message, true);
  }
}

function showNotification(message, isError = false) {
  const notification = document.createElement("div");
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 24px;
    background: ${isError ? "#ffebee" : "#e8f5e9"};
    color: ${isError ? "#c62828" : "#2e7d32"};
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    animation: fadeIn 0.3s ease-in-out;
  `;

  document.body.appendChild(notification);

  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = "fadeOut 0.3s ease-in-out";
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 3000);

  // Add click to dismiss
  notification.addEventListener("click", () => {
    if (document.body.contains(notification)) {
      document.body.removeChild(notification);
    }
  });
}

// Add styles for animations
const style = document.createElement("style");
style.textContent = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes fadeOut {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-10px); }
  }
`;
document.head.appendChild(style);

// Initialize when the script loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeObserver);
} else {
  initializeObserver();
}
