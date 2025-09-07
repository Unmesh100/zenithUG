/**
 * Formats a Date object to IST (Indian Standard Time) and UTC in brackets.
 * Example output: "07/09/2025, 18:30:00 (UTC: 2025-09-07 13:00:00 UTC)"
 */ 
export function formatTimeISTWithUTC(date: Date): string {
    // Format IST
    const istString = date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
    });

    // Format UTC
    const utcDate = new Date(date.getTime());
    const pad = (n: number) => n.toString().padStart(2, '0');
    const utcString = `${utcDate.getUTCFullYear()}-${pad(utcDate.getUTCMonth() + 1)}-${pad(utcDate.getUTCDate())} ${pad(utcDate.getUTCHours())}:${pad(utcDate.getUTCMinutes())}:${pad(utcDate.getUTCSeconds())} UTC`;

    return `${istString} (UTC: ${utcString})`;
}
export const openUrlTool = tool(
    async (params) => {
        const { url, browser } = params as { url: string; browser?: string };
        try {
            // Use macOS 'open' command to launch the URL in the specified browser
            const { exec } = await import('child_process');
            let openCmd = '';
            if (browser) {
                let browserApp = browser.trim().toLowerCase();
                if (browserApp === 'chrome' || browserApp === 'google chrome') {
                    browserApp = 'Google Chrome';
                } else if (browserApp === 'safari') {
                    browserApp = 'Safari';
                } else if (browserApp === 'firefox' || browserApp === 'mozilla firefox') {
                    browserApp = 'Firefox';
                } else if (browserApp === 'edge' || browserApp === 'microsoft edge') {
                    browserApp = 'Microsoft Edge';
                } else {
                    // Capitalize first letter for generic browser names
                    browserApp = browser.charAt(0).toUpperCase() + browser.slice(1);
                }
                openCmd = `open -a \"${browserApp}\" \"${url}\"`;
            } else {
                openCmd = `open \"${url}\"`;
            }
            return new Promise((resolve) => {
                exec(openCmd, (error) => {
                    if (error) {
                        resolve(`Error opening URL: ${error.message}`);
                    } else {
                        resolve(`URL opened in ${browser ? browser : 'default browser'}.`);
                    }
                });
            });
        } catch (err) {
            return `Error opening URL: ${err}`;
        }
    },
    {
        name: 'open-url',
        description: 'Open a URL in the specified web browser (Chrome or default).',
        schema: z.object({
            url: z.string().describe('The URL to open.'),
            browser: z.string().optional().describe('Browser to use (e.g., "chrome").'),
        }),
    }
);
export const weatherTool = tool(
    async (params) => {
        const { city } = params as { city: string };
        try {
            const res = await fetch(`https://wttr.in/${encodeURIComponent(city)}?format=3`);
            const data = await res.text();
            return data;
        } catch (err) {
            return `Weather API failed: ${err}`;
        }
    },
    {
        name: 'get-weather',
        description: 'Get current weather for a city.',
        schema: z.object({
            city: z.string().describe('City name.'),
        }),
    }
);
// --- Advanced Automation Agent Additions ---
// Internal async functions for automation
const runShellCommand = async (command: string) => {
    return new Promise((resolve) => {
        exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
            if (error) {
                resolve(`Error: ${error.message}`);
            } else if (stderr) {
                resolve(`Stderr: ${stderr}`);
            } else {
                resolve(stdout);
            }
        });
    });
};

const readFile = async (filePath: string) => {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return data;
    } catch (err) {
        return `Error reading file: ${err}`;
    }
};

const writeFile = async (filePath: string, content: string) => {
    try {
        await fs.writeFile(filePath, content, 'utf-8');
        return 'File written successfully.';
    } catch (err) {
        return `Error writing file: ${err}`;
    }
};

const listDir = async (dirPath: string) => {
    try {
        const files = await fs.readdir(dirPath);
        return JSON.stringify(files);
    } catch (err) {
        return `Error listing directory: ${err}`;
    }
};

// Command interface for automation
export const automationAgent = async (params: { type: string; [key: string]: any }) => {
    switch (params.type) {
        case 'git-commit':
            return await runShellCommand('git commit -am "Auto commit"');
        case 'git-push':
            return await runShellCommand('git push');
        case 'git-pull':
            return await runShellCommand('git pull');
        case 'git-clone':
            return await runShellCommand(`git clone ${params.repoUrl}`);
        case 'run-script':
            return await runShellCommand(params.command);
        case 'list-files':
            return await listDir(params.dirPath);
        case 'read-file':
            return await readFile(params.filePath);
        case 'write-file':
            return await writeFile(params.filePath, params.content);
        case 'format-code':
            return await runShellCommand(params.command || 'bun run format');
        case 'lint-code':
            return await runShellCommand(params.command || 'bun run lint');
        case 'run-tests':
            return await runShellCommand(params.command || 'bun test');
        case 'install-dependencies':
            return await runShellCommand(params.command || 'bun install');
        case 'setup-project':
            return await runShellCommand(params.command || 'bun init');
        case 'build-project':
            return await runShellCommand(params.command || 'bun run build');
        case 'deploy-project':
            return await runShellCommand(params.command || 'bun run deploy');
        // Add more automation cases as needed
        default:
            return 'Unknown automation type.';
    }
};
// --- End Advanced Automation Agent Additions ---

