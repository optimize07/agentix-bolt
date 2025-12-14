export const getResultText = (result: any): string => {
  if (!result) return "";
  let text: string;

  if (typeof result === "string") {
    text = result;
  } else if (result.error) {
    text = typeof result.error === "string" ? result.error : JSON.stringify(result.error, null, 2);
  } else if (result.output) {
    text = typeof result.output === "string" ? result.output : JSON.stringify(result.output, null, 2);
  } else if (result.result) {
    text = typeof result.result === "string" ? result.result : JSON.stringify(result.result, null, 2);
  } else if (result.raw) {
    text = result.raw;
  } else {
    text = JSON.stringify(result, null, 2);
  }

  if (result.threadId) {
    return `${text}\n\nThread: ${result.threadId}`;
  }

  return text;
};


