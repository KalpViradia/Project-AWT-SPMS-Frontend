'use server'

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { createNotification } from '@/lib/notification-actions';
import bcrypt from 'bcryptjs';

// ============================================
// STUDENT REGISTRATION
// ============================================

const RegisterStudentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string()
    .length(10, "Phone number must be exactly 10 digits")
    .regex(/^\d{10}$/, "Phone number must contain only digits"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function registerStudent(formData: FormData) {
  const validatedFields = RegisterStudentSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    password: formData.get('password'),
  });

  if (!validatedFields.success) {
    throw new Error(validatedFields.error.issues[0].message);
  }

  const { name, email, phone, password } = validatedFields.data;

  // Check if email already exists
  const existingStudent = await prisma.student.findUnique({
    where: { email }
  });

  if (existingStudent) {
    throw new Error("Email already registered. Please use a different email or login.");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create student account
  try {
    await prisma.student.create({
      data: {
        student_name: name,
        email,
        phone,
        password: hashedPassword,
        role: 'student',
        created_at: new Date(),
        modified_at: new Date(),
      }
    });
  } catch (error) {
    console.error("Failed to create student:", error);
    throw new Error("Failed to create account. Please try again.");
  }
}

// ============================================
// GROUP MANAGEMENT
// ============================================

const CreateGroupSchema = z.object({
  groupName: z.string().min(3),
  projectTitle: z.string().min(5),
  projectType: z.string(),
  guideId: z.string(),
  description: z.string().min(50, "Description must be at least 50 characters."),
  objectives: z.string().min(30, "Objectives must be at least 30 characters."),
  methodology: z.string().min(30, "Methodology must be at least 30 characters."),
  expectedOutcomes: z.string().min(30, "Expected outcomes must be at least 30 characters."),
  projectSkills: z.string().optional(),
});

export async function createGroup(formData: FormData) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const user = session.user as { id: string; role?: string | null };

  if (user.role !== 'student') {
    throw new Error("Unauthorized");
  }

  const studentId = parseInt(user.id);

  const validatedFields = CreateGroupSchema.safeParse({
    groupName: formData.get('groupName'),
    projectTitle: formData.get('projectTitle'),
    projectType: formData.get('projectType'),
    guideId: formData.get('guideId'),
    description: formData.get('description'),
    objectives: formData.get('objectives'),
    methodology: formData.get('methodology'),
    expectedOutcomes: formData.get('expectedOutcomes'),
    projectSkills: formData.get('projectSkills'),
  });

  if (!validatedFields.success) {
    throw new Error('Invalid fields');
  }

  const { groupName, projectTitle, projectType, guideId, description, objectives, methodology, expectedOutcomes, projectSkills } = validatedFields.data;

  // Parse project skills
  let projectSkillsArray: string[] = [];
  if (projectSkills) {
    try {
      projectSkillsArray = JSON.parse(projectSkills);
    } catch { projectSkillsArray = []; }
  }

  // Check if student is already in a group
  const existingMember = await prisma.project_group_member.findFirst({
    where: { student_id: studentId }
  });

  if (existingMember) {
      throw new Error("You are already in a group.");
  }

  // Handle proposal file upload if present
  const proposalFile = formData.get('proposalFile') as File | null;
  let proposalFilePath: string | null = null;

  if (proposalFile && proposalFile.size > 0) {
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'proposals');
    await mkdir(uploadDir, { recursive: true });
    
    const fileName = `${Date.now()}-${proposalFile.name}`;
    proposalFilePath = `/uploads/proposals/${fileName}`;
    
    const bytes = await proposalFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(join(process.cwd(), 'public', proposalFilePath), buffer);
  }

  try {
      // Transaction to create group and add member
      await prisma.$transaction(async (tx) => {
          const newGroup = await tx.project_group.create({
              data: {
                  project_group_name: groupName,
                  project_title: projectTitle,
                  project_type: { connect: { project_type_id: parseInt(projectType) } },
                  staff_project_group_guide_staff_idTostaff: { connect: { staff_id: parseInt(guideId) } },
                  project_description: description,
                  project_objectives: objectives,
                  project_methodology: methodology,
                  project_expected_outcomes: expectedOutcomes,
                  project_skills: projectSkillsArray,
                  proposal_file_path: proposalFilePath,
                  proposal_submitted_at: new Date(),
                  status: 'pending',
                  created_at: new Date(),
                  modified_at: new Date(),
              }
          });

          await tx.project_group_member.create({
              data: {
                  project_group_id: newGroup.project_group_id,
                  student_id: studentId,
                  is_group_leader: true,
                  created_at: new Date(),
                  modified_at: new Date(),
              }
          });
      });
  } catch (error) {
    console.error("Failed to create group:", error);
    throw new Error("Failed to create group");
  }

  revalidatePath('/dashboard/student');
  revalidatePath('/dashboard/student/my-group');
  redirect('/dashboard/student/my-group');
}

