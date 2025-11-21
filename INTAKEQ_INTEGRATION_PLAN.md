# IntakeQ (PracticeQ) Integration Plan for ASRS Assessment Tool

## Executive Summary
**YES, there's definitely daylight!** IntakeQ provides robust API capabilities that would allow seamless integration of your ASRS assessment tool with your EMR system. Here's how we can make it work:

## 🔑 Key Integration Points

### 1. **Webhook Reception** (Recommended Approach)
- IntakeQ can trigger your ASRS tool when a new patient is added or appointment is scheduled
- Patient data automatically flows to your assessment tool
- No manual data entry required

### 2. **Direct API Submission**
- Submit ASRS results directly back to IntakeQ as:
  - Treatment Notes (most appropriate for assessment results)
  - Custom intake form responses
  - Updated client profile with custom fields

### 3. **Bi-directional Sync**
- Pull patient data from IntakeQ to pre-populate assessments
- Push results back to patient records
- Use ExternalClientId to maintain sync between systems

## 📋 Implementation Strategy

### Phase 1: Basic Integration (Quick Win)
**Goal:** Get ASRS results into IntakeQ patient records

#### Option A: Treatment Notes API
```javascript
// Submit ASRS results as a treatment note
POST /api/v1/notes
{
  clientId: 12345,
  noteName: "ASRS Assessment Results",
  date: "2024-11-20",
  content: {
    partAScore: 5,
    totalScore: 42,
    severity: "Moderate",
    clinicallySignificant: true,
    responses: [...questionResponses]
  }
}
```

#### Option B: Custom Fields on Client Profile
```javascript
// Update client with ASRS scores
POST /api/v1/clients
{
  clientId: 12345,
  customFields: [
    { fieldId: "asrs_part_a", value: "5/6" },
    { fieldId: "asrs_total", value: "42/72" },
    { fieldId: "asrs_severity", value: "Moderate" },
    { fieldId: "asrs_date", value: "2024-11-20" }
  ]
}
```

### Phase 2: Automated Workflow
**Goal:** Seamless assessment triggering and result storage

1. **Incoming Webhook Setup**
   - IntakeQ sends webhook when new patient is created
   - Your ASRS tool receives patient data
   - Automatically creates assessment session

2. **Assessment Completion Flow**
   ```
   Patient completes ASRS →
   Calculate scores →
   POST to IntakeQ Notes API →
   Update client record →
   Trigger IntakeQ notification
   ```

3. **Dashboard Integration**
   - Your dashboard pulls data from both systems
   - Single view of all assessments
   - Direct links to IntakeQ patient records

### Phase 3: Full EMR Integration
**Goal:** ASRS as native IntakeQ questionnaire

- Create ASRS as IntakeQ questionnaire template
- Use IntakeQ's native form sending
- Leverage their existing email/SMS infrastructure
- Automatic PDF generation and storage

## 🛠️ Technical Implementation

### Authentication Setup
```javascript
// Add to your .env file
INTAKEQ_API_KEY=your_api_key_here
INTAKEQ_API_URL=https://intakeq.com/api/v1
INTAKEQ_WEBHOOK_SECRET=your_webhook_secret
```

### API Service (lib/intakeq.ts)
```typescript
import { NextRequest } from 'next/server'

const INTAKEQ_API = process.env.INTAKEQ_API_URL
const API_KEY = process.env.INTAKEQ_API_KEY

export async function submitASRSResults(
  clientId: string,
  scores: ScoringResult,
  responses: QuestionResponse[]
) {
  // Create treatment note with ASRS results
  const note = {
    clientId,
    noteName: "ASRS Assessment Results",
    date: new Date().toISOString(),
    practitionerId: process.env.PRACTITIONER_ID,
    status: "locked",
    content: {
      summary: `ASRS Assessment - Part A: ${scores.partAScore}/6, Total: ${scores.totalScore}/72`,
      partAScore: scores.partAScore,
      totalScore: scores.totalScore,
      severity: scores.severity,
      clinicallySignificant: scores.partAPositive,
      assessmentDate: new Date().toISOString(),
      responses: responses.map(r => ({
        question: r.question_text,
        response: r.response_text,
        value: r.response_value
      }))
    }
  }

  const response = await fetch(`${INTAKEQ_API}/notes`, {
    method: 'POST',
    headers: {
      'X-Auth-Key': API_KEY!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(note)
  })

  return response.json()
}

export async function getClientByEmail(email: string) {
  const response = await fetch(
    `${INTAKEQ_API}/clients?search=${email}&includeProfile=true`,
    {
      headers: {
        'X-Auth-Key': API_KEY!
      }
    }
  )

  const clients = await response.json()
  return clients[0] // Return first match
}

export async function handleIntakeQWebhook(request: NextRequest) {
  const body = await request.json()

  switch(body.Type) {
    case "Client Created":
      // Trigger ASRS assessment for new patient
      await createAssessmentSession(body.ClientId)
      break

    case "Appointment Booked":
      // Send ASRS before appointment
      if (body.AppointmentType === "Initial Consultation") {
        await sendASRSToPatient(body.ClientId)
      }
      break
  }
}
```

