(async function() {
    const botContentURI = "/v2/repository/files/<fileID>/content";

    async function getBotContent(origin, fileID, authToken) {
        let botContentURL = origin + botContentURI.replace("<fileID>", fileID);

        let myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("X-Authorization", authToken);

        let requestOptions = {
            method: "GET",
            headers: myHeaders,
        };

        try {
            let response = await fetch(botContentURL, requestOptions);
            if (!response.ok) throw new Error("Fetch failed");
            let json = await response.json();
            return { success: true, botContent: json };
        } catch (error) {
            console.error(error);
            return { success: false };
        }
    }

    async function putBotJSONContent(origin, fileID, botJSONContent, authToken) {
        let botContentURL = origin + botContentURI.replace("<fileID>", fileID);

        let myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("X-Authorization", authToken);

        let requestOptions = {
            method: "PUT",
            headers: myHeaders,
            body: JSON.stringify(botJSONContent),
        };

        try {
            let response = await fetch(botContentURL, requestOptions);
            if (!response.ok) throw new Error("Fetch failed");
            let json = await response.json();
            return { success: true, json };
        } catch (error) {
            console.error(error);
            return { success: false };
        }
    }

    // function countLines(botContent) {
    //     let lineCount = 0;
    //
    //     function dfs(node) {
    //         if (node.commandName) {
    //             lineCount++;
    //         }
    //
    //         if (node.children) {
    //             node.children.forEach(child => dfs(child));
    //         }
    //
    //         if (node.branches) {
    //             node.branches.forEach(branch => {
    //                 branch.nodes.forEach(branchNode => dfs(branchNode));
    //             });
    //         }
    //     }
    //
    //     if (botContent.nodes) {
    //         botContent.nodes.forEach(node => dfs(node));
    //     }
    //     return lineCount;
    // }

    function countLinesAccurately(node) {
        let lineCount = 0;

        // Each node with a commandName attribute counts as a line
        if (node.commandName) {
            lineCount += 1;
        }

        // Recursively count lines in children nodes
        if (Array.isArray(node.children)) {
            for (let child of node.children) {
                lineCount += countLinesAccurately(child);
            }
        }

        // Recursively count lines in branches
        if (Array.isArray(node.branches)) {
            for (let branch of node.branches) {
                lineCount += countLinesAccurately(branch);  // Treat each branch as a node
            }
        }

        return lineCount;
    }

    function calculateTotalLines(botContent) {
        let totalLines = 0;
        if (Array.isArray(botContent.nodes)) {
            for (let node of botContent.nodes) {
                totalLines += countLinesAccurately(node);
            }
        }
        return totalLines;
    }


    function updateLogMessages(botContent, logStructure) {
        let totalLineNumber = 0;

        function processNode(node) {
            let lineCount = 0;

            if (node.commandName) {
                lineCount += 1;
                totalLineNumber += 1;

                if (node.commandName === 'logToFile') {
                    node.attributes.forEach(attribute => {
                        if (attribute.name === 'logContent') {
                            let currentLogContent = attribute.value.expression;

                            // Update existing line numbers
                            currentLogContent = currentLogContent.replace(/-\d+-/, `-${totalLineNumber}-`);

                            // Apply new log structure if provided
                            if (logStructure && logStructure !== currentLogContent) {
                                if (logStructure.includes('|line number|')) {
                                    currentLogContent = logStructure.replace('|line number|', `-${totalLineNumber}-`);
                                } else {
                                    // If logStructure doesn't contain |line number|, we assume it's the actual structure to replace
                                    currentLogContent = currentLogContent.replace(logStructure, `-${totalLineNumber}-`);
                                }
                            }

                            attribute.value.expression = currentLogContent;
                        }
                    });
                }
            }

            if (Array.isArray(node.children)) {
                for (let child of node.children) {
                    lineCount += processNode(child);
                }
            }

            if (Array.isArray(node.branches)) {
                for (let branch of node.branches) {
                    lineCount += processNode(branch);
                }
            }

            return lineCount;
        }

        if (Array.isArray(botContent.nodes)) {
            for (let node of botContent.nodes) {
                processNode(node);
            }
        }

        return botContent;
    }

    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === "getBotContent") {
            getBotContent(request.origin, request.fileID, request.authToken)
                .then(response => {
                    if (response && response.success) {
                        console.log("Full bot content:", JSON.stringify(response.botContent, null, 2));
                        try {
                            let lineCount = calculateTotalLines(response.botContent);
                            console.log("Calculated line count:", lineCount);
                            sendResponse({ success: true, lineCount, botContent: response.botContent });
                        } catch (error) {
                            console.error("Error in calculateTotalLines:", error);
                            sendResponse({ success: false, error: "Error counting lines" });
                        }
                    } else {
                        console.error("Failed to get bot content:", response);
                        sendResponse({ success: false, error: "Failed to get bot content" });
                    }
                })
                .catch(error => {
                    console.error("Error in getBotContent:", error);
                    sendResponse({ success: false, error: error.message });
                });
        } else if (request.action === "updateBot") {
            let { origin, fileID, authToken, logStructure } = request;
            getBotContent(origin, fileID, authToken)
                .then(response => {
                    if (response && response.success) {
                        let updatedBotContent = updateLogMessages(response.botContent, logStructure);
                        return putBotJSONContent(origin, fileID, updatedBotContent, authToken);
                    } else {
                        throw new Error("Failed to fetch bot content");
                    }
                })
                .then(updateResponse => {
                    if (updateResponse.success) {
                        sendResponse({ success: true });
                    } else {
                        throw new Error("Failed to update bot content");
                    }
                })
                .catch(error => {
                    console.error("Error in updateBot:", error);
                    sendResponse({ success: false, error: error.message });
                });
        } else {
            sendResponse({ success: false, error: "Unknown action" });
        }

        return true; // Indicates that the response will be sent asynchronously
    });
})();
