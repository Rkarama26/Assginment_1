import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  requireAuth,
  requireWorkspaceAccess,
} from "../middleware/auth.js";
import {
  createWorkspaceHandler,
  getWorkspace,
  listWorkspaces,
  updateWorkspaceHandler,
} from "../controllers/workspace.controller.js";
import {
  getDocument,
  listDocuments,
} from "../controllers/document.controller.js";
import { upload } from "../config/multer.js";
import { uploadPdf } from "../controllers/upload.controller.js";

function uploadPdfMiddleware(req, res, next) {
  upload.single("pdf")(req, res, (err) => {
    if (err) {
      return next(err);
    }
    next();
  });
}

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(listWorkspaces));
router.post("/", asyncHandler(createWorkspaceHandler));

router.use("/:workspaceId", requireWorkspaceAccess);

router.get("/:workspaceId", asyncHandler(getWorkspace));
router.patch("/:workspaceId", asyncHandler(updateWorkspaceHandler));

router.get("/:workspaceId/documents", asyncHandler(listDocuments));
router.get("/:workspaceId/documents/:documentId", asyncHandler(getDocument));

router.post(
  "/:workspaceId/upload/pdf",
  uploadPdfMiddleware,
  asyncHandler(uploadPdf),
);

export default router;
