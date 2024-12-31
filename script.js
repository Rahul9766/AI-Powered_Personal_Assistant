let prompt = document.querySelector("#prompt");
let submitBtn = document.querySelector("#submit");  // Ensure the button has the correct id
let chatContainer = document.querySelector(".chat-area");
let imageInput = document.querySelector("#image-input");
let imagePreview = document.querySelector("#image");
let imageBtn = document.querySelector("#image-btn");
let voiceBtn = document.querySelector("#voice-btn"); // Voice input button

const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyAXVbDMIhsme-MfWLHTu96mU2SMqa3PuUk"; // Replace with your API Key

let user = {
    message: null,
    file: {
        mime_type: null,
        data: null
    }
};

// Speech Recognition setup (voice input)
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en-US';
recognition.interimResults = true;

recognition.onstart = function() {
    console.log("Voice recognition started...");
};

recognition.onresult = function(event) {
    let transcript = event.results[event.resultIndex][0].transcript;
    prompt.value = transcript;
    console.log("Voice input: ", transcript);
};

recognition.onerror = function(event) {
    console.error("Voice recognition error:", event);
};

// Get the list of available voices
let voices = [];
window.speechSynthesis.onvoiceschanged = function() {
    voices = window.speechSynthesis.getVoices();
    console.log(voices);
};

// Function to create a chat box for each message (user or AI)
function createChatBox(html, classes) {
    let div = document.createElement("div");
    div.innerHTML = html;
    div.classList.add(classes);
    return div;
}

// Function to send the message and receive AI response
async function generateResponse(aiChatBox) {
    let text = aiChatBox.querySelector(".ai-chat-area");

    let requestOption = {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            "contents": [
                { "parts": [{ "text": user.message }, ...(user.file.data ? [{ "inline_data": user.file }] : [])] }
            ]
        })
    };

    try {
        let response = await fetch(API_URL, requestOption);
        let data = await response.json();
        let apiResponse = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim();
        text.innerHTML = apiResponse;
        speakResponse(apiResponse);  // Convert AI response to speech
    } catch (error) {
        console.log("Error:", error);
    } finally {
        chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });
        imagePreview.classList.add("hidden");
        user.file = {}; // Reset file input
    }
}

// Function to convert text to speech with female voice
function speakResponse(responseText) {
    const utterance = new SpeechSynthesisUtterance(responseText);
    utterance.lang = 'en-US';
    utterance.volume = 1; // Volume: 0 to 1
    utterance.rate = 1;   // Speed: 0.1 to 10
    utterance.pitch = 1;  // Pitch: 0 to 2

    // Select a female voice from the list of available voices
    const femaleVoice = voices.find(voice => voice.name.toLowerCase().includes('female'));
    if (femaleVoice) {
        utterance.voice = femaleVoice;
    }

    // Speak the text response
    window.speechSynthesis.speak(utterance);
}

// Function to handle user input and display it in the chat
function handleChatResponse(userMessage) {
    user.message = userMessage;

    let html = `
        <div class="message-bubble user-bubble">
            <img src="user.png" alt="User Image" />
            <div class="user-chat-area">${user.message}</div>
        </div>
    `;

    prompt.value = "";
    let userChatBox = createChatBox(html, "user-chat-box");
    chatContainer.appendChild(userChatBox);
    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: "smooth" });

    // After a short delay, show AI response
    setTimeout(() => {
        let html = `
            <div class="message-bubble ai-bubble">
                <img src="ai.png" alt="AI Image" />
                <div class="ai-chat-area">
                    <img src="loading.webp" alt="Loading" class="load" width="50px">
                </div>
            </div>
        `;
        let aiChatBox = createChatBox(html, "ai-chat-box");
        chatContainer.appendChild(aiChatBox);
        generateResponse(aiChatBox);
    }, 600);
}

// Event listener for user input (Enter key)
prompt.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        handleChatResponse(prompt.value);
    }
});

// Event listener for Send button
submitBtn.addEventListener("click", () => {
    // Ensure the value of the prompt field isn't empty
    if (prompt.value.trim() !== "") {
        handleChatResponse(prompt.value);
    } else {
        console.log("Please enter a message!");
    }
});

// Event listener for Voice input button
voiceBtn.addEventListener("click", () => {
    recognition.start(); // Start voice recognition
});



