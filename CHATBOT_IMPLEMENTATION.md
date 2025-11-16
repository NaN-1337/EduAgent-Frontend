# Student Chatbot Implementation

This document describes the implementation of the AI-powered chatbot for students in the lesson viewer.

## Overview

The chatbot is a learning assistant available **only to students** within individual lessons. It provides real-time, personalized help by answering questions about the lesson content using GPT-4o with web search capabilities.

## Key Features

### 1. **Character-by-Character Typing Animation**
- Messages from the chatbot appear with a realistic typing effect
- Each character is displayed with a 20ms delay
- Creates a more engaging, human-like interaction

### 2. **Session Management**
- Each student has a **separate chat session per lesson**
- Sessions are stored in the browser's `localStorage`
- Session IDs are maintained for continuity across page reloads
- Format: `chat_session_${lessonId}_${studentId}`

### 3. **Adaptive Responses**
- The backend API adapts its tone based on the student's grade level:
  - **Grades 1-4**: Simple, playful language with emojis
  - **Grades 5-8**: Friendly, conversational with relatable examples
  - **Grades 9-12**: Mature, academic tone with real-world applications

### 4. **Context-Aware**
- The chatbot has access to the full lesson content
- Maintains conversation history within the session
- Can reference previous messages in the conversation

## Architecture

### Frontend Components

#### 1. **LessonChatbot Component** (`frontend/src/components/chatbot/LessonChatbot.tsx`)
- Main chatbot UI component
- Handles message display, input, and typing animation
- Manages local session storage
- Props:
  - `lessonContent`: The HTML content of the lesson
  - `subject`: The subject name
  - `grade`: Student's grade level
  - `lessonId`: Unique lesson identifier
  - `studentId`: Unique student identifier

#### 2. **StudentLessonPlayer Integration** (`frontend/src/pages/student/StudentLessonPlayer.tsx`)
- Replaced the teacher information sidebar with the chatbot
- Sidebar width: 96 (384px) when expanded, 12 (48px) when collapsed
- Full-height layout to accommodate the chat interface

### API Functions

#### **startChat** (`frontend/src/lib/api.ts`)
- Initiates a new chat session
- Sends the first message along with lesson context
- Returns a `session_id` for future messages

```typescript
interface StartChatRequest {
  lesson_content: string;
  user_prompt: string;
  subject: string;
  user_role: "student";
  grade: number;
}
```

#### **continueChat** (`frontend/src/lib/api.ts`)
- Continues an existing chat session
- Uses the `session_id` from the previous interaction
- Maintains conversation context

```typescript
interface ContinueChatRequest {
  session_id: string;
  user_prompt: string;
}
```

### Backend API

#### **POST /api/chat**
- Endpoint for both starting and continuing chat sessions
- Powered by GPT-4o with web search capabilities
- Sessions expire after 1 hour of inactivity
- Adapts tone based on user role and grade level

See `API_EXAMPLES.md` for detailed API documentation.

## UI/UX Design

### Chat Interface
- **Header**: Shows chatbot title and subtitle with bot icon
- **Messages Area**: Scrollable area with message bubbles
  - User messages: Right-aligned, primary color background
  - Bot messages: Left-aligned, muted background
- **Input Area**: Text input with send button
- **Welcome Message**: Displayed when no messages exist

### Message Styling
- User messages have a user icon on the right
- Bot messages have a bot icon on the left
- Smooth fade-in and slide-in animations for new messages
- Loading indicator with pulsing cursor during typing

## Session Storage

Sessions are stored in `localStorage` with the following structure:

```json
{
  "chat_session_${lessonId}_${studentId}": {
    "sessionId": "uuid-from-backend",
    "messages": [
      {
        "role": "user",
        "content": "What is a cell?",
        "timestamp": 1234567890
      },
      {
        "role": "assistant",
        "content": "A cell is the smallest unit of life...",
        "timestamp": 1234567895
      }
    ]
  }
}
```

## Translations

Chatbot translations are available in Romanian and English:

### Romanian (`ro`)
- **Title**: "Asistent de Învățare"
- **Subtitle**: "Întreabă-mă orice despre lecție"
- **Welcome**: "Bună! Sunt aici să te ajut să înțelegi această lecție..."

### English (`en`)
- **Title**: "Learning Assistant"
- **Subtitle**: "Ask me anything about this lesson"
- **Welcome**: "Hi! I'm here to help you understand this lesson..."

## Access Control

- **Students only**: The chatbot is only visible to users with role `"student"`
- **Lesson-specific**: Each chatbot instance is tied to a specific lesson
- **Not visible to teachers**: Teachers do not see the chatbot in any view
- **Not in dashboard**: The chatbot is only available within the lesson player

## Error Handling

- Network errors display a user-friendly error message
- Session expiration triggers a new session automatically
- Failed messages show an error state with retry option

## Future Enhancements

Potential improvements:
1. Voice input/output capabilities
2. Suggested questions based on lesson content
3. Progress tracking and study tips
4. Multi-modal responses (images, diagrams)
5. Integration with homework and quizzes
6. Analytics for teachers on common student questions

## Testing

To test the chatbot:
1. Log in as a student
2. Navigate to any lesson (from "My Lessons")
3. The chatbot will appear in the right sidebar
4. Start asking questions about the lesson content
5. The chatbot will respond with grade-appropriate answers

## Browser Compatibility

- Modern browsers with localStorage support required
- Responsive design works on desktop (lg breakpoint and above)
- Not currently optimized for mobile (hidden on small screens)

