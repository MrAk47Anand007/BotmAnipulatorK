// document.addEventListener('DOMContentLoaded', () => {
//     const lineCountSpan = document.getElementById('lineCount');
//     const logInput = document.getElementById('logInput');
//     const copyButton = document.getElementById('copyButton');
//     const updateButton = document.getElementById('updateButton');
//     const statusMessage = document.getElementById('statusMessage');
//     const loader = document.getElementById('loader');
//
//     function showLoader() {
//         loader.style.display = 'block';
//     }
//
//     function hideLoader() {
//         loader.style.display = 'none';
//     }
//
//     function getTabDetails() {
//         return new Promise((resolve) => {
//             chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//                 chrome.tabs.sendMessage(tabs[0].id, { action: "getTabDetails" }, (response) => {
//                     console.log("Response from content script:", response);
//                     resolve(response);
//                 });
//             });
//         });
//     }
//
//     async function fetchAndDisplayLineCount() {
//         console.log("Starting fetchAndDisplayLineCount");
//         showLoader();
//         try {
//             console.log("Fetching tab details");
//             const tabDetails = await getTabDetails();
//             console.log("Tab details received:", tabDetails);
//
//             if (tabDetails && tabDetails.authToken) {
//                 console.log("Auth token found in tab details");
//                 const authToken = tabDetails.authToken.slice(1, -1);
//                 console.log("Processed auth token:", authToken);
//
//                 console.log("Sending message to get bot content");
//                 const response = await new Promise((resolve, reject) => {
//                     chrome.runtime.sendMessage(
//                         {
//                             action: "getBotContent",
//                             origin: tabDetails.origin,
//                             fileID: tabDetails.fileID,
//                             authToken
//                         },
//                         (response) => {
//                             if (chrome.runtime.lastError) {
//                                 reject(new Error(chrome.runtime.lastError.message));
//                             } else {
//                                 console.log("Received response from background script:", response);
//                                 resolve(response);
//                             }
//                         }
//                     );
//                 });
//
//                 hideLoader();
//                 console.log("Full response object:", response);
//                 if (response && response.success && response.lineCount !== undefined) {
//                     console.log("Updating line count:", response.lineCount);
//                     lineCountSpan.textContent = response.lineCount;
//                     statusMessage.textContent = `Auth token found. Line count: ${response.lineCount}`;
//                     console.log("Bot Content:", response.botContent);
//                 } else {
//                     console.error("Error in response:", response);
//                     statusMessage.textContent = "Error fetching bot content.";
//                     lineCountSpan.textContent = "N/A";
//                 }
//             } else {
//                 console.log("No auth token found in tab details");
//                 hideLoader();
//                 statusMessage.textContent = "Error retrieving auth token.";
//                 lineCountSpan.textContent = "N/A";
//             }
//         } catch (error) {
//             console.error("Caught error in fetchAndDisplayLineCount:", error);
//             hideLoader();
//             statusMessage.textContent = "Error retrieving tab details: " + error.message;
//             lineCountSpan.textContent = "N/A";
//         }
//         console.log("fetchAndDisplayLineCount completed");
//     }
//
//     fetchAndDisplayLineCount(); // Fetch and display the line count on load
//
//     copyButton.addEventListener('click', async () => {
//         showLoader();
//         try {
//             const response = await getTabDetails();
//             if (response && response.authToken) {
//                 const authToken = response.authToken.slice(1, -1);
//                 chrome.runtime.sendMessage({ action: "getBotContent", origin: response.origin, fileID: response.fileID, authToken }, (response) => {
//                     hideLoader();
//                     if (response.success) {
//                         navigator.clipboard.writeText(JSON.stringify(response.botContent)).then(() => {
//                             statusMessage.textContent = "Bot content copied to clipboard!";
//                         }).catch(() => {
//                             statusMessage.textContent = "Error copying to clipboard.";
//                         }).finally(() => {
//                             setTimeout(() => { statusMessage.textContent = ""; }, 2000); // Reset status
//                         });
//                     } else {
//                         statusMessage.textContent = "Error fetching bot content.";
//                     }
//                 });
//             } else {
//                 hideLoader();
//                 statusMessage.textContent = "Error retrieving auth token.";
//             }
//         } catch (error) {
//             hideLoader();
//             statusMessage.textContent = "Error retrieving tab details.";
//             console.error("Error in copyButton:", error);
//         }
//     });
//
//     updateButton.addEventListener('click', async () => {
//         showLoader();
//         try {
//             const response = await getTabDetails();
//             if (response && response.authToken) {
//                 const authToken = response.authToken.slice(1, -1);
//                 statusMessage.textContent = "Updating bot...";
//                 chrome.runtime.sendMessage({ action: "updateBot", origin: response.origin, fileID: response.fileID, authToken, logStructure: logInput.value }, (response) => {
//                     hideLoader();
//                     if (response.success) {
//                         statusMessage.textContent = "Bot updated successfully!";
//                     } else {
//                         statusMessage.textContent = "Error updating bot: " + response.error;
//                     }
//                     setTimeout(() => { statusMessage.textContent = ""; }, 3000); // Clear message after 3 seconds
//                 });
//             } else {
//                 hideLoader();
//                 statusMessage.textContent = "Error retrieving auth token.";
//             }
//         } catch (error) {
//             hideLoader();
//             statusMessage.textContent = "Error retrieving tab details.";
//             console.error("Error in updateButton:", error);
//         }
//     });
// });


