import OpenAI from 'openai';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';

// Use environment variables or rely on workflow secrets
const OPENAI_API_KEY = process.env.OPENAI_API_KEY as string;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY as string;
const TWILIO_SID = process.env.TWILIO_SID as string;
const TWILIO_AUTH = process.env.TWILIO_AUTH as string;

const FROM_EMAIL = process.env.FROM_EMAIL || "YOUR_VERIFIED_EMAIL";
const TO_EMAIL = process.env.TO_EMAIL || "YOUR_EMAIL";
const FROM_PHONE = process.env.FROM_PHONE || "TWILIO_NUMBER";
const TO_PHONE = process.env.TO_PHONE || "YOUR_PHONE";

if (!OPENAI_API_KEY || !SENDGRID_API_KEY || !TWILIO_SID || !TWILIO_AUTH) {
    console.error("Missing necessary initial setup keys from environment.");
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY || '' });
if (SENDGRID_API_KEY) {
    sgMail.setApiKey(SENDGRID_API_KEY);
}
const twilioClient = twilio(TWILIO_SID || '', TWILIO_AUTH || '');

async function generateContent(): Promise<string> {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: "You are an industry-leading expert, researcher, and seasoned senior architect. Your goal is to write a comprehensive, thesis-level deep dive on a specific advanced technology topic."
                },
                {
                    role: "user",
                    content: `
Write a complete and highly professional thesis on a topic related to distributed systems, backend architectures, or modern infrastructure. 
The content must be extraordinarily detailed, meticulously researched, and provide enough depth to take approximately 20 to 35 minutes to read (around 4000 to 6000 words).
Structure the thesis professionally with:
- An Abstract / Executive Summary
- In-depth Introductions and Historical Context
- Core Architectural Principles
- Detailed Trade-offs, Benchmarks, and Case Studies
- Advanced Best Practices and Future Trends
- A Strong Conclusion

Do not generate a short summary. Generate the full, rigorous paper. Use markdown formatting.
`
                }
            ],
            max_tokens: 10000,
            temperature: 0.5,
        });
        return response.choices[0].message.content || "No learning generated.";
    } catch (e) {
        console.error("Error generating content", e);
        return "Daily Learning Unavailabe: Error generating content.";
    }
}

async function sendEmail(content: string) {
    if (TO_EMAIL === "YOUR_EMAIL" || FROM_EMAIL === "YOUR_VERIFIED_EMAIL") {
        console.log("Email addresses not configured. Skipping email.");
        return;
    }
    await sgMail.send({
        to: TO_EMAIL,
        from: FROM_EMAIL,
        subject: `Daily Learning: ${new Date().toLocaleDateString()}`,
        text: content,
    });
}

async function sendSMS() {
    if (TO_PHONE === "YOUR_PHONE" || FROM_PHONE === "TWILIO_NUMBER") {
        console.log("Phone numbers not configured. Skipping SMS.");
        return;
    }
    await twilioClient.messages.create({
        body: "Your Daily Learning is ready. Check your email.",
        from: FROM_PHONE,
        to: TO_PHONE
    });
}

async function run() {
    const content = await generateContent();
    console.log(content);
    
    try {
        await Promise.all([
            sendEmail(content),
            sendSMS()
        ]);
        console.log("Daily learning workflow completed.");
    } catch (e) {
        console.error("Failed sending communications", e);
        process.exit(1);
    }
}

run();