import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '15mb' }));

// Initialize Google GenAI client if API key is present
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// AI Issue Analysis Endpoint
app.post('/api/ai/analyze-issue', async (req: Request, res: Response) => {
  const { title, description, categoryHint, location, imageBase64 } = req.body;

  if (!title && !description) {
    return res.status(400).json({ error: 'Title or description is required for analysis.' });
  }

  // Fallback heuristic generator in case AI key is missing or service unavailable
  const generateFallback = () => {
    const text = `${title} ${description}`.toLowerCase();
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    let priorityScore = 65;
    let department = 'Public Works';
    let detectedCategory = categoryHint || 'roads';
    const hazards: string[] = [];

    if (text.includes('fire') || text.includes('gas') || text.includes('explosion') || text.includes('electric shock') || text.includes('sinkhole') || text.includes('flooding') || text.includes('exposed wire')) {
      severity = 'critical';
      priorityScore = 95;
      hazards.push('Immediate Safety Risk', 'High Liability Zone');
    } else if (text.includes('traffic') || text.includes('accident') || text.includes('deep pothole') || text.includes('burst pipe') || text.includes('dark street') || text.includes('signal broken')) {
      severity = 'high';
      priorityScore = 82;
      hazards.push('Pedestrian Hazard', 'Traffic Congestion Risk');
    } else if (text.includes('trash') || text.includes('graffiti') || text.includes('litter') || text.includes('bench')) {
      severity = 'low';
      priorityScore = 38;
      hazards.push('Neighborhood Aesthetics Impact');
    }

    if (text.includes('water') || text.includes('leak') || text.includes('pipe') || text.includes('drain')) {
      department = 'Water & Sewage';
      detectedCategory = 'water';
    } else if (text.includes('light') || text.includes('electric') || text.includes('wire') || text.includes('pole')) {
      department = 'Electricity & Lighting';
      detectedCategory = 'lighting';
    } else if (text.includes('traffic') || text.includes('signal') || text.includes('sign') || text.includes('zebra')) {
      department = 'Traffic & Transit';
      detectedCategory = 'traffic';
    } else if (text.includes('trash') || text.includes('garbage') || text.includes('dump') || text.includes('waste')) {
      department = 'Sanitation & Waste';
      detectedCategory = 'sanitation';
    } else if (text.includes('park') || text.includes('tree') || text.includes('branch') || text.includes('grass')) {
      department = 'Parks & Recreation';
      detectedCategory = 'parks';
    }

    return {
      severity,
      priorityScore,
      detectedCategory,
      department,
      recommendedAction: `Dispatch inspection crew from ${department} to verify hazard level and deploy repair team.`,
      estimatedDays: severity === 'critical' ? 1 : severity === 'high' ? 3 : severity === 'medium' ? 5 : 8,
      hazards: hazards.length > 0 ? hazards : ['Minor disruption to local transit'],
      confidence: 0.88,
      summary: `Automated assessment of "${title}": classified as ${severity} priority under ${department}.`,
    };
  };

  if (!ai) {
    return res.json(generateFallback());
  }

  try {
    const prompt = `You are the CivicGuard AI Diagnostic Engine for municipal smart cities.
Analyze the following civic issue reported by a citizen:
Title: "${title || 'N/A'}"
Description: "${description || 'N/A'}"
Citizen Selected Category: "${categoryHint || 'Auto'}"
Location: "${location ? JSON.stringify(location) : 'Urban Area'}"

Evaluate the structural severity, civic risk, required municipal department, priority score from 1 (lowest) to 100 (catastrophic emergency), hazards present, estimated turnaround days, and specific recommended action.`;

    const contents: any[] = [];
    if (imageBase64 && typeof imageBase64 === 'string') {
      const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        contents.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      }
    }
    contents.push({ text: prompt });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts: contents },
      config: {
        systemInstruction: 'You are an expert municipal civil engineer and urban safety director. Always deliver structured, precise diagnostic assessments.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            severity: {
              type: Type.STRING,
              description: 'One of: low, medium, high, critical',
            },
            priorityScore: {
              type: Type.NUMBER,
              description: 'A priority score from 1 to 100',
            },
            detectedCategory: {
              type: Type.STRING,
              description: 'One of: roads, lighting, sanitation, water, traffic, parks, safety, other',
            },
            department: {
              type: Type.STRING,
              description: 'The municipal department (e.g. Public Works, Electricity & Lighting, Water & Sewage, Sanitation & Waste, Traffic & Transit, Parks & Recreation, Public Safety)',
            },
            recommendedAction: {
              type: Type.STRING,
              description: 'Immediate mitigation or field dispatch instructions',
            },
            estimatedDays: {
              type: Type.NUMBER,
              description: 'Estimated days to resolution',
            },
            hazards: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Specific hazards identified (e.g. Pedestrian Trip Danger, Structural Subsidence, Contamination)',
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence score between 0.70 and 0.99',
            },
            summary: {
              type: Type.STRING,
              description: 'Crisp 1-2 sentence executive assessment',
            },
          },
          required: [
            'severity',
            'priorityScore',
            'detectedCategory',
            'department',
            'recommendedAction',
            'estimatedDays',
            'hazards',
            'confidence',
            'summary',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json({
      severity: parsed.severity?.toLowerCase() || 'medium',
      priorityScore: Number(parsed.priorityScore) || 60,
      detectedCategory: parsed.detectedCategory?.toLowerCase() || categoryHint || 'roads',
      department: parsed.department || 'Public Works',
      recommendedAction: parsed.recommendedAction || 'Schedule municipal crew review.',
      estimatedDays: Number(parsed.estimatedDays) || 4,
      hazards: Array.isArray(parsed.hazards) ? parsed.hazards : ['General maintenance requirement'],
      confidence: Number(parsed.confidence) || 0.92,
      summary: parsed.summary || 'Incident logged and prioritized.',
    });
  } catch (error) {
    console.error('Gemini analysis failed, using robust fallback:', error);
    return res.json(generateFallback());
  }
});

