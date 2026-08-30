import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { uploadToCloudinary } from '@/lib/cloudinary'
import { getReportImageUrl } from '@/lib/reportImages'
import { API_BASE_URL } from '@/services/api'

// GET all reports for authenticated user (Doctor or Patient)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    const userId = cookieStore.get('user_id')?.value
    const userRole = cookieStore.get('user_role')?.value
    const doctorId = cookieStore.get('doctor_id')?.value

    console.log('🔍 Reports GET - UserId:', userId)
    console.log('🔍 Reports GET - UserRole:', userRole)

    // Check authentication
    if (!token || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    // ✅ Try to decode token to get role if not set in cookie
    let decodedRole = userRole;
    if (!decodedRole) {
      try {
        const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
        decodedRole = tokenData.role;
        console.log('🔍 Decoded role from token:', decodedRole);
      } catch (e) {
        console.error('❌ Failed to decode token:', e);
      }
    }

    let reports = []

    // ✅ If PATIENT is logged in - get reports by their patientId
    if (decodedRole === 'PATIENT') {
      const patient = await prisma.patient.findUnique({
        where: { id: userId },
        select: { id: true, name: true }
      })

      if (!patient) {
        return NextResponse.json(
          { error: 'Patient not found' },
          { status: 404 }
        )
      }

      reports = await prisma.report.findMany({
        where: {
          patientId: patient.id
        },
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          patient: {
            select: {
              name: true,
              phone: true,
            }
          }
        }
      })

      console.log(`✅ Found ${reports.length} reports for patient ${patient.name}`)

    // ✅ If DOCTOR is logged in - get reports by doctorId
    } else if (decodedRole === 'DOCTOR') {
      const docId = doctorId || userId

      if (!docId) {
        return NextResponse.json(
          { error: 'Doctor not found' },
          { status: 401 }
        )
      }

      reports = await prisma.report.findMany({
        where: { 
          doctorId: docId 
        },
        orderBy: { 
          createdAt: 'desc' 
        },
        include: {
          patient: true
        }
      })

      console.log(`✅ Found ${reports.length} reports for doctor`)

    } else {
      console.log('❌ Reports GET - Unknown role:', decodedRole)
      return NextResponse.json(
        { error: 'Unknown role' },
        { status: 401 }
      )
    }

    return NextResponse.json(reports || [])

  } catch (error) {
    console.error('❌ Error fetching reports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reports' },
      { status: 500 }
    )
  }
}

// POST save report for authenticated doctor only
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    const userId = cookieStore.get('user_id')?.value
    const userRole = cookieStore.get('user_role')?.value
    const doctorId = cookieStore.get('doctor_id')?.value

    console.log('🔍 Reports POST - UserId:', userId)
    console.log('🔍 Reports POST - UserRole:', userRole)

    // Check authentication
    if (!token || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized - Please login' },
        { status: 401 }
      )
    }

    // Only doctors can save reports
    if (userRole !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Access denied. Only doctors can save reports.' },
        { status: 403 }
      )
    }

    const docId = doctorId || userId

    if (!docId) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 401 }
      )
    }

    const body = await req.json()
    console.log('📤 Saving report:', body)

    const {
      patientId,
      patientName,
      drGrade,
      confidence,
      description,
      imageUrl,
      processedAt,
      reportData: rawReportData,
      clinicalReport, // ✅ New field for LLM report
    } = body

    // Validate required fields
    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      )
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId }
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // The 4 pipeline images (enhanced/vessel_mask/detected_lesions/gradcam) only exist on
    // the Python backend's local disk at this point, referenced by bare filename — not
    // durable (a backend redeploy/restart wipes them) and not CDN-backed, which is also
    // why report/PDF image loads can be slow (every view re-fetches from that one backend
    // host). Upload each to Cloudinary now, once, at save time, and persist the permanent
    // secure_url instead — every later view then loads from Cloudinary's CDN, independent
    // of the backend's uptime.
    const localImages = (rawReportData?.images || {}) as Record<string, string>
    let finalReportData = rawReportData || {}
    let finalImageUrl = imageUrl || ''
    let imagePublicId: string | undefined

    if (Object.keys(localImages).length > 0) {
      const uploaded = await Promise.all(
        Object.entries(localImages).map(async ([key, filename]) => {
          const backendUrl = getReportImageUrl(filename, API_BASE_URL)
          if (!backendUrl) return [key, filename] as const
          try {
            const { url, publicId } = await uploadToCloudinary(backendUrl)
            if (key === 'enhanced') {
              finalImageUrl = url
              imagePublicId = publicId
            }
            return [key, url] as const
          } catch (err) {
            // Fall back to the local filename rather than losing the reference entirely —
            // the report still saves, it just won't have a durable image for this one.
            console.error(`⚠️ Cloudinary upload failed for "${key}" (${filename}):`, err)
            return [key, filename] as const
          }
        })
      )
      finalReportData = { ...rawReportData, images: Object.fromEntries(uploaded) }
    }

    // ✅ Create the report with the patient
    const report = await prisma.report.create({
      data: {
        patientId: patient.id,
        patientName: patient.name,
        doctorId: docId,
        drGrade: drGrade || 'Unknown',
        confidence: confidence || 0,
        description: description || '',
        imageUrl: finalImageUrl,
        imagePublicId,
        processedAt: processedAt || new Date().toISOString(),
        reportData: finalReportData,
        clinicalReport: clinicalReport || '', // ✅ Save LLM clinical report
        approved: true,
        approvedAt: new Date(),
      }
    })

    console.log('✅ Report saved:', report.id)

    return NextResponse.json({ 
      success: true, 
      report,
      patient,
      message: 'Report approved and saved successfully!' 
    })
  } catch (error: any) {
    console.error('❌ Error saving report:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { 
          error: 'A report with this data already exists.' 
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to save report: ' + (error.message || 'Unknown error') },
      { status: 500 }
    )
  }
}