const { z } = require("zod");

// Version-proof email check (zod v4 moved z.string().email()).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Email is too long")
  .regex(EMAIL_REGEX, "Email must be a valid email format");

const registerSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
    email: emailField,
    password: z
      .string()
      .min(6, "Password must be at least 6 characters long")
      .max(128, "Password is too long"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email is required").max(254),
  password: z.string().min(1, "Password is required").max(128),
});

const codeField = z.string().trim().regex(/^\d{6}$/, "Code must be a 6-digit number");

const strongPassword = z
  .string()
  .min(6, "Password must be at least 6 characters long")
  .max(128, "Password is too long");

const verifyEmailSchema = z.object({ email: emailField, code: codeField });

const resendSchema = z.object({ email: emailField });

const forgotSchema = z.object({ email: emailField });

const resetSchema = z
  .object({
    email: emailField,
    code: codeField,
    newPassword: strongPassword,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: strongPassword,
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

module.exports = {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendSchema,
  forgotSchema,
  resetSchema,
  changePasswordSchema,
};
