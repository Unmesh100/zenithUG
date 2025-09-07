import readline from 'node:readline/promises';
import { ChatGroq } from '@langchain/groq';
import { createEventTool, getEventsTool, cancelEventTool, getContactsTool, webSearchTool, readFileTool, writeFileTool, listDirTool, searchFilesTool, shellCommandTool, httpRequestTool, weatherTool, newsTool, gitCommitTool, gitPushTool, gitStatusTool, gitPullTool, gitCloneTool, gitLogTool, gitAddTool, gitBranchTool, gitCheckoutTool } from './tools';
import { openUrlTool } from './tools';
import { END, MemorySaver, MessagesAnnotation, StateGraph } from '@langchain/langgraph';
import { ToolNode } from '@langchain/langgraph/prebuilt';
import type { AIMessage } from '@langchain/core/messages';

const tools = [
    createEventTool,
    getEventsTool,
    cancelEventTool,
    getContactsTool,
    webSearchTool,
    readFileTool,
    writeFileTool,
    listDirTool,
    searchFilesTool,
    shellCommandTool,
    httpRequestTool,
    weatherTool,
    newsTool,
    openUrlTool,
    gitCommitTool,
    gitPushTool,
    gitStatusTool,
    gitPullTool,
    gitCloneTool,
    gitLogTool,
    gitAddTool,
    gitBranchTool,
    gitCheckoutTool
];

const model = new ChatGroq({
    model: 'openai/gpt-oss-120b',
    temperature: 0,
}).bindTools(tools);

/**
 * Assistant node
 */
async function callModel(state: typeof MessagesAnnotation.State) {
    // Limit messages to last 10 to avoid context length exceeded errors
    const limitedMessages = state.messages.slice(-10);
    const response = await model.invoke(limitedMessages);
    return { messages: [response] };
}

/**
 * Tool node
 */
const toolNode = new ToolNode(tools);

/**
 * Conditional Edge
 */
function shouldContinue(state: typeof MessagesAnnotation.State) {
    const lastMessage = state.messages[state.messages.length - 1] as AIMessage;
    // console.log('Last message', lastMessage);

    if (lastMessage.tool_calls?.length) {
        return 'tools';
    }

    return '__end__';
}

/**
 * Build the graph
 */
const graph = new StateGraph(MessagesAnnotation)
    .addNode('assistant', callModel)
    .addNode('tools', toolNode)
    .addEdge('__start__', 'assistant')
    .addEdge('tools', 'assistant')
    .addConditionalEdges('assistant', shouldContinue, {
        __end__: END,
        tools: 'tools',
    });

const checkpointer = new MemorySaver();

const app = graph.compile({ checkpointer });

async function main() {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    let config = { configurable: { thread_id: '1' } };

    while (true) {
        const userInput = await rl.question('You: ');
        if (userInput === '/bye') {
            break;
        }

        const currentDateTime = new Date().toLocaleString('sv-SE').replace(' ', 'T');
        const timeZoneString = Intl.DateTimeFormat().resolvedOptions().timeZone;

        const result = await app.invoke(
            {
                messages: [
                    {  
                        role: 'system',
                        content: `You are F.R.I.D.A.Y. , a hyper-intelligent AI assistant inspired by Iron Man. You have full access to the user's local system (files, directories, shell commands), the internet (web search, APIs, scraping), and external services (calendar, contacts, mail, weather, news, automation). You proactively assist, automate tasks, and provide context-aware suggestions. Always use the most efficient tool, ask clarifying questions if needed, and ensure user privacy and security. 
                        Current datetime: ${currentDateTime}
                        Current timezone string: ${timeZoneString}`,
                    },
                    {
                        role: 'user',
                        content: userInput,
                    },
                ],
            },
            config
        );
          console.log('AI: ', result.messages?.[result.messages.length - 1]?.content ?? 'No content available');

    }

    rl.close();
}

main();