document.addEventListener('DOMContentLoaded', () => {
    const lineCountSpan = document.getElementById('lineCount');
    const logInput = document.getElementById('logInput');
    const copyButton = document.getElementById('copyButton');
    const updateButton = document.getElementById('updateButton');
    const statusMessage = document.getElementById('statusMessage');
    const loader = document.getElementById('loader');
    const popupMessage = document.getElementById('popupMessage');

    function showLoader() {
        loader.style.display = 'block';
    }

    function hideLoader() {
        loader.style.display = 'none';
    }

    function getTabDetails() {
        return new Promise((resolve) => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                chrome.tabs.sendMessage(tabs[0].id, { action: "getTabDetails" }, (response) => {
                    console.log("Response from content script:", response);
                    resolve(response);
                });
            });
        });
    }

    function isA360BotPage(url) {
        const pattern = /#\/bots\/repository\/private\/taskbots\//;
        return pattern.test(url);
    }

    async function fetchAndDisplayLineCount() {
        console.log("Starting fetchAndDisplayLineCount");
        showLoader();
        try {
            console.log("Fetching tab details");
            const tabDetails = await getTabDetails();
            console.log("Tab details received:", tabDetails);

            if (tabDetails && tabDetails.authToken) {
                console.log("Auth token found in tab details");
                const authToken = tabDetails.authToken.slice(1, -1);
                console.log("Processed auth token:", authToken);

                console.log("Sending message to get bot content");
                const response = await new Promise((resolve, reject) => {
                    chrome.runtime.sendMessage(
                        {
                            action: "getBotContent",
                            origin: tabDetails.origin,
                            fileID: tabDetails.fileID,
                            authToken
                        },
                        (response) => {
                            if (chrome.runtime.lastError) {
                                reject(new Error(chrome.runtime.lastError.message));
                            } else {
                                console.log("Received response from background script:", response);
                                resolve(response);
                            }
                        }
                    );
                });

                hideLoader();
                console.log("Full response object:", response);
                if (response && response.success && response.lineCount !== undefined) {
                    console.log("Updating line count:", response.lineCount);
                    lineCountSpan.textContent = response.lineCount;
                    statusMessage.textContent = `Auth token found. Line count: ${response.lineCount}`;
                    console.log("Bot Content:", response.botContent);
                } else {
                    console.error("Error in response:", response);
                    statusMessage.textContent = "Error fetching bot content.";
                    lineCountSpan.textContent = "N/A";
                }
            } else {
                console.log("No auth token found in tab details");
                hideLoader();
                statusMessage.textContent = "Error retrieving auth token.";
                lineCountSpan.textContent = "N/A";
            }
        } catch (error) {
            console.error("Caught error in fetchAndDisplayLineCount:", error);
            hideLoader();
            statusMessage.textContent = "Error retrieving tab details: " + error.message;
            lineCountSpan.textContent = "N/A";
        }
        console.log("fetchAndDisplayLineCount completed");
    }

    async function handlePopupMessage() {
        try {
            const tabDetails = await getTabDetails();
            if (tabDetails && tabDetails.url) {
                if (isA360BotPage(tabDetails.url)) {
                    popupMessage.textContent = "Looks Good";
                    fetchAndDisplayLineCount(); // Fetch and display the line count on load
                } else {
                    popupMessage.textContent = "Open A360 Bot Page.";
                }
            } else {
                popupMessage.textContent = "Error retrieving tab URL.";
            }
        } catch (error) {
            console.error("Error in handlePopupMessage:", error);
            popupMessage.textContent = "Error retrieving tab details.";
        }
    }

    handlePopupMessage(); // Call this function on load to set the initial popup message



    copyButton.addEventListener('click', async () => {
        showLoader();
        try {
            const response = await getTabDetails();
            if (response && response.authToken && isA360BotPage(response.url)) {
                const authToken = response.authToken.slice(1, -1);
                chrome.runtime.sendMessage({ action: "getBotContent", origin: response.origin, fileID: response.fileID, authToken }, (response) => {
                    hideLoader();
                    if (response.success) {
                        navigator.clipboard.writeText(JSON.stringify(response.botContent)).then(() => {
                            statusMessage.textContent = "Bot content copied to clipboard!";
                        }).catch(() => {
                            statusMessage.textContent = "Error copying to clipboard.";
                        }).finally(() => {
                            setTimeout(() => { statusMessage.textContent = ""; }, 2000); // Reset status
                        });
                    } else {
                        statusMessage.textContent = "Error fetching bot content.";
                    }
                });
            } else {
                hideLoader();
                statusMessage.textContent = "Error retrieving auth token.";
            }
        } catch (error) {
            hideLoader();
            statusMessage.textContent = "Error retrieving tab details.";
            console.error("Error in copyButton:", error);
        }
    });

    updateButton.addEventListener('click', async () => {
        showLoader();
        try {
            const response = await getTabDetails();
            if (response && response.authToken && isA360BotPage(response.url)) {
                const authToken = response.authToken.slice(1, -1);
                statusMessage.textContent = "Updating bot...";
                chrome.runtime.sendMessage({ action: "updateBot", origin: response.origin, fileID: response.fileID, authToken, logStructure: logInput.value }, (response) => {
                    hideLoader();
                    if (response.success) {
                        statusMessage.textContent = "Bot updated successfully!";
                    } else {
                        statusMessage.textContent = "Error updating bot: " + response.error;
                    }
                    setTimeout(() => { statusMessage.textContent = ""; }, 3000); // Clear message after 3 seconds
                });
            } else {
                hideLoader();
                statusMessage.textContent = "Error retrieving auth token.";
            }
        } catch (error) {
            hideLoader();
            statusMessage.textContent = "Error retrieving tab details.";
            console.error("Error in updateButton:", error);
        }
    });
});
