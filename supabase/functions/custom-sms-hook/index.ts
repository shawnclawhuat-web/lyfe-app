import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { AwsClient } from 'https://esm.sh/aws4fetch@1.0.19'

const aws = new AwsClient({
  accessKeyId: Deno.env.get('AWS_ACCESS_KEY_ID')!,
  secretAccessKey: Deno.env.get('AWS_SECRET_ACCESS_KEY')!,
  region: 'ap-southeast-1',
  service: 'sns',
})

serve(async (req) => {
  const payload = await req.json()
  const phone = '+' + payload.sms.phone
  const otp = payload.sms.otp

  const body = new URLSearchParams({
    Action: 'Publish',
    PhoneNumber: phone,
    Message: `Your Lyfe verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
    'MessageAttributes.entry.1.Name': 'AWS.SNS.SMS.SMSType',
    'MessageAttributes.entry.1.Value.DataType': 'String',
    'MessageAttributes.entry.1.Value.StringValue': 'Transactional',
    'MessageAttributes.entry.2.Name': 'AWS.SNS.SMS.SenderID',
    'MessageAttributes.entry.2.Value.DataType': 'String',
    'MessageAttributes.entry.2.Value.StringValue': 'LYFE',
  })

  try {
    const response = await aws.fetch('https://sns.ap-southeast-1.amazonaws.com/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('SNS error:', error)
      return new Response(JSON.stringify({ error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Fetch error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
