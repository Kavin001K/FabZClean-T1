import { Router } from "express";
import multer from "multer";
import { storage } from "../db";
import { insertFranchiseSchema, insertEmployeeTaskSchema, insertEmployeeAttendanceSchema } from "../../shared/schema";
import { z } from "zod";
import path from "path";
import fs from "fs";

const router = Router();

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), "uploads", "documents");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
            cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
        },
    }),
});

// Create Franchise
router.post("/", upload.array("documents"), async (req, res) => {
    try {
        const documents = (req.files as Express.Multer.File[])?.map((file) => ({
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size,
        })) || [];

        // Parse body data (it comes as stringified JSON if multipart/form-data is used for everything, 
        // or individual fields. Assuming individual fields for simplicity or a 'data' field)
        // For simplicity, let's assume the client sends a 'data' field which is a JSON string
        let franchiseData;
        if (req.body.data) {
            franchiseData = JSON.parse(req.body.data);
        } else {
            franchiseData = req.body;
        }

        // Generate Franchise ID if not provided
        if (!franchiseData.franchiseId) {
            const franchises = await storage.listFranchises();
            const currentYear = new Date().getFullYear();
            const prefix = `FR-${currentYear}-`;

            // Find max sequence number for current year
            let maxSequence = 0;
            for (const f of franchises) {
                if (f.franchiseId && f.franchiseId.startsWith(prefix)) {
                    const parts = f.franchiseId.split('-');
                    if (parts.length === 3) {
                        const seq = parseInt(parts[2], 10);
                        if (!isNaN(seq) && seq > maxSequence) {
                            maxSequence = seq;
                        }
                    }
                }
            }

            franchiseData.franchiseId = `${prefix}${String(maxSequence + 1).padStart(3, '0')}`;
        }

        const validatedData = insertFranchiseSchema.parse({
            ...franchiseData,
            documents: documents,
        });

        const franchise = await storage.createFranchise(validatedData);
        res.status(201).json(franchise);
    } catch (error) {
        console.error("Create franchise error:", error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: "Validation error", errors: error.errors });
        } else {
            res.status(500).json({ message: "Failed to create franchise" });
        }
    }
});

// List Franchises
router.get("/", async (req, res) => {
    try {
        const franchises = await storage.listFranchises();
        res.json(franchises);
    } catch (error) {
        console.error("List franchises error:", error);
        res.status(500).json({ message: "Failed to list franchises" });
    }
});

// Get Franchise
router.get("/:id", async (req, res) => {
    try {
        const franchise = await storage.getFranchise(req.params.id);
        if (!franchise) {
            return res.status(404).json({ message: "Franchise not found" });
        }
        res.json(franchise);
    } catch (error) {
        console.error("Get franchise error:", error);
        res.status(500).json({ message: "Failed to get franchise" });
    }
});

// Update Franchise
router.put("/:id", upload.array("documents"), async (req, res) => {
    try {
        const documents = (req.files as Express.Multer.File[])?.map((file) => ({
            filename: file.filename,
            originalName: file.originalname,
            path: file.path,
            mimetype: file.mimetype,
            size: file.size,
        })) || [];

        let franchiseData;
        if (req.body.data) {
            franchiseData = JSON.parse(req.body.data);
        } else {
            franchiseData = req.body;
        }

        // If new documents are uploaded, append them to existing ones or replace?
        // For now, let's assume we append if documents are provided
        if (documents.length > 0) {
            const existing = await storage.getFranchise(req.params.id);
            const existingDocs = existing?.documents ? (Array.isArray(existing.documents) ? existing.documents : JSON.parse(existing.documents as unknown as string)) : [];
            franchiseData.documents = [...existingDocs, ...documents];
        }

        const updatedFranchise = await storage.updateFranchise(req.params.id, franchiseData);
        if (!updatedFranchise) {
            return res.status(404).json({ message: "Franchise not found" });
        }
        res.json(updatedFranchise);
    } catch (error) {
        console.error("Update franchise error:", error);
        res.status(500).json({ message: "Failed to update franchise" });
    }
});