// AI Citizen Assistant / Civic Help Chatbot
app.post('/api/ai/assistant-chat', async (req: Request, res: Response) => {
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  if (!ai) {
    return res.json({
      reply: `CivicGuard Advisor: Thank you for your inquiry about "${message}". For immediate emergencies (fire, gas leaks, live electric wires), please dial emergency services immediately. For standard civic maintenance, you can submit an issue with photos and GPS coordinates through the Report tab, and our automated routing will dispatch it to the appropriate municipal department.`,
    });
  }

  try {
    const formattedHistory = Array.isArray(history)
      ? history.slice(-6).map((h: any) => `${h.role === 'user' ? 'Citizen' : 'CivicGuard'}: ${h.text}`).join('\n')
      : '';

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `You are CivicGuard Advisor, an empathetic, highly knowledgeable AI civic specialist for city services.
Help citizens understand how to report issues, explain municipal SLA (Service Level Agreements), advise on community safety, and guide them through city governance.
Keep responses concise, helpful, and under 3 paragraphs with bullet points when applicable.

Previous conversation:
${formattedHistory}

Citizen: ${message}`,
      config: {
        systemInstruction: 'You are an intelligent, courteous civic assistant helping citizens resolve municipal problems efficiently.',
      },
    });

    return res.json({ reply: response.text || 'How can I assist you with city services today?' });
  } catch (err) {
    console.error('Chat error:', err);
    return res.json({
      reply: 'I am here to help you report civic issues, check municipal turnaround times, or follow up on city maintenance projects. Please select an issue from the list or file a new report.',
    });
  }
});

// Health check endpoint
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'AI CivicGuard Backend',
    geminiConfigured: !!apiKey,
    time: new Date().toISOString(),
  });
});

// Setup Vite middleware in dev or static server in prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`CivicGuard server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