const ApproveGroupSchema = z.object({
  groupId: z.coerce.number().positive("Invalid group ID"),
  action: z.string().refine(
    (val) => ['approve', 'reject'].includes(val),
    { message: "Action must be 'approve' or 'reject'" }
  ),
  rejectionReason: z.string().nullable().optional().transform(val => val || undefined),
});

export async function approveGroup(formData: FormData) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const user = session.user as { id: string; role?: string | null };

  // Only faculty (or admin) can approve
  if (user.role !== 'faculty' && user.role !== 'admin') {
    throw new Error("Unauthorized");
  }

  // Log incoming form data for debugging
  const rawData = {
    groupId: formData.get('groupId'),
    action: formData.get('action'),
    rejectionReason: formData.get('rejectionReason'),
  };
  console.log('[approveGroup] Raw form data:', rawData);

  const validatedFields = ApproveGroupSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error('[approveGroup] Validation error:', validatedFields.error.flatten());
    throw new Error('Invalid fields: ' + validatedFields.error.issues.map(i => i.message).join(', '));
  }

  const { groupId, action, rejectionReason } = validatedFields.data;
  const status = action === 'approve' ? 'approved' : 'rejected';
  const staffId = parseInt(user.id);
  console.log('[approveGroup] Updating group:', { groupId, status, staffId, action });

  try {
    await prisma.project_group.update({
      where: { project_group_id: groupId },
      data: {
        status: status,
        proposal_reviewed_at: new Date(),
        proposal_reviewed_by: staffId,
        rejection_reason: action === 'reject' ? rejectionReason : null,
        modified_at: new Date(),
      }
    });
    console.log('[approveGroup] Successfully updated group status');

    // Save structured proposal feedback if provided
    const feedbackRaw = formData.get('proposalFeedback') as string | null;
    if (feedbackRaw) {
      try {
        const feedback = JSON.parse(feedbackRaw);
        const { ratings, overallComments, sectionComments } = feedback;

        await prisma.proposal_feedback.upsert({
          where: {
            project_group_id_reviewer_id: {
              project_group_id: groupId,
              reviewer_id: staffId,
            },
          },
          update: {
            problem_clarity: ratings?.problemClarity || 0,
            methodology: ratings?.methodology || 0,
            feasibility: ratings?.feasibility || 0,
            innovation: ratings?.innovation || 0,
            overall_comments: overallComments || null,
            section_comments: sectionComments ? JSON.stringify(sectionComments) : null,
          },
          create: {
            project_group_id: groupId,
            reviewer_id: staffId,
            problem_clarity: ratings?.problemClarity || 0,
            methodology: ratings?.methodology || 0,
            feasibility: ratings?.feasibility || 0,
            innovation: ratings?.innovation || 0,
            overall_comments: overallComments || null,
            section_comments: sectionComments ? JSON.stringify(sectionComments) : null,
          },
        });
        console.log('[approveGroup] Saved structured feedback');
      } catch (e) {
        console.error('[approveGroup] Failed to save feedback:', e);
        // Don't fail the main action
      }
    }
  } catch (error) {
    console.error("[approveGroup] Failed to update group status:", error);
    throw error instanceof Error ? error : new Error(String(error));
  }

  revalidatePath('/dashboard/faculty/groups');
  revalidatePath('/dashboard/student/my-group');
  
  return { success: true, status };
}

const SubmitReportSchema = z.object({
    weekNumber: z.coerce.number().min(1),
    content: z.string().min(10, "Report content must be at least 10 characters long."),
});