// Delete Franchise
router.delete("/:id", async (req, res) => {
    try {
        const success = await storage.deleteFranchise(req.params.id);
        if (!success) {
            return res.status(404).json({ message: "Franchise not found" });
        }
        res.status(204).send();
    } catch (error) {
        console.error("Delete franchise error:", error);
        res.status(500).json({ message: "Failed to delete franchise" });
    }
});

// Create Task
router.post("/:id/tasks", async (req, res) => {
    try {
        const franchiseId = req.params.id;
        const validatedData = insertEmployeeTaskSchema.parse({
            ...req.body,
            franchiseId,
        });

        const task = await storage.createTask(validatedData);
        res.status(201).json(task);
    } catch (error) {
        console.error("Create task error:", error);
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: "Validation error", errors: error.errors });
        } else {
            res.status(500).json({ message: "Failed to create task" });
        }
    }
});

// List Tasks
router.get("/:id/tasks", async (req, res) => {
    try {
        const franchiseId = req.params.id;
        const tasks = await storage.listTasks(franchiseId);
        res.json(tasks);
    } catch (error) {
        console.error("List tasks error:", error);
        res.status(500).json({ message: "Failed to list tasks" });
    }
});

// Mark Attendance
router.post("/:id/attendance", async (req, res) => {
    try {
        const franchiseId = req.params.id;
        const { employeeId, date, status, clockIn, clockOut, locationCheckIn } = req.body;

        // Parse and validate the date
        const attendanceDate = date ? new Date(date) : new Date();
        const dateString = attendanceDate.toISOString().split('T')[0];

        console.log('Marking attendance:', {
            franchiseId,
            employeeId,
            date: dateString,
            status,
            clockIn,
            clockOut
        });

        // Check if attendance already exists for this employee on this date
        const existingAttendance = await storage.listAttendance(franchiseId, employeeId, attendanceDate);

        let attendance;
        if (existingAttendance && existingAttendance.length > 0) {
            // Update existing attendance
            console.log('Updating existing attendance:', existingAttendance[0].id);
            attendance = await storage.updateAttendance(existingAttendance[0].id, {
                status,
                clockIn: clockIn || existingAttendance[0].clockIn,
                clockOut: clockOut || existingAttendance[0].clockOut,
                locationCheckIn: locationCheckIn || existingAttendance[0].locationCheckIn,
            });
        } else {
            // Create new attendance record
            console.log('Creating new attendance record');
            const validatedData = insertEmployeeAttendanceSchema.parse({
                franchiseId,
                employeeId,
                date: attendanceDate,
                status,
                clockIn: clockIn ? new Date(clockIn) : null,
                clockOut: clockOut ? new Date(clockOut) : null,
                locationCheckIn,
            });
            attendance = await storage.createAttendance(validatedData);
        }

        console.log('Attendance saved:', attendance);
        res.status(201).json(attendance);
    } catch (error) {
        console.error("Mark attendance error:", error instanceof Error ? error.message : String(error));
        if (error instanceof z.ZodError) {
            res.status(400).json({ message: "Validation error", errors: error.errors });
        } else {
            res.status(500).json({ message: "Failed to mark attendance" });
        }
    }
});

// List Attendance
router.get("/:id/attendance", async (req, res) => {
    try {
        const franchiseId = req.params.id;
        const { employeeId, date } = req.query;

        const attendance = await storage.listAttendance(
            franchiseId,
            employeeId as string,
            date ? new Date(date as string) : undefined
        );
        res.json(attendance);
    } catch (error) {
        console.error("List attendance error:", error);
        res.status(500).json({ message: "Failed to list attendance" });
    }
});

// List Employees for Franchise
router.get("/:id/employees", async (req, res) => {
    try {
        const franchiseId = req.params.id;
        const employees = await storage.getEmployees();
        // Filter by franchiseId and exclude admin role
        const franchiseEmployees = employees.filter((emp: any) =>
            emp.franchiseId === franchiseId && emp.role !== 'admin'
        );
        res.json(franchiseEmployees);
    } catch (error) {
        console.error("List franchise employees error:", error);
        res.status(500).json({ message: "Failed to list franchise employees" });
    }
});

export default router;
