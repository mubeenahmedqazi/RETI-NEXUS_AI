import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/db'
import { isValidPhone } from '@/lib/utils'

// GET patients for the authenticated doctor. With ?phone=, also searches
// beyond this doctor's own list — patients self-registered (no doctor yet)
// or registered by a different doctor — since a phone number can be shared
// by more than one patient and the doctor needs to find the right one before
// starting a new scan. Own-patient results and cross-doctor/self-registered
// results are returned together; the doctor relation is included so the
// frontend can flag "registered with another doctor" / "self-registered".
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const doctorId = cookieStore.get('doctor_id')?.value

    if (!doctorId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const phone = req.nextUrl.searchParams.get('phone')?.trim()

    const patients = await prisma.patient.findMany({
      where: phone
        ? { phone: { contains: phone } }
        : { doctorId },
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: {
          select: { id: true, name: true, email: true, hospital: true, phone: true },
        },
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
    const { name, phone, age, gender, address, diabetesLevel } = body

    if (!name || !phone) {
      return NextResponse.json(
        { error: 'Name and Phone are required' },
        { status: 400 }
      )
    }

    if (!isValidPhone(phone)) {
      return NextResponse.json(
        { error: 'Phone number must be exactly 11 digits' },
        { status: 400 }
      )
    }

    // ✅ Generate default password: name in lowercase without spaces
    const defaultPassword = name.toLowerCase().replace(/\s/g, '');
    const hashedPassword = await hash(defaultPassword, 10);

    const patient = await prisma.patient.create({
      data: {
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