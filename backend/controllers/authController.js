
const User = require("../model/User");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const jwt = require("jsonwebtoken");

// Generate JWT token
const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is missing in environment variables");
    }

    return jwt.sign(
        { id },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
};

// Register user
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (
            typeof name !== "string" ||
            typeof email !== "string" ||
            typeof password !== "string" ||
            !name.trim() ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Name, email and password are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const existingUser = await User.findOne({
            email: normalizedEmail
        });

        if (existingUser) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const otp = crypto.randomInt(100000, 1000000).toString();
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            emailOtp: otp,
            emailOtpExpiresAt: otpExpiry,
            isEmailVerified: false
        });

        const message = `
Welcome to ATech Store, ${user.name}!

Your email verification OTP is: ${otp}

This OTP will expire in 10 minutes.
If you did not request this, please ignore this email.
        `;

        try {
            await sendEmail(
                user.email,
                "ATech Store - Email Verification OTP",
                message
            );
        } catch (emailError) {
            console.error("Verification email error:", emailError);

            await User.deleteOne({ _id: user._id });

            return res.status(500).json({
                message: "Could not send verification email. Please try again."
            });
        }

        return res.status(201).json({
            message: "Registration successful. Please verify your email using the OTP."
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "User already exists"
            });
        }

        console.error("Registration error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

// Login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (
            typeof email !== "string" ||
            typeof password !== "string" ||
            !email.trim() ||
            !password
        ) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const normalizedEmail = email.trim().toLowerCase();

        const user = await User.findOne({
            email: normalizedEmail
        });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        // Require email verification before login
        if (!user.isEmailVerified) {
            return res.status(403).json({
                message: "Please verify your email before logging in"
            });
        }

        const token = generateToken(user._id);

        return res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

// Logout user
const logoutUser = async (req, res) => {
    return res.status(200).json({
        message: "Logout successful. Please remove your token on the client."
    });
};

// Get all users (admin only; route must use protect and admin middleware)
const getUsers = async (req, res) => {
    try {
        const users = await User.find({})
            .select("-password -emailOtp -emailOtpExpiresAt");

        return res.status(200).json(users);

    } catch (error) {
        console.error("Get users error:", error);

        return res.status(500).json({
            message: "Internal server error"
        });
    }
};

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getUsers,
    generateToken
};
