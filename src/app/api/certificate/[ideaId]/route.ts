import { NextRequest, NextResponse } from 'next/server'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import QRCode from 'qrcode'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ ideaId: string }> }
): Promise<Response> {
  const { ideaId } = await context.params

  const { data: idea, error } = await supabase
    .from('ideas')
    .select('*')
    .eq('id', ideaId)
    .single()

  if (error || !idea) {
    return NextResponse.json(
      { error: 'Idea not found' },
      { status: 404 }
    )
  }

  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([842, 595])

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const { width, height } = page.getSize()

  page.drawText('B', {
    x: width / 2 - 80,
    y: height / 2 - 80,
    size: 200,
    font: bold,
    color: rgb(0.9, 0.9, 0.9),
    opacity: 0.15,
  })

  page.drawText('BANK OF UNIQUE IDEAS', {
    x: 200,
    y: height - 80,
    size: 30,
    font: bold,
  })

  page.drawText('Certificate of Idea Deposit', {
    x: 260,
    y: height - 120,
    size: 18,
    font,
  })

  const certNumber = `GLOBUI-${idea.id.slice(0, 8).toUpperCase()}`
  const submissionDate = new Date(idea.created_at).toLocaleString()
  const verificationCode = idea.verification_code || 'Pending'
  const ideaHash = idea.idea_hash || 'Pending'
  const inventorName = idea.full_name || 'Unknown'
  const ideaTitle = idea.title || 'Untitled Idea'

  page.drawText(`Certificate No: ${certNumber}`, {
    x: 100,
    y: height - 170,
    size: 14,
    font,
  })

  page.drawText(`Inventor: ${inventorName}`, {
    x: 100,
    y: height - 220,
    size: 14,
    font,
  })

  page.drawText(`Idea Title: ${ideaTitle}`, {
    x: 100,
    y: height - 250,
    size: 14,
    font,
  })

  page.drawText(`Submission Date: ${submissionDate}`, {
    x: 100,
    y: height - 280,
    size: 14,
    font,
  })

  page.drawText(`Verification Code: ${verificationCode}`, {
    x: 100,
    y: height - 310,
    size: 14,
    font,
  })

  page.drawText('Idea Hash (SHA-256):', {
    x: 100,
    y: height - 360,
    size: 12,
    font,
  })

  page.drawText(ideaHash, {
    x: 100,
    y: height - 380,
    size: 10,
    font,
  })

  page.drawText(
    'This certificate confirms that the above idea was deposited with the Bank of Unique Ideas.',
    {
      x: 100,
      y: 120,
      size: 12,
      font,
    }
  )

  const verifyUrl = `http://localhost:3000/verify/${idea.id}`
  const qrDataUrl = await QRCode.toDataURL(verifyUrl)
  const qrImage = await pdfDoc.embedPng(qrDataUrl)

  page.drawImage(qrImage, {
    x: width - 180,
    y: 100,
    width: 100,
    height: 100,
  })

  page.drawText('Scan to Verify', {
    x: width - 170,
    y: 80,
    size: 10,
    font,
  })

  const pdfBytes = await pdfDoc.save()

  return new NextResponse(Buffer.from(pdfBytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="certificate-${idea.id}.pdf"`,
    },
  })
}