export const newsTool = tool(
    async (params) => {
        const { topic } = params as { topic: string };
        try {
            const res = await fetch(`https://newsapi.org/v2/everything?q=${encodeURIComponent(topic)}&apiKey=YOUR_NEWSAPI_KEY`);
            const data = await res.json() as { articles?: any[] };
            return JSON.stringify(data.articles?.slice(0, 3) || []);
        } catch (err) {
            return `News API failed: ${err}`;
        }
    },
    {
        name: 'get-news',
        description: 'Get latest news articles for a topic.',
        schema: z.object({
            topic: z.string().describe('News topic.'),
        }),
    }
);
export const httpRequestTool = tool(
    async (params) => {
        const { url, method = 'GET', body } = params as { url: string; method?: string; body?: any };
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: method === 'POST' ? JSON.stringify(body) : undefined,
            });
            const data = await res.text();
            return data;
        } catch (err) {
            return `HTTP request failed: ${err}`;
        }
    },
    {
        name: 'http-request',
        description: 'Perform a generic HTTP request (GET/POST) to any API or website.',
        schema: z.object({
            url: z.string().describe('URL to request.'),
            method: z.string().optional().describe('HTTP method (GET, POST, etc.).'),
            body: z.any().optional().describe('Request body for POST.'),
        }),
    }
);
import { exec } from 'child_process';

export const shellCommandTool = tool(
    async (params) => {
        const { command } = params as { command: string };
        return new Promise((resolve) => {
            exec(command, { timeout: 10000 }, (error, stdout, stderr) => {
                if (error) {
                    resolve(`Error: ${error.message}`);
                } else if (stderr) {
                    resolve(`Stderr: ${stderr}`);
                } else {
                    resolve(stdout);
                }
            });
        });
    },
    {
        name: 'run-shell-command',
        description: 'Run a shell command on the local system.',
        schema: z.object({
            command: z.string().describe('Shell command to execute.'),
        }),
    }
);
import fs from 'fs/promises';
import path from 'path';

export const readFileTool = tool(
    async (params) => {
        const { filePath } = params as { filePath: string };
        try {
            const data = await fs.readFile(filePath, 'utf-8');
            return data;
        } catch (err) {
            return `Error reading file: ${err}`;
        }
    },
    {
        name: 'read-file',
        description: 'Read the contents of a local file.',
        schema: z.object({
            filePath: z.string().describe('Absolute path to the file.'),
        }),
    }
);

export const writeFileTool = tool(
    async (params) => {
        const { filePath, content } = params as { filePath: string; content: string };
        try {
            await fs.writeFile(filePath, content, 'utf-8');
            return 'File written successfully.';
        } catch (err) {
            return `Error writing file: ${err}`;
        }
    },
    {
        name: 'write-file',
        description: 'Write content to a local file.',
        schema: z.object({
            filePath: z.string().describe('Absolute path to the file.'),
            content: z.string().describe('Content to write.'),
        }),
    }
);

export const listDirTool = tool(
    async (params) => {
        const { dirPath } = params as { dirPath: string };
        try {
            const files = await fs.readdir(dirPath);
            return JSON.stringify(files);
        } catch (err) {
            return `Error listing directory: ${err}`;
        }
    },
    {
        name: 'list-directory',
        description: 'List files and folders in a directory.',
        schema: z.object({
            dirPath: z.string().describe('Absolute path to the directory.'),
        }),
    }
);

export const gitCommitTool = tool(
    async () => {
        return new Promise((resolve) => {
            exec('git commit -am "Auto commit"', { timeout: 10000 }, (error, stdout, stderr) => {
                if (error) {
                    resolve(`Error: ${error.message}`);
                } else if (stderr) {
                    resolve(`Stderr: ${stderr}`);
                } else {
                    resolve(stdout);
                }
            });
        });
    },
    {
        name: 'git-commit',
        description: 'Commit all staged changes with a default message.',
        schema: z.object({}).optional(),
    }
);

export const gitPushTool = tool(
    async () => {
        return new Promise((resolve) => {
            exec('git push', { timeout: 10000 }, (error, stdout, stderr) => {
                if (error) {
                    resolve(`Error: ${error.message}`);
                } else if (stderr) {
                    resolve(`Stderr: ${stderr}`);
                } else {
                    resolve(stdout);
                }
            });
        });
    },
    {
        name: 'git-push',
        description: 'Push committed changes to the remote repository.',
        schema: z.object({}).optional(),
    }
);

