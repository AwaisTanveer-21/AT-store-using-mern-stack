
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        password: {
            type: String,
            required: true,
            select: false
        },

        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        },

        isEmailVerified: {
            type: Boolean,
            default: false
        },

        emailOtp: {
            type: String,
            default: null,
            select: false
        },

        emailOtpExpiresAt: {
            type: Date,
            default: null,
            select: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('User', userSchema);
