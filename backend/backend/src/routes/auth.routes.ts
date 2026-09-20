import { Router } from "express";
import { login, getUsers, sendOtp, registerWithOtp } from "../controllers/auth.controller";

const router = Router();

router.post("/send-otp", sendOtp);
router.post("/register-with-otp", registerWithOtp);
router.post("/login", login);
router.get("/users", getUsers);

export default router;