export const gitStatusTool = tool(
    async () => {
        return new Promise((resolve) => {
            exec('git status', { timeout: 10000 }, (error, stdout, stderr) => {
                if (error) {
                    resolve(`Error: ${error.message}`);
                } else if (stderr) {
                    resolve(`Stderr: ${stderr}`);
                } else {
                    resolve(stdout);
                }
            });
        });
    },
    {
        name: 'git-status',
        description: 'Show the current git status.',
        schema: z.object({}).optional(),
    }
);

export const gitPullTool = tool(
    async () => {
        return new Promise((resolve) => {
            exec('git pull', { timeout: 10000 }, (error, stdout, stderr) => {
                if (error) {
                    resolve(`Error: ${error.message}`);
                } else if (stderr) {
                    resolve(`Stderr: ${stderr}`);
                } else {
                    resolve(stdout);
                }
            });
        });
    },
    {
        name: 'git-pull',
        description: 'Pull the latest changes from the remote repository.',
        schema: z.object({}).optional(),
    }
);

export const gitCloneTool = tool(
    async (params) => {
        const { repoUrl } = params as { repoUrl: string };
        return new Promise((resolve) => {
            exec(`git clone ${repoUrl}`, { timeout: 20000 }, (error, stdout, stderr) => {
                if (error) {
                    resolve(`Error: ${error.message}`);
                } else if (stderr) {
                    resolve(`Stderr: ${stderr}`);
                } else {
                    resolve(stdout);
                }
            });
        });
    },
    {
        name: 'git-clone',
        description: 'Clone a git repository from a given URL.',
        schema: z.object({
            repoUrl: z.string().describe('Repository URL to clone.'),
        }),
    }
);

export const gitLogTool = tool(
    async () => {
        return new Promise((resolve) => {
            exec('git log --oneline -n 10', { timeout: 10000 }, (error, stdout, stderr) => {
                if (error) {
                    resolve(`Error: ${error.message}`);
                } else if (stderr) {
                    resolve(`Stderr: ${stderr}`);
                } else {
                    resolve(stdout);
                }
            });
        });
    },
    {
        name: 'git-log',
        description: 'Show the last 10 git commit logs (oneline).',
        schema: z.object({}).optional(),
    }
);

export const gitAddTool = tool(
    async () => {
        return new Promise((resolve) => {
            exec('git add .', { timeout: 10000 }, (error, stdout, stderr) => {
                if (error) {
                    resolve(`Error: ${error.message}`);
                } else if (stderr) {
                    resolve(`Stderr: ${stderr}`);
                } else {
                    resolve(stdout || 'All changes staged.');
                }
            });
        });
    },
    {
        name: 'git-add',
        description: 'Stage all changes for commit.',
        schema: z.object({}).optional(),
    }
);

export const gitBranchTool = tool(
    async () => {
        return new Promise((resolve) => {
            exec('git branch', { timeout: 10000 }, (error, stdout, stderr) => {
                if (error) {
                    resolve(`Error: ${error.message}`);
                } else if (stderr) {
                    resolve(`Stderr: ${stderr}`);
                } else {
                    resolve(stdout);
                }
            });
        });
    },
    {
        name: 'git-branch',
        description: 'List all local git branches.',
        schema: z.object({}).optional(),
    }
);

export const gitCheckoutTool = tool(
    async (params) => {
        const { branch } = params as { branch: string };
        return new Promise((resolve) => {
            exec(`git checkout ${branch}`, { timeout: 10000 }, (error, stdout, stderr) => {
                if (error) {
                    resolve(`Error: ${error.message}`);
                } else if (stderr) {
                    resolve(`Stderr: ${stderr}`);
                } else {
                    resolve(stdout);
                }
            });
        });
    },
    {
        name: 'git-checkout',
        description: 'Switch to a different git branch.',
        schema: z.object({
            branch: z.string().describe('Branch name to checkout.'),
        }),
    }
);

