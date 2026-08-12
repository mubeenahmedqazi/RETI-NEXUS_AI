import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'
import { isValidPhone } from '@/lib/utils'

// GET - Get patient by id (Supports both Doctor and Patient)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    const userId = cookieStore.get('user_id')?.value
    const userRole = cookieStore.get('user_role')?.value
    const doctorId = cookieStore.get('doctor_id')?.value

    // Check if user is authenticated
    if (!token || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params;

    // ✅ If PATIENT is logged in - they can only view their own profile
    if (userRole === 'PATIENT') {
      if (id !== userId) {
        return NextResponse.json(
          { error: 'Access denied. You can only view your own profile.' },
          { status: 403 }
        );
      }

      // Return patient's own data with ALL reports (no doctor filter)
      const ownPatient = await prisma.patient.findUnique({
        where: { id },
        include: {
          doctor: {
            select: {
              id: true,
              name: true,
              email: true,
              hospital: true,
              phone: true,
            }
          },
          reports: {
            orderBy: { createdAt: 'desc' }
            // ✅ No doctorId filter - show ALL reports
          }
        }
      });

      return NextResponse.json({
        exists: !!ownPatient,
        belongsToCurrentDoctor: false,
        patient: ownPatient,
        message: 'Patient found. You are viewing your own profile.'
      });
    }

    // ✅ For DOCTOR
    const docId = doctorId || userId;

    if (!docId) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 401 }
      )
    }

    // ✅ Get patient with ALL reports (no doctor filter on reports)
    const patientWithReports = await prisma.patient.findUnique({
      where: { id },
      include: {
        doctor: {
          select: {
            id: true,
            name: true,
            email: true,
            hospital: true,
            phone: true,
          }
        },
        reports: {
          orderBy: { createdAt: 'desc' }
          // ✅ No doctorId filter - show ALL reports
        }
      }
    });

    // If patient doesn't exist at all
    if (!patientWithReports) {
      return NextResponse.json({
        exists: false,
        belongsToCurrentDoctor: false,
        patient: null,
        message: 'No patient found'
      });
    }

    // Check if patient belongs to current doctor
    const belongsToCurrentDoctor = patientWithReports.doctorId === docId;

    // Return patient with ALL reports
    return NextResponse.json({
      exists: true,
      belongsToCurrentDoctor: belongsToCurrentDoctor,
      patient: {
        id: patientWithReports.id,
        name: patientWithReports.name,
        phone: patientWithReports.phone,
        age: patientWithReports.age,
        gender: patientWithReports.gender,
        address: patientWithReports.address,
        diabetesLevel: patientWithReports.diabetesLevel,
        createdAt: patientWithReports.createdAt,
        doctorId: patientWithReports.doctorId,
        doctor: {
          id: patientWithReports.doctor?.id,
          name: patientWithReports.doctor?.name || 'Unknown',
          email: patientWithReports.doctor?.email || 'Unknown',
          hospital: patientWithReports.doctor?.hospital || 'Unknown',
        },
        reports: patientWithReports.reports, // ✅ All reports
        _count: {
          reports: patientWithReports.reports.length
        }
      },
      message: belongsToCurrentDoctor
        ? 'Patient found in your records. Full access granted.'
        : 'Patient found but belongs to another doctor. View only mode.'
    });

  } catch (error) {
    console.error('Error fetching patient:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update patient by id (Only for own patients)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const doctorId = cookieStore.get('doctor_id')?.value || cookieStore.get('user_id')?.value
    const userRole = cookieStore.get('user_role')?.value

    // Only doctors can update patients
    if (userRole !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Access denied. Only doctors can update patients.' },
        { status: 403 }
      )
    }

    if (!doctorId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { id } = await params;

    if (body.phone && !isValidPhone(body.phone)) {
      return NextResponse.json(
        { error: 'Phone number must be exactly 11 digits' },
        { status: 400 }
      )
    }

    // Find the patient - must belong to current doctor
    const existingPatient = await prisma.patient.findFirst({
      where: { id, doctorId }
    });

    if (!existingPatient) {
      return NextResponse.json(
        { error: 'Patient not found or does not belong to you' },
        { status: 404 }
      )
    }

    // Update patient
    const updatedPatient = await prisma.patient.update({
      where: { id: existingPatient.id },
      data: {
        name: body.name || existingPatient.name,
        phone: body.phone || existingPatient.phone,
        age: body.age !== undefined && body.age !== '' ? parseInt(body.age) : existingPatient.age,
        gender: body.gender || existingPatient.gender,
        address: body.address || existingPatient.address,
        diabetesLevel: body.diabetesLevel || existingPatient.diabetesLevel,
      },
      include: {
        reports: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Patient updated successfully',
      patient: updatedPatient
    })
  } catch (error) {
    console.error('Error updating patient:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete patient by id (Only for own patients)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const doctorId = cookieStore.get('doctor_id')?.value || cookieStore.get('user_id')?.value
    const userRole = cookieStore.get('user_role')?.value

    // Only doctors can delete patients
    if (userRole !== 'DOCTOR') {
      return NextResponse.json(
        { error: 'Access denied. Only doctors can delete patients.' },
        { status: 403 }
      )
    }

    if (!doctorId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id } = await params;

    // Find the patient - must belong to current doctor
    const existingPatient = await prisma.patient.findFirst({
      where: { id, doctorId },
      include: {
        reports: {
          select: { id: true }
        }
      }
    });

    if (!existingPatient) {
      return NextResponse.json(
        { error: 'Patient not found or does not belong to you' },
        { status: 404 }
      )
    }

    // Check if patient has reports
    if (existingPatient.reports && existingPatient.reports.length > 0) {
      // Delete all reports first
      await prisma.report.deleteMany({
        where: { patientId: existingPatient.id }
      });
    }

    // Delete the patient
    await prisma.patient.delete({
      where: { id: existingPatient.id }
    });

    return NextResponse.json({
      success: true,
      message: `Patient ${existingPatient.name} and all associated reports deleted successfully`
    })
  } catch (error) {
    console.error('Error deleting patient:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
