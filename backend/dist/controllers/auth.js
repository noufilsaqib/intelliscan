"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePassword = exports.sendForgotPasswordEmail = exports.loginUser = exports.registerUser = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const nodemailer_1 = __importDefault(require("nodemailer"));
const User_1 = __importDefault(require("../models/User"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const Otp_1 = __importDefault(require("../models/Otp"));
const Api_1 = __importDefault(require("../models/Api"));
const user_1 = require("../messages/lang/en/user");
const transporter = nodemailer_1.default.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    auth: {
        user: process.env.NODEMAIL_USER,
        pass: process.env.NODEMAIL_PASS,
    },
});
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = req.body;
    try {
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(password, salt);
        const user = new User_1.default({
            name: name,
            email: email,
            password: hashedPassword,
            admin: false,
        });
        yield user.save();
        const apiEndpoints = [
            {
                method: "POST",
                endpoint: "/api/v1/user/register",
                requests: 1,
            },
            {
                method: "POST",
                endpoint: "/api/v1/user/login",
                requests: 0,
            },
            {
                method: "POST",
                endpoint: "/api/v1/user/forgot-password",
                requests: 0,
            },
            {
                method: "POST",
                endpoint: "/api/v1/user/reset-password",
                requests: 0,
            },
            {
                method: "POST",
                endpoint: "/api/v1/file/prompt",
                requests: 0,
            },
            {
                method: "GET",
                endpoint: "/api/v1/protected/users",
                requests: 0,
            },
            {
                method: "DELETE",
                endpoint: "/api/v1/protected/users/:id",
                requests: 0,
            },
            {
                method: "PUT",
                endpoint: "/api/v1/protected/users/:id",
                requests: 0,
            },
        ];
        apiEndpoints.forEach((endpoint) => __awaiter(void 0, void 0, void 0, function* () {
            const api = new Api_1.default({
                user: user._id,
                method: endpoint.method,
                endpoint: endpoint.endpoint,
                requests: endpoint.requests,
            });
            yield api.save();
        }));
        res.send({ user: user._id });
    }
    catch (err) {
        res.status(400).send(err);
    }
});
exports.registerUser = registerUser;
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User_1.default.findById(req.userId);
    if (!user) {
        console.error("User not found for the provided email. Please try again.");
        res.status(400).send({
            message: user_1.messages.userNotFound,
        });
        return;
    }
    const environment = process.env.NODE_ENV.trim().toString();
    const token = jsonwebtoken_1.default.sign({ id: req.userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_LIFETIME,
    });
    user.token = token;
    yield user.save();
    const apiLogin = yield Api_1.default.findOne({
        user: user._id,
        endpoint: "/api/v1/user/login",
    });
    if (!apiLogin) {
        console.error("API not found for user login endpoint.");
        res.status(400).send({
            message: user_1.messages.loginEndpointNotFound,
        });
        return;
    }
    apiLogin.requests += 1;
    yield apiLogin.save();
    const apiPrompt = yield Api_1.default.findOne({
        user: user._id,
        endpoint: "/api/v1/file/prompt",
    });
    if (!apiPrompt) {
        console.error("API not found for prompt file endpoint.");
        res.status(400).send({
            message: user_1.messages.promptEndpointNotFound,
        });
        return;
    }
    res.header("Authorization", `Bearer ${token}`);
    res.cookie("token", token, {
        httpOnly: true,
        secure: true,
        maxAge: 1000 * 60 * 60 * 24 * 30,
        domain: environment === "development" ? "localhost" : ".noufilsaqib.com",
        sameSite: "none",
    });
    res.send({
        status: 200,
        message: user_1.messages.userLoginSuccess,
        id: user._id,
        apiCalls: apiPrompt.requests,
        isAdmin: user.admin,
        name: user.name,
    });
});
exports.loginUser = loginUser;
function sendMail(email, subject, mailContent) {
    const mailOptions = {
        from: process.env.NODEMAIL_USER,
        to: email,
        subject: subject,
        html: mailContent,
    };
    return new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) {
                console.error("Error occurred while sending email: ", err);
                reject(err);
            }
            else {
                console.log("Mail info:", info);
                console.log("Email sent to:", email);
                resolve(info);
            }
        });
    });
}
const sendForgotPasswordEmail = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    try {
        const otpExists = yield Otp_1.default.findOne({ email: email });
        if (otpExists) {
            yield Otp_1.default.deleteOne({ email: email });
        }
        const otp = Math.floor(1000 + Math.random() * 9000);
        console.log("OTP: ", otp);
        const otpSchema = new Otp_1.default({
            email: email,
            otpCode: otp,
        });
        yield otpSchema.save();
        const subject = "IntelliScan - Password Reset One Time Password Code";
        const mailContent = `
        <div style="max-width: 1000px;border:solid 1px #CBCBCB; margin: 0 auto;padding: 50px 60px;box-sizing:border-box;">
            <p>We received a request to reset your password associated with your IntelliScan account.</p>
            <p>To reset your password, please enter the following 4-digit code:</p>
            <div style="margin: 2rem; text-align: center;">
                <h1 style="letter-spacing: 5px;">${otp}</h1>
            </div>
            <p>If you did not initiate this request, you can safely ignore this email or contact us at <a href="mailto:${process.env.NODEMAIL_USER}">${process.env.NODEMAIL_USER}</a>.</p>
            <p>Thank you,<br/>The IntelliScan Team</p>
        </div>
        `;
        yield sendMail(email, subject, mailContent);
        const user = yield User_1.default.findOne({ email: email });
        if (!user) {
            console.error("User not found for the provided email. Please try again.");
            res.status(400).send({
                message: user_1.messages.userNotFound,
            });
            return;
        }
        const apiForgotPassword = yield Api_1.default.findOne({
            user: user._id,
            endpoint: "/api/v1/user/forgot-password",
        });
        if (!apiForgotPassword) {
            console.error("API not found for user forgot password endpoint.");
            res.status(400).send({
                message: user_1.messages.forgotPasswordEndpointNotFound,
            });
            return;
        }
        apiForgotPassword.requests += 1;
        yield apiForgotPassword.save();
        res.status(200).send({ message: user_1.messages.resetPasswordEmailSent });
    }
    catch (err) {
        console.error("Error occurred during sending reset password email: ", err);
        res.status(400).send(err);
    }
});
exports.sendForgotPasswordEmail = sendForgotPasswordEmail;
const updatePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, newPassword } = req.body;
    try {
        const user = yield User_1.default.findOne({ email: email });
        if (!user) {
            res.status(400).send({
                message: user_1.messages.userNotFound,
            });
            return;
        }
        const salt = yield bcryptjs_1.default.genSalt(10);
        const hashedPassword = yield bcryptjs_1.default.hash(newPassword, salt);
        user.password = hashedPassword;
        yield user.save();
        const apiResetPassword = yield Api_1.default.findOne({
            user: user._id,
            endpoint: "/api/v1/user/reset-password",
        });
        if (!apiResetPassword) {
            console.error("API not found for user reset password endpoint.");
            res.status(400).send({
                message: user_1.messages.resetPasswordEndpointNotFound,
            });
            return;
        }
        apiResetPassword.requests += 1;
        yield apiResetPassword.save();
        res.status(200).send({ message: user_1.messages.passwordUpdatedSuccess });
    }
    catch (err) {
        console.error("Error occurred while updating password: ", err);
        res.status(500).send({ message: user_1.messages.serverError });
    }
});
exports.updatePassword = updatePassword;