export const searchFilesTool = tool(
    async (params) => {
        const { dirPath, pattern } = params as { dirPath: string; pattern: string };
        try {
            const files = await fs.readdir(dirPath);
            const matched = files.filter((f) => f.includes(pattern));
            return JSON.stringify(matched);
        } catch (err) {
            return `Error searching files: ${err}`;
        }
    },
    {
        name: 'search-files',
        description: 'Search for files in a directory by pattern.',
        schema: z.object({
            dirPath: z.string().describe('Absolute path to the directory.'),
            pattern: z.string().describe('Pattern to search for.'),
        }),
    }
);
export const webSearchTool = tool(
    async (params) => {
        const { query } = params as { query: string };
        // Simple web search using DuckDuckGo Instant Answer API
        try {
            const res = await fetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json`);
            const data = await res.json() as { AbstractText?: string };
            return data.AbstractText || 'No relevant results found.';
        } catch (err) {
            console.log('ERROR', err);
            return 'Web search failed.';
        }
    },
    {
        name: 'web-search',
        description: 'Perform a web search for information.',
        schema: z.object({
            query: z.string().describe('The search query.'),
        }),
    }
);
export const getContactsTool = tool(
    async () => {
        // TODO: Integrate with Google People API or other contact source
        // For now, return mock contacts
        const contacts = [
            { name: 'Unmesh', email: 'unmesh.py@gmail.com' },
            { name: 'Bubun', email: 'unmesh.js@gmail.com' },
        ];
        return JSON.stringify(contacts);
    },
    {
        name: 'get-contacts',
        description: 'Fetch the user contacts/emails.',
        schema: z.object({}),
    }
);
export const cancelEventTool = tool(
    async (params) => {
        const { eventId } = params as { eventId: string };
        try {
            const response = await calendar.events.delete({
                calendarId: 'primary',
                eventId,
            });
            if (response.status === 204) {
                return 'The event has been cancelled.';
            }
            return "Couldn't cancel the event.";
        } catch (err) {
            console.log('ERROR', err);
            return 'Failed to cancel the event.';
        }
    },
    {
        name: 'cancel-event',
        description: 'Call to cancel/delete a calendar event by event ID.',
        schema: z.object({
            eventId: z.string().describe('The ID of the event to cancel.'),
        }),
    }
);
import { tool } from '@langchain/core/tools';
import { google } from 'googleapis';
import z from 'zod';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URL
);

oauth2Client.setCredentials({
    access_token: process.env.GOOGLE_ACCESS_TOKEN,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

type Params = {
    q: string;
    timeMin: string;
    timeMax: string;
};
export const getEventsTool = tool(
    async (params) => {
        /**
         * timeMin
         * timeMax
         * q
         */
        const { q, timeMin, timeMax } = params as Params;

        try {
            const response = await calendar.events.list({
                calendarId: 'primary',
                q: q,
                timeMin,
                timeMax,
            });

            const result = response.data.items?.map((event) => {
                return {
                    id: event.id,
                    summary: event.summary,
                    status: event.status,
                    organiser: event.organizer,
                    start: event.start,
                    end: event.end,
                    attendees: event.attendees,
                    meetingLink: event.hangoutLink,
                    eventType: event.eventType,
                };
            });

            return JSON.stringify(result);
        } catch (err) {
            console.log('ERROR', err);
        }

        return 'Failed to connect to the calendar.';
    },
    {
        name: 'get-events',
        description: 'Call to get the calendar events.',
        schema: z.object({
            q: z
                .string()
                .describe(
                    "The query to be used to get events from google calendar. It can be one of these values: summary, description, location, attendees display name, attendees email, organiser's name, organiser's email"
                ),
            timeMin: z.string().describe('The from datetime to get events.'),
            timeMax: z.string().describe('The to datetime to get events.'),
        }),
    }
);

type attendee = {
    email: string;
    displayName: string;
};
const createEventSchema = z.object({
    summary: z.string().describe('The title of the event'),
    start: z.object({
        dateTime: z.string().describe('The date time of start of the event.'),
        timeZone: z.string().describe('Current IANA timezone string.'),
    }),
    end: z.object({
        dateTime: z.string().describe('The date time of end of the event.'),
        timeZone: z.string().describe('Current IANA timezone string.'),
    }),
    attendees: z.array(
        z.object({
            email: z.string().describe('The email of the attendee'),
            displayName: z.string().describe('Then name of the attendee.'),
        })
    ),
});

type EventData = z.infer<typeof createEventSchema>;
// type EventData = {
//     summary: string;
//     start: {
//         dateTime: string;
//         timeZone: string;
//     };
//     end: {
//         dateTime: string;
//         timeZone: string;
//     };
//     attendees: attendee[];
// };
export const createEventTool = tool(
    async (eventData) => {
        const { summary, start, end, attendees } = eventData as EventData;

        const response = await calendar.events.insert({
            calendarId: 'bubunghosh1214@gmail.com',
            sendUpdates: 'all',
            conferenceDataVersion: 1,
            requestBody: {
                summary,
                start,
                end,
                attendees,
                conferenceData: {
                    createRequest: {
                        requestId: crypto.randomUUID(),
                        conferenceSolutionKey: {
                            type: 'hangoutsMeet',
                        },
                    },
                },
            },
        });

        if (response.statusText === 'OK') {
            return 'The meeting has been created.';
        }

        return "Couldn't create a meeting.";
    },
    {
        name: 'create-event',
        description: 'Call to create the calendar events.',
        schema: createEventSchema,
    }
);