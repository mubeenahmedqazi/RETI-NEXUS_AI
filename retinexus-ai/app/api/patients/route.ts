import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'

// GET all patients for the authenticated doctor
export async function GET() {
  try {
    const cookieStore = await cookies()
    const doctorId = cookieStore.get('doctor_id')?.value

    if (!doctorId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const patients = await prisma.patient.findMany({
      where: { doctorId }, // Only get patients for this doctor
      orderBy: { createdAt: 'desc' },
      include: {
        reports: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    })
    return NextResponse.json(patients)
  } catch (error) {
    console.error('Error fetching patients:', error)
    return NextResponse.json([])
  }
}

// POST new patient for authenticated doctor
export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const doctorId = cookieStore.get('doctor_id')?.value

    if (!doctorId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { cnic, name, phone, age, gender, address, diabetesLevel } = body

    if (!cnic || !name || !phone) {
      return NextResponse.json(
        { error: 'CNIC, Name, and Phone are required' },
        { status: 400 }
      )
    }

    // Check if patient already exists
    const existing = await prisma.patient.findUnique({
      where: { cnic }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Patient with this CNIC already exists' },
        { status: 400 }
      )
    }

    // ✅ Generate default password: name in lowercase without spaces
    const defaultPassword = name.toLowerCase().replace(/\s/g, '');
    const hashedPassword = await hash(defaultPassword, 10);

    const patient = await prisma.patient.create({
      data: {
        cnic,
        name,
        phone,
        password: hashedPassword,
        age: age ? parseInt(age) : null,
        gender,
        address,
        diabetesLevel,
        doctorId // Use authenticated doctor's ID
      }
    })

    return NextResponse.json({ 
      success: true, 
      patient,
      defaultPassword, // ✅ Return default password
      message: `Patient added successfully! Default password: ${defaultPassword}`
    })
  } catch (error) {
    console.error('Error creating patient:', error)
    return NextResponse.json(
      { error: 'Failed to create patient' },
      { status: 500 }
    )
  }  
}