import { handleSSEStream } from "@/lib/search/streamingUtils";
import {
  AnswerPiecePacket,
  DocumentInfoPacket,
  StreamStopInfo,
} from "@/lib/search/interfaces";

// Packet types that we expect from the streaming response
export type PacketType =
  | AnswerPiecePacket
  | DocumentInfoPacket
  | StreamStopInfo;

// Create a chat session with the legal assistant (persona_id: 2)
export async function createChatSession(
  personaId: number,
  description: string | null
): Promise<string> {
  const response = await fetch("/api/chat/create-chat-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      persona_id: personaId,
      description,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create chat session - ${response.status}`);
  }

  const responseJson = await response.json();
  return responseJson.chat_session_id;
}

// Update the LLM model for the chat session
export async function updateLlmOverrideForChatSession(
  chatSessionId: string,
  newAlternateModel: string
) {
  const response = await fetch("/api/chat/update-chat-session-model", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_session_id: chatSessionId,
      new_alternate_model: newAlternateModel,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update chat session model - ${response.status}`);
  }

  return response;
}

// Send a message and get streaming response
export async function* sendMessage(
  chatSessionId: string,
  message: string,
  alternateAssistantId: number,
  signal?: AbortSignal
): AsyncGenerator<PacketType, void, unknown> {
  const body = JSON.stringify({
    alternate_assistant_id: alternateAssistantId,
    chat_session_id: chatSessionId,
    parent_message_id: null,
    message: message,
    prompt_id: null,
    search_doc_ids: null,
    file_descriptors: [],
    user_file_ids: [],
    user_folder_ids: [],
    regenerate: false,
    retrieval_options: {
      run_search: "auto",
      real_time: true,
      filters: {
        source_type: null,
        document_set: null,
        time_cutoff: null,
        tags: [],
        user_file_ids: [],
      },
    },
    prompt_override: null,
    llm_override: {
      model_provider: "Default",
      model_version: "gpt-4o",
    },
    use_agentic_search: false,
  });

  const response = await fetch("/api/chat/send-message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body,
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  yield* handleSSEStream<PacketType>(response, signal);
}

// Main function to handle the complete case matching flow
export async function submitCaseQuery(
  message: string,
  signal?: AbortSignal
): Promise<AsyncGenerator<PacketType, void, unknown>> {
  // Step 1: Create a chat session with the legal assistant (persona_id: 1) Email Classifier
  const chatSessionId = await createChatSession(1, null);

  // Step 2: Update the model to default
  await updateLlmOverrideForChatSession(
    chatSessionId,
    "Default__openai__gpt-4o"
  );

  // Step 3: Send message and return streaming response
  return sendMessage(chatSessionId, message, 1, signal);
}

// Submit detailed case query using persona 2 (no LLM override)
export async function submitDetailedCaseQuery(
  message: string,
  signal?: AbortSignal
): Promise<AsyncGenerator<PacketType, void, unknown>> {
  
  // Step 1: Create a chat session with persona 2 (legal assistant)
  const chatSessionId = await createChatSession(2, null);

  // Step 2: No LLM override - use default model for persona 2

  // Step 3: Send message and return streaming response
  return sendMessage(chatSessionId, message, 2, signal);
}

// Two-stage case processing function
export async function submitTwoStageCaseQuery(
  message: string,
  signal?: AbortSignal
): Promise<{
  categorizationResponse: AsyncGenerator<PacketType, void, unknown>;
  checkForCaseInquiry: (response: string) => boolean;
  submitDetailedQuery: () => Promise<AsyncGenerator<PacketType, void, unknown>>;
}> {
  // First stage: Get categorization from persona 1
  const categorizationResponse = await submitCaseQuery(message, signal);
  
  // Function to check if response contains "case_inquiry"
  const checkForCaseInquiry = (response: string): boolean => {
    return response.toLowerCase().includes("case_inquiry");
  };
  
  // Function to submit detailed query if needed
  const submitDetailedQuery = async (): Promise<AsyncGenerator<PacketType, void, unknown>> => {
    return await submitDetailedCaseQuery(message, signal);
  };
  
  return {
    categorizationResponse,
    checkForCaseInquiry,
    submitDetailedQuery
  };
}
