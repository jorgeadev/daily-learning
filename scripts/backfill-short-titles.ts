import * as fs from "fs";
import * as path from "path";
import { generateWithRetry } from "./utils";

async function run() {
    const rootDir = process.cwd();
    const blogDir = path.join(rootDir, "web", "src", "content", "blog");
    const files = fs.readdirSync(blogDir).filter((f) => f.endsWith(".md"));

    console.log(`Found ${files.length} markdown articles. Checking for missing short titles...`);

    for (let i = 0; i < files.length; i++) {
        const fileName = files[i];
        const filePath = path.join(blogDir, fileName);
        const content = fs.readFileSync(filePath, "utf8");

        if (content.includes("\nshortTitle: ") || content.includes("\r\nshortTitle: ")) {
            console.log(
                `[${i + 1}/${files.length}] Skipping ${fileName} - shortTitle already exists.`
            );
            continue;
        }

        console.log(`[${i + 1}/${files.length}] Processing ${fileName} to backfill shortTitle...`);

        const titleMatch =
            content.match(/^title:\s*"(.*)"\s*$/m) || content.match(/^title:\s*(.*)\s*$/m);
        const originalTitle = titleMatch ? titleMatch[1] : fileName;

        try {
            console.log("   -> Generating short title with AI...");
            const shortTitleRaw = await generateWithRetry(
                `Summarize this title into a short, impactful version (maximum 40 characters) that summarizes the core topic. Do not use markdown, quotes, emojis, or conversational text. Output ONLY the short title. Original Title: "${originalTitle}"`
            );
            const shortTitle = shortTitleRaw.replace(/"/g, "\\\"").replace(/\n/g, "").trim();

            const newContent = content.replace(
                /^title:\s*.*$/m,
                `$& \nshortTitle: "${shortTitle}"`
            );

            fs.writeFileSync(filePath, newContent, "utf8");
            console.log(`   -> Inserted shortTitle: ${shortTitle}`);

            await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (e) {
            console.error(`Fatal error processing ${fileName}:`, e);
        }
    }

    console.log("\nFinished backfilling shortTitles!");
}

run();