export async function submitReport(formData: FormData) {
    const session = await auth();
    if (!session || !session.user) {
        throw new Error("Unauthorized");
    }

    const user = session.user as { id: string; role?: string | null };

    if (user.role !== 'student') {
        throw new Error("Unauthorized");
    }

    const studentId = parseInt(user.id);

    const validatedFields = SubmitReportSchema.safeParse({
        weekNumber: formData.get('weekNumber'),
        content: formData.get('content'),
    });

    if (!validatedFields.success) {
        throw new Error('Invalid fields');
    }

    const { weekNumber, content } = validatedFields.data;

    // fetch student group
    const studentWithGroup = await prisma.student.findUnique({
        where: { student_id: studentId },
        include: {
            project_group_member: {
                include: {
                    project_group: true
                }
            }
        }
    });

    const group = studentWithGroup?.project_group_member[0]?.project_group;

    if (!group) {
        throw new Error("You must be in a project group to submit a report.");
    }

    try {
        await prisma.weekly_report.create({
            data: {
                project_group_id: group.project_group_id,
                week_number: weekNumber,
                report_content: content,
                submission_date: new Date(),
                created_at: new Date(),
                modified_at: new Date(),
            }
        });

        // Notify faculty guide
        if (group.guide_staff_id) {
            try {
                await createNotification({
                    userId: group.guide_staff_id,
                    userRole: 'faculty',
                    title: 'New Report Submitted',
                    message: `Week ${weekNumber} report submitted by ${group.project_group_name}.`,
                    link: '/dashboard/faculty/reviews',
                });
            } catch (e) { /* notification failure should not break main action */ }
        }
    } catch (error) {
        console.error("Failed to submit report:", error);
        throw new Error("Failed to submit report");
    }

    revalidatePath('/dashboard/student/reports');
}

const ReviewReportSchema = z.object({
    reportId: z.coerce.number(),
    feedback: z.string().min(1, "Feedback cannot be empty"),
    marks: z.coerce.number().min(0).max(100).optional().nullable(),
    status: z.string().default("reviewed"),
});

export async function updateReportFeedback(formData: FormData) {
    const session = await auth();
    if (!session || !session.user) {
        throw new Error("Unauthorized");
    }

    const user = session.user as { id: string; role?: string | null };

    if (user.role !== 'faculty') {
        throw new Error("Unauthorized");
    }

    const marksRaw = formData.get('marks');
    const marks = marksRaw && marksRaw !== '' ? Number(marksRaw) : null;

    const validatedFields = ReviewReportSchema.safeParse({
        reportId: formData.get('reportId'),
        feedback: formData.get('feedback'),
        marks: marks,
    });

    if (!validatedFields.success) {
        throw new Error('Invalid fields');
    }

    const { reportId, feedback, marks: validatedMarks, status } = validatedFields.data;

    try {
        const report = await prisma.weekly_report.update({
            where: { report_id: reportId },
            data: {
                feedback: feedback,
                marks: validatedMarks,
                status: status,
                modified_at: new Date()
            },
            include: { project_group: { include: { project_group_member: true } } }
        });

        // Notify all group members about the feedback
        try {
            for (const member of report.project_group.project_group_member) {
                await createNotification({
                    userId: member.student_id,
                    userRole: 'student',
                    title: 'Report Reviewed',
                    message: `Your Week ${report.week_number} report has been reviewed${validatedMarks ? ` — Marks: ${validatedMarks}/100` : ''}.`,
                    link: '/dashboard/student/reports',
                });
            }
        } catch (e) { /* notification failure should not break main action */ }
    } catch (error) {
        console.error("Failed to update report feedback:", error);
        throw new Error("Failed to update report feedback");
    }

    revalidatePath('/dashboard/faculty/reviews');
    revalidatePath('/dashboard/student/reports');
}

const ScheduleMeetingSchema = z.object({
    projectGroupId: z.coerce.number(),
    meetingDate: z.string(), // Input type="datetime-local" returns string
    meetingPurpose: z.string().min(3, "Purpose must be at least 3 characters."),
    meetingLocation: z.string().optional(),
    description: z.string().optional(),
});

