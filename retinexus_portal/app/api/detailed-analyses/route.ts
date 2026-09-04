import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { generateDetailedAnalysisReportCode } from '@/lib/reportCode'

// POST - save (approve) a Detailed Analysis report against a patient, for doctors only
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    const userId = cookieStore.get('user_id')?.value
    const userRole = cookieStore.get('user_role')?.value
    const doctorId = cookieStore.get('doctor_id')?.value

    if (!token || !userId) {
      return NextResponse.json({ error: 'Unauthorized - Please login' }, { status: 401 })
    }
    if (userRole !== 'DOCTOR') {
      return NextResponse.json({ error: 'Access denied. Only doctors can save detailed analysis reports.' }, { status: 403 })
    }

    const docId = doctorId || userId
    const body = await req.json()
    const {
      patientId,
      reportId,
      testName,
      clinicalSummary,
      testFindings,
      organFindings,
      redFlags,
      recommendations,
      urgency,
      extractionMethod,
    } = body

    if (!patientId || !testName) {
      return NextResponse.json({ error: 'patientId and testName are required' }, { status: 400 })
    }

    const patient = await prisma.patient.findUnique({ where: { id: patientId } })
    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    const reportCode = await generateDetailedAnalysisReportCode()
    const analysis = await prisma.detailedAnalysis.create({
      data: {
        reportCode,
        patientId,
        doctorId: docId,
        reportId: reportId || null,
        testName,
        clinicalSummary: clinicalSummary || '',
        testFindings: testFindings || '',
        organFindings: organFindings || {},
        redFlags: Array.isArray(redFlags) ? redFlags : [],
        recommendations: Array.isArray(recommendations) ? recommendations : [],
        urgency: urgency || 'routine',
        extractionMethod: extractionMethod || null,
      },
    })

    return NextResponse.json({
      success: true,
      analysis,
      message: 'Detailed analysis report approved and saved successfully!',
    })
  } catch (error: any) {
    console.error('Error saving detailed analysis:', error)
    return NextResponse.json(
      { error: 'Failed to save detailed analysis: ' + (error.message || 'Unknown error') },
      { status: 500 }
    )
  }
}

// GET - list a patient's saved Detailed Analysis reports
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    const userId = cookieStore.get('user_id')?.value
    const doctorId = cookieStore.get('doctor_id')?.value

    if (!token || !userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId')

    // Scoped to one patient — used by the per-patient Detailed Analysis page's sidebar.
    if (patientId) {
      const analyses = await prisma.detailedAnalysis.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(analyses)
    }

    // No patientId — the doctor-wide "Detailed Analysis" list page (sidebar nav item,
    // separate from the "Screening Reports" list) — every analysis this doctor has saved.
    const docId = doctorId || userId
    const analyses = await prisma.detailedAnalysis.findMany({
      where: { doctorId: docId },
      orderBy: { createdAt: 'desc' },
      // reportData is included so the list page's Download button can reproduce the exact
      // same PDF as the live analysis flow (biomarkers, lesion counts, images, predicted
      // risk) — none of that lives on the DetailedAnalysis row itself.
      include: { patient: true, report: { select: { reportNumber: true, reportData: true } } },
    })
    return NextResponse.json(analyses)
  } catch (error) {
    console.error('Error fetching detailed analyses:', error)
    return NextResponse.json({ error: 'Failed to fetch detailed analyses' }, { status: 500 })
  }
}