### Webhook Receiver (/api/webhooks/intakeq/route.ts)
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { handleIntakeQWebhook } from '@/lib/intakeq'

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature if provided
    const signature = request.headers.get('X-IntakeQ-Signature')
    if (signature && !verifySignature(request, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    await handleIntakeQWebhook(request)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
```

## 📊 Data Mapping

### ASRS → IntakeQ Treatment Note
| ASRS Field | IntakeQ Note Field | Type |
|------------|-------------------|------|
| Part A Score | content.partAScore | Number |
| Total Score | content.totalScore | Number |
| Severity | content.severity | String |
| Responses | content.responses | Array |
| Date | date | DateTime |
| Session ID | externalId | String |

### IntakeQ Client → ASRS Session
| IntakeQ Field | ASRS Field | Usage |
|---------------|------------|-------|
| ClientId | external_client_id | Link records |
| ClientName | patient_name | Display |
| ClientEmail | patient_email | Communication |
| DateOfBirth | patient_dob | Demographics |
| Phone | phone_number | SMS delivery |

## 🚀 Quick Start Integration

### Step 1: Enable IntakeQ API
1. Login to IntakeQ
2. Go to Settings → Integrations → Developer API
3. Enable API access
4. Copy your API key

### Step 2: Configure Webhooks
1. In IntakeQ Settings → Integrations
2. Add webhook URL: `https://psych-asrs-one.vercel.app/api/webhooks/intakeq`
3. Select events: Client Created, Appointment Booked

### Step 3: Add Custom Fields (if using Option B)
1. Go to Client Profile Settings
2. Add custom fields:
   - ASRS Part A Score (Number)
   - ASRS Total Score (Number)
   - ASRS Severity (Dropdown)
   - ASRS Last Assessment (Date)

### Step 4: Update Environment Variables
```env
# Add to Vercel Environment Variables
INTAKEQ_API_KEY=your_api_key_here
INTAKEQ_PRACTITIONER_ID=your_practitioner_id
INTAKEQ_WEBHOOK_SECRET=your_secret
```

## 📈 Benefits of Integration

1. **Eliminate Double Entry**: Patient data flows automatically
2. **Unified Records**: All assessments in one EMR
3. **Better Workflow**: Trigger assessments based on appointments
4. **Compliance**: Leverage IntakeQ's HIPAA-compliant infrastructure
5. **Reporting**: Use IntakeQ's reporting tools for ASRS data

## ⚡ Rate Limits & Considerations

- **API Limits**: 10 requests/minute, 500/day (upgradeable)
- **Webhook Delivery**: Real-time, retry on failure
- **Data Storage**: All PHI stays in HIPAA-compliant systems
- **PDF Generation**: IntakeQ can auto-generate PDFs of assessments

## 🎯 Recommended Next Steps

1. **Start with Phase 1**: Get basic integration working
2. **Test with sandbox**: IntakeQ may have test environment
3. **Add one-click import**: Button in IntakeQ to trigger ASRS
4. **Monitor usage**: Track API calls to stay within limits

## 💡 Pro Tips

- Use IntakeQ's ExternalClientId to maintain sync
- Store IntakeQ's ClientId in your database for quick lookups
- Implement retry logic for failed API calls
- Cache frequently accessed data to reduce API calls
- Consider upgrading API limits if you hit caps

## 🔗 Useful Resources

- [IntakeQ API Documentation](https://support.intakeq.com/category/560-api)
- [Webhook Setup Guide](https://support.intakeq.com/article/31-intakeq-api)
- [Custom Fields Guide](https://support.intakeq.com/article/251-intakeq-client-api)
- [Treatment Notes API](https://support.intakeq.com/article/342-intakeq-notes-api)

---

**Bottom Line:** IntakeQ's API is well-suited for ASRS integration. You can start with a simple treatment note submission and evolve to a fully automated bi-directional sync. The API is RESTful, well-documented, and designed for exactly this type of integration!