export async function scheduleMeeting(formData: FormData) {
    const session = await auth();
    if (!session || !session.user) {
        throw new Error("Unauthorized");
    }

    const user = session.user as { id: string; role?: string | null };

    if (user.role !== 'faculty') {
        throw new Error("Unauthorized");
    }

    const staffId = parseInt(user.id);

    const validatedFields = ScheduleMeetingSchema.safeParse({
        projectGroupId: formData.get('projectGroupId'),
        meetingDate: formData.get('meetingDate'),
        meetingPurpose: formData.get('meetingPurpose'),
        meetingLocation: formData.get('meetingLocation'),
        description: formData.get('description'),
    });

    if (!validatedFields.success) {
        throw new Error('Invalid fields');
    }

    const { projectGroupId, meetingDate, meetingPurpose, meetingLocation, description } = validatedFields.data;

    try {
        await prisma.project_meeting.create({
            data: {
                project_group_id: projectGroupId,
                guide_staff_id: staffId,
                meeting_datetime: new Date(meetingDate),
                meeting_purpose: meetingPurpose,
                meeting_location: meetingLocation,
                description: description,
                meeting_status: 'scheduled',
                created_at: new Date(),
                modified_at: new Date(),
            }
        });

        // Notify all group members about the new meeting
        try {
            const members = await prisma.project_group_member.findMany({
                where: { project_group_id: projectGroupId },
            });
            for (const member of members) {
                await createNotification({
                    userId: member.student_id,
                    userRole: 'student',
                    title: 'New Meeting Scheduled',
                    message: `A meeting has been scheduled for ${new Date(meetingDate).toLocaleDateString()}${meetingPurpose ? `: ${meetingPurpose}` : ''}.`,
                    link: '/dashboard/student/schedule',
                });
            }
        } catch (e) { /* notification failure should not break main action */ }
    } catch (error) {
        console.error("Failed to schedule meeting:", error);
        throw new Error("Failed to schedule meeting");
    }

    revalidatePath('/dashboard/faculty/schedule');
    revalidatePath('/dashboard/student/schedule');
}

const AssignGuideSchema = z.object({
    groupId: z.coerce.number(),
    guideId: z.string(),
});

export async function assignGuide(formData: FormData) {
    const session = await auth();
    if (!session || !session.user) {
        throw new Error("Unauthorized");
    }

    const user = session.user as { id: string; role?: string | null };

    if (user.role !== 'student') {
        throw new Error("Unauthorized");
    }

    const studentId = parseInt(user.id);

    const validatedFields = AssignGuideSchema.safeParse({
        groupId: formData.get('groupId'),
        guideId: formData.get('guideId'),
    });

    if (!validatedFields.success) {
        throw new Error('Invalid fields');
    }

    const { groupId, guideId } = validatedFields.data;

    // Verify student is leader of the group
    const membership = await prisma.project_group_member.findUnique({
        where: {
            project_group_id_student_id: {
                project_group_id: groupId,
                student_id: studentId
            }
        }
    });

    if (!membership || !membership.is_group_leader) {
        throw new Error("Only the group leader can assign a guide.");
    }

    try {
        await prisma.project_group.update({
            where: { project_group_id: groupId },
            data: {
                staff_project_group_guide_staff_idTostaff: { connect: { staff_id: parseInt(guideId) } },
                modified_at: new Date()
            }
        });
    } catch (error) {
        console.error("Failed to assign guide:", error);
        throw new Error("Failed to assign guide");
    }

    revalidatePath('/dashboard/student/my-group');
}

const UpdateStudentProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().optional(),
  description: z.string().optional(),
  skills: z.string().optional(),
});

export async function updateStudentProfile(formData: FormData) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const user = session.user as { id: string; role?: string | null };

  if (user.role !== 'student') {
    throw new Error("Unauthorized");
  }

  const studentId = parseInt(user.id);

  const validatedFields = UpdateStudentProfileSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    description: formData.get('description'),
    skills: formData.get('skills'),
  });

  if (!validatedFields.success) {
    throw new Error("Invalid fields");
  }

  const { name, phone, description, skills } = validatedFields.data;

  // Parse skills JSON string to array
  let skillsArray: string[] = [];
  if (skills) {
    try {
      skillsArray = JSON.parse(skills);
    } catch { skillsArray = []; }
  }

  try {
    await prisma.student.update({
      where: { student_id: studentId },
      data: {
        student_name: name,
        phone: phone,
        description: description,
        skills: skillsArray,
        modified_at: new Date()
      }
    });
  } catch (error) {
    console.error("Failed to update student profile:", error);
    throw new Error("Failed to update profile");
  }

  revalidatePath('/dashboard/student/settings');
  revalidatePath('/dashboard/student/profile'); // If profile page exists
}

const UpdateFacultyProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  phone: z.string().optional(),
  description: z.string().optional(),
  skills: z.string().optional(),
});

export async function updateFacultyProfile(formData: FormData) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const user = session.user as { id: string; role?: string | null };

  if (user.role !== 'faculty') {
    throw new Error("Unauthorized");
  }

  const staffId = parseInt(user.id);

  const validatedFields = UpdateFacultyProfileSchema.safeParse({
    name: formData.get('name'),
    phone: formData.get('phone'),
    description: formData.get('description'),
    skills: formData.get('skills'),
  });

  if (!validatedFields.success) {
    throw new Error("Invalid fields");
  }

  const { name, phone, description, skills } = validatedFields.data;

  // Parse skills JSON string to array
  let skillsArray: string[] = [];
  if (skills) {
    try {
      skillsArray = JSON.parse(skills);
    } catch { skillsArray = []; }
  }

  try {
    await prisma.staff.update({
      where: { staff_id: staffId },
      data: {
        staff_name: name,
        phone: phone,
        description: description,
        skills: skillsArray,
        modified_at: new Date()
      }
    });
  } catch (error) {
    console.error("Failed to update faculty profile:", error);
    throw new Error("Failed to update profile");
  }
}

const UpdateMeetingSchema = z.object({
  meetingId: z.coerce.number(),
  meetingDate: z.string(),
  meetingPurpose: z.string().min(3, "Purpose must be at least 3 characters.").optional(),
  meetingLocation: z.string().optional(),
  description: z.string().optional(),
  status: z.string().optional(),
  statusDescription: z.string().optional(),
});

export async function updateMeeting(formData: FormData) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const user = session.user as { id: string; role?: string | null };

  if (user.role !== 'faculty') {
    throw new Error("Unauthorized");
  }

  const validatedFields = UpdateMeetingSchema.safeParse({
    meetingId: formData.get('meetingId'),
    meetingDate: formData.get('meetingDate'),
    meetingPurpose: formData.get('meetingPurpose'),
    meetingLocation: formData.get('meetingLocation'),
    description: formData.get('description'),
    status: formData.get('status'),
    statusDescription: formData.get('statusDescription'),
  });

  if (!validatedFields.success) {
    throw new Error('Invalid fields');
  }

  const { meetingId, meetingDate, meetingPurpose, meetingLocation, description, status, statusDescription } = validatedFields.data;
  const now = new Date();

  try {
    await prisma.project_meeting.update({
      where: { project_meeting_id: meetingId },
      data: {
        meeting_datetime: new Date(meetingDate),
        meeting_purpose: meetingPurpose ?? undefined,
        meeting_location: meetingLocation ?? undefined,
        description: description,
        meeting_status: status || 'scheduled',
        meeting_status_description: statusDescription,
        meeting_status_datetime: status ? now : undefined,
        modified_at: now,
      }
    });
  } catch (error) {
    console.error("Failed to update meeting:", error);
    throw new Error("Failed to update meeting");
  }

  revalidatePath('/dashboard/faculty/schedule');
  revalidatePath('/dashboard/student/schedule');
}

const AttendanceSchema = z.object({
  meetingId: z.coerce.number(),
  attendanceData: z.string(), // JSON string of { studentId: number, isPresent: boolean, remarks?: string }[]
});

