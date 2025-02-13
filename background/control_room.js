/**
 * Function to fetch bot content from the server
 * @param {*} origin string - origin is control room URL
 * @param {*} fileID string - fileID is the bot ID which extracted from Control Room Bot URL
 * @param {*} authToken string - authToken for authorization of control room API's
 * @returns object - Return the bot content if successful else return failure if an error occurs
 */
export async function getBotContent(origin, fileID, authToken) {
    // Define the endpoint URI for fetching and updating bot content
    const botContentURI = "/v2/repository/files/<fileID>/content";
    // Construct the full URL for the API request
    let botContentURL = origin + botContentURI.replace("<fileID>", fileID);

    // Set up headers including content type and authorization token
    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("X-Authorization", authToken);

    // Define request options for a GET request
    let requestOptions = {
        method: "GET",
        headers: myHeaders,
    };

    try {
        // Perform the API request
        let response = await fetch(botContentURL, requestOptions);
        if (!response.ok) throw new Error("Fetch failed"); // Check if the response is successful
        let json = await response.json(); // Parse the JSON response
        return { success: true, botContent: json }; // Return the bot content if successful
    } catch (error) {
        console.error(error); // Log any errors that occur
        return { success: false }; // Return failure if an error occurs
    }
}

/**
 * Function to update bot content on the server
 * @param {*} origin string - origin is control room URL
 * @param {*} fileID string - fileID is the bot ID which extracted from Control Room Bot URL
 * @param {*} botJSONContent JSON - It is content of bot extracted using control room URL.
 * @param {*} authToken string - authToken for authorization of control room API's
 * @returns object - Return the updated bot content if successful else return failure if an error occurs
 */
export async function putBotJSONContent(
    origin,
    fileID,
    botJSONContent,
    authToken
) {
    // Define the endpoint URI for fetching and updating bot content
    const botContentURI = "/v2/repository/files/<fileID>/content";
    // Construct the full URL for the API request
    let botContentURL = origin + botContentURI.replace("<fileID>", fileID);
    console.log(botContentURL);

    // Set up headers including content type and authorization token
    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("X-Authorization", authToken);

    // Define request options for a PUT request with JSON body
    let requestOptions = {
        method: "PUT",
        headers: myHeaders,
        body: JSON.stringify(botJSONContent), // Convert the bot content to JSON
    };
    console.log(requestOptions);

    try {
        // Perform the API request
        let response = await fetch(botContentURL, requestOptions);
        if (!response.ok) throw new Error("Fetch failed"); // Check if the response is successful
        let json = await response.json(); // Parse the JSON response
        return { success: true, json }; // Return the updated bot content if successful
    } catch (error) {
        console.error(error); // Log any errors that occur
        return { success: false }; // Return failure if an error occurs
    }
}

/**
 * Function to update bot content with pasted JSON data
 * @param {*} origin string - origin is control room URL
 * @param {*} fileID string - fileID is the bot ID which extracted from Control Room Bot URL
 * @param {*} botJSONContent JSON - It is content of bot extracted using control room URL.
 * @param {*} authToken string - authToken for authorization of control room API's
 * @returns object - Return the updated bot content if successful else return failure if an error occurs
 */
