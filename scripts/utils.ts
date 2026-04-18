import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "fs";
import * as path from "path";

// Initialize configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY as string;

if (!GEMINI_API_KEY) {
    console.error("Missing GEMINI_API_KEY from environment.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
export const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

export async function loadTopics(): Promise<{ topics: string[]; configPath: string }> {
    const configPath = path.join(process.cwd(), "config", "topics.json");
    let topics = [
        "The engineering behind Twitter/X: transitioning from a monolith to microservices and how they handle viral hype spikes.",
    ];
    if (fs.existsSync(configPath)) {
        try {
            const configContent = fs.readFileSync(configPath, "utf8");
            const parsedConfig = JSON.parse(configContent);
            if (Array.isArray(parsedConfig.topics) && parsedConfig.topics.length > 0) {
                topics = parsedConfig.topics;
            }
        } catch {
            console.error("Failed to parse topics.json");
        }
    }
    return { topics, configPath };
}

export async function generateWithRetry(prompt: string): Promise<string> {
    const maxRetries = 5;
    let baseDelay = 15000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await model.generateContent(prompt);
            return result.response.text();
        } catch (e: unknown) {
            console.error(`Error generating content on attempt ${attempt}`);
            if (attempt === maxRetries) {
                console.error("Max retries reached. Failing.");
                return Promise.reject(e);
            }

            const errMsg = e instanceof Error ? e.message : String(e);
            const status = (e as Record<string, unknown>)?.status;
            if (
                status === 503 ||
                status === 429 ||
                errMsg.includes("503") ||
                errMsg.includes("429") ||
                errMsg.includes("high demand")
            ) {
                console.log(
                    `Service unavailable or rate limited. Retrying in ${baseDelay / 1000} seconds...`
                );
                await new Promise((resolve) => setTimeout(resolve, baseDelay));
                baseDelay *= 2;
            } else {
                return Promise.reject(e);
            }
        }
    }
    return Promise.reject(new Error("Failed to generate content"));
}