export async function markAttendance(formData: FormData) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const user = session.user as { id: string; role?: string | null };

  if (user.role !== 'faculty') {
    throw new Error("Unauthorized");
  }

  const validatedFields = AttendanceSchema.safeParse({
    meetingId: formData.get('meetingId'),
    attendanceData: formData.get('attendanceData'),
  });

  if (!validatedFields.success) {
    throw new Error('Invalid fields');
  }

  const { meetingId, attendanceData } = validatedFields.data;
  const students = JSON.parse(attendanceData) as { studentId: number, isPresent: boolean, remarks?: string }[];

  const now = new Date();

  try {
    await prisma.$transaction(async (tx) => {
      // Update meeting status to completed and record status datetime
      await tx.project_meeting.update({
        where: { project_meeting_id: meetingId },
        data: {
          meeting_status: 'completed',
          meeting_status_datetime: now,
          modified_at: now,
        },
      });

      // Upsert attendance records
      for (const student of students) {
        await tx.project_meeting_attendance.upsert({
          where: {
            project_meeting_id_student_id: {
              project_meeting_id: meetingId,
              student_id: student.studentId,
            },
          },
          update: {
            is_present: student.isPresent,
            attendance_remarks: student.remarks,
            modified_at: now,
          },
          create: {
            project_meeting_id: meetingId,
            student_id: student.studentId,
            is_present: student.isPresent,
            attendance_remarks: student.remarks,
            created_at: now,
            modified_at: now,
          },
        });
      }
    });
  } catch (error) {
    console.error("Failed to mark attendance:", error);
    throw new Error("Failed to mark attendance");
  }

  revalidatePath('/dashboard/faculty/schedule');
}

const InviteMemberSchema = z.object({
  email: z.string().email(),
});

export async function inviteMember(formData: FormData) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const user = session.user as { id: string; role?: string | null };

  if (user.role !== 'student') {
    throw new Error("Unauthorized");
  }

  const studentId = parseInt(user.id);

  const validatedFields = InviteMemberSchema.safeParse({
    email: formData.get('email'),
  });

  if (!validatedFields.success) {
    throw new Error('Invalid email');
  }

  const { email } = validatedFields.data;

  // Get current student's group
  const membership = await prisma.project_group_member.findFirst({
    where: { student_id: studentId },
  });

  if (!membership || !membership.is_group_leader) {
    throw new Error("Only group leaders can invite members.");
  }

  // Check if invited student exists
  const invitedStudent = await prisma.student.findUnique({
    where: { email: email }
  });

  if (!invitedStudent) {
    throw new Error("Student not found with this email.");
  }

  // Check if invited student is already in a group
  const existingMembership = await prisma.project_group_member.findFirst({
    where: { student_id: invitedStudent.student_id }
  });

  if (existingMembership) {
    throw new Error("Student is already in a group.");
  }

  try {
    await prisma.project_invitation.create({
      data: {
        project_group_id: membership.project_group_id,
        invited_student_email: email,
        created_at: new Date(),
        modified_at: new Date(),
      }
    });

    // Notify the invited student
    try {
      const group = await prisma.project_group.findUnique({ where: { project_group_id: membership.project_group_id } });
      await createNotification({
          userId: invitedStudent.student_id,
          userRole: 'student',
          title: 'Group Invitation',
          message: `You have been invited to join "${group?.project_group_name || 'a project group'}".`,
          link: '/dashboard/student/my-group',
      });
    } catch (e) { /* notification failure should not break main action */ }
  } catch (error) {
    console.error("Failed to invite member:", error);
    throw new Error("Failed to send invitation. Check if already invited.");
  }

  revalidatePath('/dashboard/student/my-group');
}

const RespondInvitationSchema = z.object({
  invitationId: z.coerce.number(),
  action: z.enum(["accept", "reject"]),
});

export async function respondToInvitation(formData: FormData) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const user = session.user as { id: string; role?: string | null; email?: string | null };

  if (user.role !== 'student') {
    throw new Error("Unauthorized");
  }

  const studentId = parseInt(user.id);
  const studentEmail = user.email;

  if (!studentEmail) {
    throw new Error("Email not found in session");
  }

  const validatedFields = RespondInvitationSchema.safeParse({
    invitationId: formData.get('invitationId'),
    action: formData.get('action'),
  });

  if (!validatedFields.success) {
    throw new Error('Invalid fields');
  }

  const { invitationId, action } = validatedFields.data;

  const invitation = await prisma.project_invitation.findUnique({
    where: { invitation_id: invitationId },
  });

  if (!invitation || invitation.invited_student_email !== studentEmail) {
    throw new Error("Invitation not found or not for you.");
  }

  if (invitation.status !== 'pending') {
    throw new Error("Invitation already responded to.");
  }

  try {
    if (action === 'reject') {
      await prisma.project_invitation.update({
        where: { invitation_id: invitationId },
        data: { status: 'rejected', modified_at: new Date() },
      });
    } else {
      await prisma.$transaction(async (tx) => {
        // Update invitation
        await tx.project_invitation.update({
          where: { invitation_id: invitationId },
          data: { status: 'accepted', modified_at: new Date() },
        });

        // Add to group
        await tx.project_group_member.create({
          data: {
            project_group_id: invitation.project_group_id,
            student_id: studentId,
            is_group_leader: false,
            created_at: new Date(),
            modified_at: new Date(),
          },
        });
      });
    }
  } catch (error) {
    console.error("Failed to respond to invitation:", error);
    throw new Error("Failed to process response.");
  }

  revalidatePath('/dashboard/student/my-group');
}

