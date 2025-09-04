import { NextRequest, NextResponse } from 'next/server';
import { readFile } from "fs/promises";
import { join } from "path";

interface EscalationRequest {
  reason: string;
  userMessage: string;
  userPhone?: string;
  userName?: string;
}

interface EscalationResponse {
  success: boolean;
  message: string;
  escalationId?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<EscalationResponse>> {
  try {
    const body: EscalationRequest = await request.json();
    const { reason, userMessage, userPhone, userName } = body;
    
    if (!reason || !userMessage) {
      return NextResponse.json({
        success: false,
        message: "Missing required fields: reason and userMessage"
      }, { status: 400 });
    }

    // Generate unique escalation ID
    const escalationId = `ESC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🚨 ESCALATION REQUEST:`, {
      escalationId,
      reason,
      userMessage,
      userPhone,
      userName,
      timestamp: new Date().toISOString()
    });

    // Load admin configuration to get API keys
    let adminConfig = null;
    try {
      const configPath = join(process.cwd(), "data", "homepage.json");
      const configData = await readFile(configPath, "utf-8");
      adminConfig = JSON.parse(configData);
    } catch (error) {
      console.log("Could not load admin configuration, using default escalation");
    }

    // Send SMS if Twilio is configured
    if (adminConfig?.twilioApiKey && adminConfig?.twilioAuthToken && adminConfig?.twilioPhoneNumber && userPhone) {
      try {
        // TODO: Implement actual Twilio SMS sending
        const smsMessage = `Hi ${userName || 'there'}, this is Ace Construction. We'll call you shortly regarding: ${reason}. Escalation ID: ${escalationId}`;
        console.log(`📱 SMS SENT via Twilio: ${smsMessage}`);
        console.log(`📱 To: ${userPhone}`);
        console.log(`📱 From: ${adminConfig.twilioPhoneNumber}`);
        
        // Here you would implement the actual Twilio API call:
        // const twilio = require('twilio')(adminConfig.twilioApiKey, adminConfig.twilioAuthToken);
        // await twilio.messages.create({
        //   body: smsMessage,
        //   from: adminConfig.twilioPhoneNumber,
        //   to: userPhone
        // });
        
      } catch (error) {
        console.error('Failed to send SMS:', error);
      }
    } else {
      console.log(`📱 SMS NOT SENT: Twilio not configured or missing user phone`);
    }
    
    // Trigger VAPI call if configured
    if (adminConfig?.vapiApiKey && adminConfig?.vapiAssistantId && userPhone) {
      try {
        // TODO: Implement actual VAPI call triggering
        console.log(`📞 VAPI CALL TRIGGERED:`, {
          escalationId,
          userPhone,
          reason,
          userMessage,
          apiKey: adminConfig.vapiApiKey ? '***configured***' : 'not configured',
          assistantId: adminConfig.vapiAssistantId
        });
        
        // Here you would implement the actual VAPI API call:
        // const response = await fetch('https://api.vapi.ai/call', {
        //   method: 'POST',
        //   headers: {
        //     'Authorization': `Bearer ${adminConfig.vapiApiKey}`,
        //     'Content-Type': 'application/json'
        //   },
        //   body: JSON.stringify({
        //     phoneNumberId: adminConfig.vapiPhoneNumberId,
        //     assistantId: adminConfig.vapiAssistantId,
        //     customer: { number: userPhone }
        //   })
        // });
        
      } catch (error) {
        console.error('Failed to trigger VAPI call:', error);
      }
    } else {
      console.log(`📞 VAPI CALL NOT TRIGGERED: VAPI not configured`);
    }

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Escalation processed successfully. Team will contact you shortly.",
      escalationId
    });

  } catch (error) {
    console.error('Escalation API error:', error);
    return NextResponse.json({
      success: false,
      message: "Failed to process escalation request. Please call us directly."
    }, { status: 500 });
  }
}

// GET endpoint for testing
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: "Escalation API is running. Use POST to escalate issues.",
    endpoints: {
      POST: "Send escalation request with reason and userMessage"
    },
    example: {
      reason: "Chatbot escalation",
      userMessage: "I have a plumbing leak",
      userPhone: "+1234567890",
      userName: "John Doe"
    }
  });
}