export async function putBotJSONContentPaste(
    origin,
    fileID,
    botJSONContent,
    authToken
) {
    // Define the endpoint URI for fetching and updating bot content
    const botContentURI = "/v2/repository/files/<fileID>/content";
    const botContentURL = origin + botContentURI.replace("<fileID>", fileID);
    console.log(botJSONContent);
    console.log(authToken.slice(1, -1)); // Clean up the auth token

    // Parse the pasted JSON string into an object
    let botJSONContentVal;
    try {
        botJSONContentVal = JSON.parse(botJSONContent); // Attempt to parse the JSON
    } catch (error) {
        console.error("Invalid JSON string:", error); // Log error if JSON is invalid
        return { success: false, error: "Invalid JSON string" }; // Return failure with error message
    }

    let formattedBotJSONContent = JSON.stringify(botJSONContentVal, null, 2); // Format the JSON for readability
    console.log(formattedBotJSONContent);
    console.log(authToken);

    // Set up headers including content type and cleaned authorization token
    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append("X-Authorization", authToken.slice(1, -1));

    // Define request options for a PUT request with formatted JSON body
    let requestOptions = {
        method: "PUT",
        headers: myHeaders,
        body: formattedBotJSONContent, // Use the formatted JSON data
    };
    console.log(JSON.parse(formattedBotJSONContent));
    try {
        // Perform the API request
        let response = await fetch(botContentURL, requestOptions);
        let json = await response.json(); // Parse the JSON response
        console.log(json);
        if (!response.ok) throw new Error("Fetch failed"); // Check if the response is successful
        return { success: true, json }; // Return the updated bot content if successful
    } catch (error) {
        console.error(error); // Log any errors that occur
        return { success: false }; // Return failure if an error occurs
    }
}

/**
 * Function to count lines in the bot content
 * @param {*} node object - Node is the object of content which extracted from bot
 * @returns int - Returns the line count of given node.
 */
export function countLinesAccurately(node) {
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
            lineCount += countLinesAccurately(branch); // Treat each branch as a node
        }
    }

    return lineCount;
}

/**
 * Function to calculate the total number of lines in the bot content
 * @param {*} botContent object - bot content is the object of content which extracted using control room URL using file ID.
 * @returns int - Returns total lines count in bot content.
 */
export function calculateTotalLines(botContent) {
    let totalLines = 0;
    if (Array.isArray(botContent.nodes)) {
        for (let node of botContent.nodes) {
            totalLines += countLinesAccurately(node);
        }
    }
    return totalLines;
}

/**
 * Function to update the log message in given bot
 * @param {*} botContent object - Takes bot content as input and update bot content based on new line numbers.
 * @param {*} logStructure string - Format of loggging in log to file action.
 * @returns object - Returns object of updated bot content.
 */
export function updateLogMessages(botContent, logStructure) {

    let totalLineNumber = 0;

    function processNode(node) {
        let lineCount = 0;

        // Update line count if the node has a commandName attribute
        if (node.commandName) {
            lineCount += 1;
            totalLineNumber += 1;

            // If the node is a logToFile command, update log content
            if (node.commandName === "logToFile") {
                node.attributes.forEach((attribute) => {
                    if (attribute.name === "logContent") {
                        let currentLogContent = attribute.value.expression;

                        // Use a regex to find the pattern | number | or update existing line numbers
                        const regex = /\|\s*\d+\s*\|/;
                        const match = currentLogContent.match(regex);

                        if (match) {
                            // Replace the number inside the pipe operators with the total line number
                            currentLogContent = currentLogContent.replace(
                                regex,
                                `| ${totalLineNumber} |`
                            );
                        } else {
                            // Update existing line numbers in case of a different format
                            currentLogContent = currentLogContent.replace(
                                /-\d+-/,
                                `-${totalLineNumber}-`
                            );
                        }

                        // Apply new log structure if provided
                        if (logStructure && logStructure !== currentLogContent) {
                            if (logStructure.includes("|line number|")) {
                                currentLogContent = logStructure.replace(
                                    "|line number|",
                                    `| ${totalLineNumber} |`
                                );
                            } else {
                                // If logStructure doesn't contain |line number|, assume it's the structure to replace
                                currentLogContent = currentLogContent.replace(
                                    logStructure,
                                    `| ${totalLineNumber} |`
                                );
                            }
                        }

                        attribute.value.expression = currentLogContent;
                    }
                });
            }
        }

        // Recursively process children nodes
        if (Array.isArray(node.children)) {
            for (let child of node.children) {
                lineCount += processNode(child);
            }
        }

        // Recursively process branches
        if (Array.isArray(node.branches)) {
            for (let branch of node.branches) {
                lineCount += processNode(branch);
            }
        }

        return lineCount;
    }

    // Process all top-level nodes
    if (Array.isArray(botContent.nodes)) {
        for (let node of botContent.nodes) {
            processNode(node);
        }
    }

    return botContent;
}
