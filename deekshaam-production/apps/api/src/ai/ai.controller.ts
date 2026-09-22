import { Request, Response } from 'express';
import { memoryDb } from '../database/client';
import { config } from '../config';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Provider Adapter Interface
export interface AIProviderAdapter {
  generateResponse(prompt: string, context: string): Promise<string>;
}

// Local Knowledge Provider implementation (Safe, predictable, zero external dependencies)
class LocalKnowledgeProvider implements AIProviderAdapter {
  async generateResponse(question: string, context: string): Promise<string> {
    const q = question.toLowerCase();

    // Check against programs
    const mentionedProg = memoryDb.programs.find(
      (p) => q.includes(p.slug) || q.includes(p.code.toLowerCase()) || q.includes(p.title.toLowerCase())
    );

    if (q.includes('eligib') || q.includes('qualif') || q.includes('criteria')) {
      if (mentionedProg) {
        return `For ${mentionedProg.code} (${mentionedProg.title}): ${mentionedProg.eligibility}. Admissions staff can confirm any intake-specific requirements.`;
      }
      return 'The undergraduate degree programs (BBA, BCA, B.Com) require 10+2 from a recognized board with minimum 50% aggregate (45% for SC/ST/OBC candidates). You can review details on each program page.';
    }

    if (q.includes('hostel') || q.includes('stay') || q.includes('accommodation') || q.includes('room')) {
      return 'Yes, Deekshaam provides residential hostel facilities with warden supervision and separate arrangements. Contact admissions at +91 8971435297 or schedule a campus visit for current room availability, mess facilities, and fees.';
    }

    if (q.includes('fee') || q.includes('cost') || q.includes('scholarship')) {
      return 'Academic fees vary by program and intake year. To receive the latest program-wise fee structure and payment schedules, please submit an enquiry or speak directly with admissions at +91 8971435297.';
    }

    if (q.includes('apply') || q.includes('admission') || q.includes('enroll') || q.includes('register')) {
      return 'You can start an online application directly on this website under "Apply Now". Complete your profile, select your program, and upload academic credentials. Once submitted, you will receive an application ID (e.g. DBS-2026-XXXXXX) to track your status.';
    }

    if (q.includes('bca') || q.includes('tech') || q.includes('software') || q.includes('comput') || q.includes('ai')) {
      const bca = memoryDb.programs.find((p) => p.slug === 'bca');
      return `BCA (${bca?.title}): ${bca?.summary} Specializations include: ${bca?.specializations.slice(0, 4).join(', ')}. Key career tracks include: ${bca?.careers.slice(0, 4).join(', ')}.`;
    }

    if (q.includes('bba') || q.includes('business') || q.includes('manage') || q.includes('market')) {
      const bba = memoryDb.programs.find((p) => p.slug === 'bba');
      return `BBA (${bba?.title}): ${bba?.summary} Specializations include: ${bba?.specializations.slice(0, 4).join(', ')}. Graduates explore careers such as: ${bba?.careers.slice(0, 4).join(', ')}.`;
    }

    if (q.includes('bcom') || q.includes('commerce') || q.includes('account') || q.includes('finance')) {
      const bcom = memoryDb.programs.find((p) => p.slug === 'bcom');
      return `B.Com (${bcom?.title}): ${bcom?.summary} Specializations: ${bcom?.specializations.join(', ')}. Pathways include: ${bcom?.careers.slice(0, 4).join(', ')}.`;
    }

    if (q.includes('certificat') || q.includes('course')) {
      return `Deekshaam offers 10 professional certifications across Marketing, Cloud, Data Science, AI, and Financial Services. You can explore all options on the Professional Certifications page.`;
    }

    if (q.includes('visit') || q.includes('address') || q.includes('location') || q.includes('where')) {
      return `Deekshaam Business School is located at Venkatpura, Kundana, Devanahalli Taluk, Bangalore - 562110. You can book an appointment using the "Plan a Campus Visit" page.`;
    }

    if (q.includes('placement') || q.includes('job') || q.includes('recruiter') || q.includes('salary')) {
      return `Deekshaam connects students with major organizations including Salesforce, HCLTech, ITC Limited, HDFC Bank, MTR, and Johnson Controls through internships and career development.`;
    }

    // Domain fallback with human handoff
    return `I am Deeksha Guide, specialized in programs, admissions, and campus facilities. For personalized guidance on your query, please request a callback on the Contact page or call our admissions desk at +91 8971435297.`;
  }
}

const aiAdapter = new LocalKnowledgeProvider();

export async function chatWithAI(req: Request, res: Response) {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Message text is required' } });
  }

  try {
    const context = 'Deekshaam Business School admissions and program knowledge.';
    const reply = await aiAdapter.generateResponse(message, context);

    res.json({
      success: true,
      data: {
        reply,
        provider: config.ai.provider,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: { code: 'AI_UNAVAILABLE', message: 'AI service temporarily unavailable. Please use the contact form.' },
    });
  }
}
