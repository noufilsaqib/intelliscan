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
exports.loginValidation = void 0;
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const User_1 = __importDefault(require("../models/User"));
const user_1 = require("../messages/lang/en/user");
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().min(6).email(),
    password: zod_1.z.string().min(3)
}).strict();
const loginValidation = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).send(parsed.error);
        return;
    }
    const { email: emailFromBody, password: passwordFromBody } = req.body;
    try {
        const user = yield User_1.default.findOne({ email: emailFromBody });
        if (!user) {
            res.status(400).send({ message: user_1.messages.userNotFound });
            return;
        }
        const validPass = yield bcryptjs_1.default.compare(passwordFromBody, user.password);
        if (!validPass) {
            res.status(400).send({
                message: user_1.messages.invalidEmailOrPassword
            });
            return;
        }
        req.userId = user._id;
        next();
    }
    catch (err) {
        console.error('Error occurred while validating login: ', err);
        res.status(500).send({ message: user_1.messages.serverError });
    }
});
exports.loginValidation = loginValidation;
