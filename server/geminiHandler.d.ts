export declare function handleGeminiCopilotRequest(body: any): Promise<{
  success: boolean;
  fallbackRequired?: boolean;
  error?: string;
  data?: {
    reply: string;
    actionType?: string;
    proposal?: any;
    generatedWorkflow?: any;
    updatedWorkflow?: any;
    suggestedReplies?: string[];
    confidence?: number;
  };
}>;
