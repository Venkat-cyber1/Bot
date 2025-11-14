import { ReasoningUIPart } from "ai";
import { Reasoning } from "../ai-elements/reasoning";
import { ReasoningTrigger } from "../ai-elements/reasoning";
import { ReasoningContent } from "../ai-elements/reasoning";

export function ReasoningPart({ part, isStreaming = false }: { part: ReasoningUIPart; isStreaming?: boolean }) {
    return <Reasoning isStreaming={isStreaming} className="mb-0">
        <ReasoningTrigger />
        {part.text && <ReasoningContent>
            {part.text}
        </ReasoningContent>}
    </Reasoning>;
}