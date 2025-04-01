# Frontend-Backend Communication in RealChar Chat System

This document provides a comprehensive analysis of how the frontend communicates with the backend during chat conversations in the RealChar application, focusing on the WebSocket-based communication system.

## 1. Overview of the WebSocket-based Communication System

RealChar uses WebSockets as the primary communication protocol between the frontend and backend. This choice enables:

- **Real-time bidirectional communication**: Allowing instant message delivery in both directions without requiring the client to send new HTTP requests for updates
- **Persistent connections**: Maintaining an open connection for the duration of the chat session
- **Streaming responses**: Supporting streaming of text and audio data as it's being generated
- **Low latency**: Providing near-instantaneous communication essential for interactive conversations

The system handles both text-based messaging and audio streaming over the same WebSocket connection, making it suitable for both text chat and voice interaction modes.

## 2. Frontend WebSocket Connection Establishment

The frontend establishes a connection with the backend using the following process:

1. **Connection Initialization**:
   - The client creates a WebSocket connection to the server endpoint `/ws/{session_id}`
   - Query parameters are included in the connection URL:
     - `session_id`: A unique identifier for the conversation session
     - `llm_model`: The language model to use (e.g., "gpt-3.5-turbo-16k")
     - `language`: The language code (e.g., "en-US")
     - `token`: Authentication token (if authentication is enabled)
     - `character_id`: The ID of the selected AI character (optional)
     - `platform`: The client platform type (web, mobile, terminal)
     - `journal_mode`: Boolean flag for special transcript handling mode

2. **Authentication**:
   - If authentication is enabled (`USE_AUTH=true`), the server validates the provided token
   - For anonymous users, access may be restricted to certain models only
   - The server also verifies session ownership by checking if the user is authorized to access the requested session

3. **Character Selection**:
   - If no character is specified, the server presents a list of available characters
   - The user selects a character by entering the corresponding number
   - The selected character's configuration (including voice settings) is loaded

## 3. Message Transmission from Frontend to Backend

The frontend sends different types of messages to the backend:

### Text Messages:
```
websocket.send({
  type: "websocket.receive",
  text: "User's message text"
})
```

### Audio Messages:
```
websocket.send({
  type: "websocket.receive",
  bytes: binaryAudioData
})
```

### Special Command Messages:
```
websocket.send({
  type: "websocket.receive",
  text: "[!COMMAND_NAME]command_content"
})
```

### Speech Recognition Control:
```
websocket.send({
  type: "websocket.receive",
  text: "[&Speech]" // Indicates interim speech recognition will follow
})

websocket.send({
  type: "websocket.receive",
  text: "[SpeechFinished]" // Indicates speech input is complete
})
```

## 4. Backend Message Processing

The backend processes incoming messages using an asynchronous handler (`handle_receive`):

1. **Message Type Determination**:
   - The server identifies whether the incoming data is text or binary audio
   - For text messages, it checks for special command prefixes

2. **Text Message Processing**:
   - Regular text messages are forwarded to the LLM for processing
   - Command messages trigger specific actions (e.g., enabling journal mode, adding/deleting speakers)
   - Speech control messages manage the speech recognition state

3. **Audio Processing**:
   - Binary audio data is sent to the Speech-to-Text service for transcription
   - In journal mode, advanced diarization processing identifies different speakers
   - Transcribed text is used as input for the LLM

4. **Conversation Management**:
   - The system maintains conversation history for context
   - Previous responses can be interrupted when new user input is received
   - Message IDs track individual exchanges

## 5. Response Generation and Streaming

Responses are generated and streamed back using a multi-step process:

1. **LLM Processing**:
   - User input and conversation history are sent to the LLM
   - The LLM generates a response based on the character's system prompt and conversation context

2. **Token Streaming**:
   - Response tokens are streamed back to the client as they are generated
   - Each token is sent as a separate WebSocket message
   - This enables progressive rendering of the response on the client

3. **Text-to-Speech Processing**:
   - If not in journal mode, text responses are also processed by a Text-to-Speech service
   - Audio is generated based on the character's voice settings and sent to the client
   - Audio streams can be interrupted if new user input arrives

4. **Database Persistence**:
   - Completed exchanges are saved to the database using the Interaction model
   - Each interaction includes user and server messages, character details, platform info, and language

## 6. Frontend Response Processing

The frontend processes incoming WebSocket messages from the backend:

1. **Message Parsing**:
   - The client identifies the type of incoming message based on content prefixes
   - Regular text responses are rendered in the chat UI
   - Special prefixed messages trigger specific UI updates

2. **Response Display**:
   - Text responses are displayed progressively as tokens arrive
   - The "[end=message_id]" marker signals the completion of a response
   - Audio responses are played through the audio system

3. **Transcript Display**:
   - Transcribed user speech is displayed with a "[+]You said:" prefix
   - Interim speech recognition results are shown with a "[+&]" prefix
   - In journal mode, speaker-identified transcripts use a "[+transcript]" format with metadata

## 7. Special Handling for Text vs Audio Messages

The system handles text and audio modes differently:

### Text Mode:
- User sends text messages directly
- Backend processes text input directly with the LLM
- Responses are streamed as text and optionally converted to speech
- The `AsyncCallbackTextHandler` manages text response handling

### Audio Mode:
- User sends binary audio data
- Backend transcribes audio to text using Speech-to-Text
- Transcription is sent back to the client for display
- The same text is processed by the LLM
- Responses are streamed as both text and audio
- The `AsyncCallbackAudioHandler` manages audio response handling

### Journal Mode:
- Specialized mode for transcribing conversations with speaker identification
- Uses diarization to identify different speakers in audio
- Maintains audio caching for continuous processing
- Creates transcript objects with time-aligned text segments

## 8. Communication Flow Diagram

```
Client                                                Server
  |                                                     |
  |--- WebSocket Connection (/ws/{session_id}) -------->|
  |                                                     |
  |<-- Character Selection/Authentication --------------|
  |                                                     |
  |--- Character Selection ---------------------------->|
  |                                                     |
  |<-- Greeting Message & Audio -----------------------|
  |                                                     |
  |                   [TEXT MODE]                       |
  |--- Text Message ----------------------------------->|
  |                                                     |
  |<-- Token 1 ----------------------------------------|
  |<-- Token 2 ----------------------------------------|
  |<-- Token n ----------------------------------------|
  |<-- Audio Chunks ------------------------------------>
  |<-- [end=message_id] -------------------------------|
  |                                                     |
  |                  [AUDIO MODE]                       |
  |--- Binary Audio Data ------------------------------>|
  |                                                     |
  |<-- [+]You said: {transcription} -------------------|
  |                                                     |
  |<-- Token 1 ----------------------------------------|
  |<-- Token 2 ----------------------------------------|
  |<-- Token n ----------------------------------------|
  |<-- Audio Chunks ------------------------------------>
  |<-- [end=message_id] -------------------------------|
  |                                                     |
  |                 [JOURNAL MODE]                      |
  |--- Binary Audio Data ------------------------------>|
  |                                                     |
  |<-- [+transcript]?id=...&speakerId=...&text=... -----|
  |                                                     |
```

In both text and audio modes, responses are streamed progressively. The main difference is the initial input processing (direct text vs. audio transcription). Journal mode provides additional speaker identification and time alignment capabilities for transcription purposes.

The WebSocket-based architecture allows for a responsive, real-time conversation experience that supports both text and voice interactions with AI characters, with additional features like streaming responses, audio playback, and conversation history management.