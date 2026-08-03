import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'

// GET - Get patient by CNIC (Supports both Doctor and Patient)
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ cnic: string }> }
) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth_token')?.value
    const userId = cookieStore.get('user_id')?.value
    const userRole = cookieStore.get('user_role')?.value
    const doctorId = cookieStore.get('doctor_id')?.value

    console.log('🔍 Patient GET - UserId:', userId);
    console.log('🔍 Patient GET - UserRole:', userRole);
    console.log('🔍 Patient GET - DoctorId:', doctorId);

    // Check if user is authenticated
    if (!token || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const resolvedParams = await params;
    let cnic = resolvedParams?.cnic;
    if (!cnic) {
      const url = new URL(req.url);
      cnic = url.pathname.split('/').pop() || '';
    }

    cnic = decodeURIComponent(cnic).trim();

    // Clean the CNIC for searching
    const cleanCnic = cnic.replace(/[-\s]/g, '');

    console.log('🔍 Looking for patient with CNIC:', cnic);

    // ✅ If PATIENT is logged in - they can only view their own profile
    if (userRole === 'PATIENT') {
      const patient = await prisma.patient.findUnique({
        where: { id: userId },
        select: { cnic: true }
      });

      if (!patient || patient.cnic !== cnic) {
        return NextResponse.json(
          { error: 'Access denied. You can only view your own profile.' },
          { status: 403 }
        );
      }

      // Return patient's own data with ALL reports (no doctor filter)
      const ownPatient = await prisma.patient.findFirst({
        where: {
          cnic: cnic
        },
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
        exists: true,
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
    const patientWithReports = await prisma.patient.findFirst({
      where: {
        OR: [
          { cnic: cnic },
          { cnic: cnic.replace(/-/g, '') },
          { cnic: cnic.replace(/[-\s]/g, '') }
        ]
      },
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
        message: 'No patient found with this CNIC'
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
        cnic: patientWithReports.cnic,
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

// PUT - Update patient by CNIC (Only for own patients)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ cnic: string }> }
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
    const resolvedParams = await params;
    let cnic = resolvedParams?.cnic;

    if (!cnic) {
      const url = new URL(req.url);
      cnic = url.pathname.split('/').pop() || '';
    }
    
    cnic = decodeURIComponent(cnic).trim();

    // Find the patient - must belong to current doctor
    const existingPatient = await prisma.patient.findFirst({
      where: {
        doctorId,
        OR: [
          { cnic: cnic },
          { cnic: cnic.replace(/-/g, '') },
          { cnic: cnic.replace(/[-\s]/g, '') }
        ]
      }
    });

    if (!existingPatient) {
      return NextResponse.json(
        { error: 'Patient not found or does not belong to you' },
        { status: 404 }
      )
    }

    // Check if new CNIC already exists globally (if CNIC is being changed)
    if (body.cnic && body.cnic !== existingPatient.cnic) {
      const duplicate = await prisma.patient.findFirst({
        where: {
          OR: [
            { cnic: body.cnic },
            { cnic: body.cnic.replace(/-/g, '') },
            { cnic: body.cnic.replace(/[-\s]/g, '') }
          ],
          id: { not: existingPatient.id }
        }
      });
      
      if (duplicate) {
        const doctorName = duplicate.doctorId !== doctorId ? 'another doctor' : 'you';
        return NextResponse.json(
          { 
            error: `A patient with this CNIC already exists with ${doctorName}. Please use a different CNIC.`,
            existingPatient: {
              name: duplicate.name,
              doctorId: duplicate.doctorId
            }
          },
          { status: 409 }
        )
      }
    }

    // Update patient
    const updatedPatient = await prisma.patient.update({
      where: { id: existingPatient.id },
      data: {
        cnic: body.cnic || existingPatient.cnic,
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

// DELETE - Delete patient by CNIC (Only for own patients)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ cnic: string }> }
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

    const resolvedParams = await params;
    let cnic = resolvedParams?.cnic;
    if (!cnic) {
      const url = new URL(req.url);
      cnic = url.pathname.split('/').pop() || '';
    }

    cnic = decodeURIComponent(cnic).trim();

    // Find the patient - must belong to current doctor
    const existingPatient = await prisma.patient.findFirst({
      where: {
        doctorId,
        OR: [
          { cnic: cnic },
          { cnic: cnic.replace(/-/g, '') },
          { cnic: cnic.replace(/[-\s]/g, '') }
        ]
      },
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