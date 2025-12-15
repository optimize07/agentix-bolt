type Message = { role: "user" | "assistant"; content: string };

export async function streamChat({
  messages,
  context,
  onDelta,
  onToolCall,
  onDone,
  onError,
}: {
  messages: Message[];
  context?: any;
  onDelta: (deltaText: string) => void;
  onToolCall?: (toolCall: any) => void;
  onDone: () => void;
  onError?: (error: string) => void;
}) {
  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

  try {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, context }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      const errorMessage = errorData.error || `Request failed with status ${resp.status}`;
      
      if (resp.status === 429) {
        onError?.("Rate limit exceeded. Please try again later.");
      } else if (resp.status === 402) {
        onError?.("Payment required. Please add credits to your workspace.");
      } else {
        onError?.(errorMessage);
      }
      return;
    }

    if (!resp.body) {
      onError?.("No response body");
      return;
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let streamDone = false;
    
    // Track tool calls being built across chunks
    const pendingToolCalls = new Map<number, { name?: string; arguments: string }>();

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;
      textBuffer += decoder.decode(value, { stream: true });

      // Process line-by-line as data arrives
      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":") || line.trim() === "") continue;
        if (!line.startsWith("data: ")) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          
          // Handle text content
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            onDelta(content);
          }

          // Handle tool calls - accumulate across chunks
          const toolCalls = parsed.choices?.[0]?.delta?.tool_calls;
          if (toolCalls && toolCalls.length > 0) {
            for (const toolCall of toolCalls) {
              const index = toolCall.index ?? 0;
              const existing = pendingToolCalls.get(index) || { arguments: '' };
              
              // Accumulate name (comes first)
              if (toolCall.function?.name) {
                existing.name = toolCall.function.name;
                console.log(`[Tool Call] Received name: ${toolCall.function.name}`);
              }
              
              // Accumulate arguments (comes in chunks)
              if (toolCall.function?.arguments) {
                existing.arguments += toolCall.function.arguments;
                console.log(`[Tool Call] Accumulated arguments chunk (total length: ${existing.arguments.length})`);
              }
              
              pendingToolCalls.set(index, existing);
            }
          }

          // Check for finish_reason to finalize tool calls
          const finishReason = parsed.choices?.[0]?.finish_reason;
          if (finishReason === 'tool_calls' && onToolCall) {
            console.log(`[Tool Call] Finalizing ${pendingToolCalls.size} tool calls`);
            for (const [_, toolCall] of pendingToolCalls) {
              if (toolCall.name && toolCall.arguments) {
                try {
                  console.log(`[Tool Call] Complete data:`, { name: toolCall.name, arguments: toolCall.arguments });
                  const args = JSON.parse(toolCall.arguments);
                  onToolCall({
                    name: toolCall.name,
                    arguments: args
                  });
                  console.log(`[Tool Call] Successfully parsed and invoked: ${toolCall.name}`);
                } catch (e) {
                  console.error("[Tool Call] Error parsing arguments:", e, toolCall.arguments);
                }
              }
            }
            pendingToolCalls.clear();
          }
        } catch (e) {
          // Incomplete JSON split across chunks: put it back and wait for more data
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }

    // Final flush in case remaining buffered lines arrived without trailing newline
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split("\n")) {
        if (!raw) continue;
        if (raw.endsWith("\r")) raw = raw.slice(0, -1);
        if (raw.startsWith(":") || raw.trim() === "") continue;
        if (!raw.startsWith("data: ")) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === "[DONE]") continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          /* ignore partial leftovers */
        }
      }
    }

    onDone();
  } catch (error) {
    console.error("Stream error:", error);
    onError?.(error instanceof Error ? error.message : "Unknown error");
  }
}