const UploadDocumentSchema = z.object({
  groupId: z.coerce.number(),
  title: z.string().min(3, "Title must be at least 3 characters"),
});

export async function uploadDocument(formData: FormData) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const user = session.user as { id: string; role?: string | null };

  // Only students can upload for now (or faculty too?)
  // Let's allow both, but primarily this is for students uploading reports
  // Implementation Plan said "Student UI", so let's enforce student for now or generic check
  if (user.role !== 'student') {
     throw new Error("Unauthorized");
  }

  const file = formData.get('file') as File;
  
  if (!file) {
    throw new Error("No file provided");
  }

  if (file.size === 0) {
      throw new Error("File is empty");
  }
  
  // Basic validation: max 5MB
  if (file.size > 5 * 1024 * 1024) {
      throw new Error("File size exceeds 5MB limit");
  }

  const validatedFields = UploadDocumentSchema.safeParse({
    groupId: formData.get('groupId'),
    title: formData.get('title'),
  });

  if (!validatedFields.success) {
    throw new Error("Invalid fields");
  }

  const { groupId, title } = validatedFields.data;

  // Verify membership
  const studentId = parseInt(user.id);
  const membership = await prisma.project_group_member.findUnique({
      where: {
          project_group_id_student_id: {
              project_group_id: groupId,
              student_id: studentId
          }
      }
  });

  if (!membership) {
      throw new Error("You are not a member of this group");
  }

  try {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Ensure upload directory exists
      const uploadDir = join(process.cwd(), 'public', 'uploads');
      try {
        await mkdir(uploadDir, { recursive: true });
      } catch (e) {
          // Ignore if exists
      }

      // Sanitize filename
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '');
      const fileName = `${Date.now()}-${safeName}`;
      const filePath = join(uploadDir, fileName);

      await writeFile(filePath, buffer);
      
      const publicPath = `/uploads/${fileName}`;

      await prisma.project_document.create({
          data: {
              project_group_id: groupId,
              title: title,
              file_path: publicPath,
              uploaded_at: new Date()
          }
      });

  } catch (error) {
      console.error("Failed to upload document:", error);
      throw new Error("Failed to upload document");
  }

  revalidatePath('/dashboard/student/my-group');
  revalidatePath(`/dashboard/faculty/groups/${groupId}`);
}

// ============================================
// FACULTY — SEARCH STUDENTS BY SKILLS
// ============================================

export async function searchStudentsBySkills(skills: string[]) {
  const session = await auth();
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }

  const user = session.user as { id: string; role?: string | null };

  if (user.role !== 'faculty' && user.role !== 'admin') {
    throw new Error("Unauthorized");
  }

  if (!skills || skills.length === 0) {
    return [];
  }

  try {
    const students = await prisma.student.findMany({
      where: {
        skills: {
          hasSome: skills,
        },
      },
      select: {
        student_id: true,
        student_name: true,
        email: true,
        skills: true,
        project_group_member: {
          select: {
            project_group: {
              select: {
                project_group_name: true,
                project_title: true,
              }
            }
          }
        }
      },
      orderBy: { student_name: 'asc' },
    });

    return students.map(s => ({
      student_id: s.student_id,
      student_name: s.student_name,
      email: s.email,
      skills: s.skills,
      group: s.project_group_member.length > 0
        ? {
            name: s.project_group_member[0].project_group.project_group_name,
            project: s.project_group_member[0].project_group.project_title,
          }
        : null,
    }));
  } catch (error) {
    console.error("Failed to search students:", error);
    throw new Error("Failed to search students");
  }
}
