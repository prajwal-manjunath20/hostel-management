const { body } = require("express-validator");

// Register validation rules
exports.registerValidation = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required")
        .isLength({ min: 3, max: 50 })
        .withMessage("Name must be between 3 and 50 characters"),

    body("email")
        .trim()
        .isEmail()
        .withMessage("Invalid email format")
        .isLength({ max: 100 })
        .withMessage("Email must be less than 100 characters")
        .normalizeEmail(),

    body("password")
        .isStrongPassword({
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minNumbers: 1,
            minSymbols: 1
        })
        .withMessage(
            "Password must be 8+ characters and include uppercase, lowercase, number & special character (@$!%*?&)"
        ),

    body("role")
        .optional()
        .isIn(["admin", "staff", "resident"])
        .withMessage("Invalid role. Must be admin, staff, or resident"),

    body("phone")
        .optional()
        .trim()
        .isMobilePhone()
        .withMessage("Invalid phone number format")
];

// Login validation rules
exports.loginValidation = [
    body("email")
        .trim()
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),

    body("password")
        .notEmpty()
        .withMessage("Password is required")
];
