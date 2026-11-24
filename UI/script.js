
const chatContainer = document.getElementById("chatContainer");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const newChatBtn = document.getElementById("newChatBtn");
const welcome = document.getElementById("welcome");

// Create message
function createMessage(className) {
    const message = document.createElement("div");
    message.className = `message ${className}`;
    chatContainer.appendChild(message);
    return message;
}

// Send message
async function sendMessage() {
    const message = messageInput.value.trim();

    if (!message || sendBtn.disabled) return;

    welcome.style.display = "none";

    // User message
    const userMessage = createMessage("user-message");
    userMessage.textContent = message;

    // AI message
    const aiMessage = createMessage("ai-message");

    // Thinking animation
    const thinking = document.createElement("div");
    thinking.className = "thinking-indicator";

    thinking.innerHTML = `
        <span>Thinking</span>
        <div class="thinking-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;

    aiMessage.appendChild(thinking);

    messageInput.value = "";
    sendBtn.disabled = true;

    try {
        const response = await fetch(
            "http://localhost:5000/api/chat/stream",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ message })
            }
        );

        if (!response.ok || !response.body) {
            throw new Error("Backend request failed");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let buffer = "";
        let streamFinished = false;

        while (!streamFinished) {
            const { done, value } = await reader.read();

            if (done) {
                buffer += decoder.decode();
                streamFinished = true;
            } else {
                buffer += decoder.decode(value, { stream: true });
            }

            const events = buffer.split(/\r?\n\r?\n/);
            buffer = events.pop();

            for (const event of events) {
                const line = event
                    .split(/\r?\n/)
                    .find(line => line.startsWith("data:"));

                if (!line) continue;

                const data = line.slice(5).trim();

                if (data === "[DONE]") {
                    streamFinished = true;
                    break;
                }

                const parsed = JSON.parse(data);

                if (parsed.error) {
                    throw new Error(parsed.error);
                }

                if (parsed.token) {
                    thinking.remove();

                    aiMessage.textContent += parsed.token;

                    chatContainer.scrollTop =
                        chatContainer.scrollHeight;
                }
            }
        }

    } catch (error) {
        console.error("Chat Error:", error);

        thinking.remove();

        aiMessage.textContent =
            "Sorry, something went wrong. Please try again.";

    } finally {
        sendBtn.disabled = false;
        messageInput.focus();
    }
}

// Send button click
sendBtn.addEventListener("click", sendMessage);

// Enter key
messageInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

// New Chat
newChatBtn.addEventListener("click", function() {
    chatContainer.innerHTML = "";
    chatContainer.appendChild(welcome);

    welcome.style.display = "block";
    messageInput.value = "";
});
