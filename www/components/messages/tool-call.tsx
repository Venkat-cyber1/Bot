import { ToolCallPart, ToolResultPart } from "ai";
import { Book, Globe, Search, Presentation } from "lucide-react";
import { Shimmer } from "../ai-elements/shimmer";

export interface ToolDisplay {
    call_label: string;
    call_icon: React.ReactNode;
    result_label: string;
    result_icon: React.ReactNode;
};

const TOOL_DISPLAY_MAP: Record<string, ToolDisplay> = {
    readNotebookLecture: { call_label: "Reading lecture notebook", call_icon: <Book className="w-4 h-4" />, result_label: "Read lecture notebook", result_icon: <Book className="w-4 h-4" /> },
    readSlideLecture: { call_label: "Reading slide lecture", call_icon: <Presentation className="w-4 h-4" />, result_label: "Read slide lecture", result_icon: <Presentation className="w-4 h-4" /> },
    readSyllabus: { call_label: "Reading syllabus", call_icon: <Book className="w-4 h-4" />, result_label: "Read syllabus", result_icon: <Book className="w-4 h-4" /> },
    readAssignment: { call_label: "Reading assignment", call_icon: <Book className="w-4 h-4" />, result_label: "Read assignment", result_icon: <Book className="w-4 h-4" /> },
    webSearch: { call_label: "Searching the web", call_icon: <Search className="w-4 h-4" />, result_label: "Searched the web", result_icon: <Search className="w-4 h-4" /> },
};

const DEFAULT_TOOL_DISPLAY: ToolDisplay = { call_label: "Searching", call_icon: <Globe className="w-4 h-4" />, result_label: "Searched", result_icon: <Globe className="w-4 h-4" /> };

function extractToolName(part: ToolCallPart | ToolResultPart): string | undefined {
    const partWithType = part as unknown as { type?: string; toolName?: string };
    if (partWithType.type && partWithType.type.startsWith("tool-")) {
        return partWithType.type.slice(5);
    }
    if (partWithType.toolName) {
        return partWithType.toolName;
    }
    if ('toolName' in part && part.toolName) {
        return part.toolName;
    }
    return undefined;
}

function formatToolArguments(toolName: string, input: unknown): string {
    try {
        if (typeof input !== 'object' || input === null) {
            return String(input);
        }

        const args = input as Record<string, unknown>;
        if (args.query) {
            return String(args.query);
        }
        if (args.hypothetical_document) {
            return String(args.hypothetical_document).slice(0, 100);
        }
        return "Arguments not available";
    } catch {
        return "Arguments not available";
    }
}

export function ToolCall({ part }: { part: ToolCallPart }) {
    const { input } = part;
    const toolName = extractToolName(part);
    const toolDisplay = toolName ? (TOOL_DISPLAY_MAP[toolName] || DEFAULT_TOOL_DISPLAY) : DEFAULT_TOOL_DISPLAY;
    const formattedArgs = formatToolArguments(toolName || "", input);

    console.log(toolName);
    console.log(toolDisplay);

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
                {toolDisplay.call_icon}
                <Shimmer duration={1}>{toolDisplay.call_label}</Shimmer>
            </div>
            <span className="text-muted-foreground/75 truncate">
                {formattedArgs}
            </span>
        </div >
    );
}

export function ToolResult({ part }: { part: ToolResultPart }) {
    const { output } = part;
    const toolName = extractToolName(part);
    const toolDisplay = toolName ? (TOOL_DISPLAY_MAP[toolName] || DEFAULT_TOOL_DISPLAY) : DEFAULT_TOOL_DISPLAY;

    return (
        <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-muted-foreground">
                {toolDisplay.result_icon}
                <span>{toolDisplay.result_label}</span>
            </div>
        </div>
    );
}   