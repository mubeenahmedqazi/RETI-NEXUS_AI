import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'

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

    // ✅ If PATIENT is logged in - get reports by their CNIC
    if (decodedRole === 'PATIENT') {
      const patient = await prisma.patient.findUnique({
        where: { id: userId },
        select: { cnic: true, name: true }
      })

      if (!patient) {
        return NextResponse.json(
          { error: 'Patient not found' },
          { status: 404 }
        )
      }

      console.log('🔍 Looking for reports for patient CNIC:', patient.cnic)

      reports = await prisma.report.findMany({
        where: { 
          patientCnic: patient.cnic
        },
        orderBy: { 
          createdAt: 'desc' 
        },
        include: {
          patient: {
            select: {
              name: true,
              cnic: true,
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
      patientCnic, 
      patientName, 
      drGrade, 
      confidence, 
      description, 
      imageUrl, 
      processedAt, 
      reportData,
      clinicalReport, // ✅ New field for LLM report
      phone 
    } = body

    // Validate required fields
    if (!patientCnic) {
      return NextResponse.json(
        { error: 'Patient CNIC is required' },
        { status: 400 }
      )
    }

    let patient

    // STEP 1: Try to find patient by ID (if provided)
    if (patientId) {
      patient = await prisma.patient.findFirst({
        where: { 
          id: patientId
        }
      })
      if (patient) {
        console.log('📋 Found patient by ID:', patient)
      }
    }

    // STEP 2: If not found by ID, try to find by CNIC (ANY doctor)
    if (!patient) {
      patient = await prisma.patient.findFirst({
        where: { 
          cnic: patientCnic
        }
      })
      if (patient) {
        console.log('📋 Found patient by CNIC (global):', patient)
      }
    }

    // STEP 3: If patient found, use it (even if belongs to another doctor)
    if (patient) {
      console.log('📋 Using existing patient:', patient)
    } else {
      // STEP 4: Patient doesn't exist at all - create new one
      console.log('👤 Patient not found, creating new patient...')
      try {
        patient = await prisma.patient.create({
          data: {
            cnic: patientCnic,
            name: patientName || 'Unknown Patient',
            phone: phone || '0000000000',
            age: null,
            gender: null,
            address: null,
            diabetesLevel: null,
            doctorId: docId
          }
        })
        console.log('✅ Created new patient:', patient)
      } catch (createError: any) {
        if (createError.code === 'P2002') {
          // Race condition - patient was created by another request
          const existingPatient = await prisma.patient.findUnique({
            where: { cnic: patientCnic }
          })
          if (existingPatient) {
            patient = existingPatient
            console.log('📋 Found existing patient after conflict:', patient)
          } else {
            throw createError
          }
        } else {
          throw createError
        }
      }
    }

    // ✅ STEP 5: Create the report with the patient - USE patient.cnic (actual CNIC)
    const report = await prisma.report.create({
      data: {
        patientId: patient.id,
        patientCnic: patient.cnic,  // ✅ Use actual CNIC
        patientName: patient.name,
        doctorId: docId,
        drGrade: drGrade || 'Unknown',
        confidence: confidence || 0,
        description: description || '',
        imageUrl: imageUrl || '',
        processedAt: processedAt || new Date().toISOString(),
        reportData: reportData || {},
        clinicalReport: clinicalReport || '', // ✅ Save LLM clinical report
        approved: true,
        approvedAt: new Date(),
      }
    })

    console.log('✅ Report saved:', report.id)
    console.log('✅ Patient CNIC in report:', report.patientCnic)
    
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