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
exports.fetchUsers = exports.sampleController = void 0;
const User_1 = __importDefault(require("../models/User"));
const sampleController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).json({ data: 'This is only accessible using JWT', user: req.user });
});
exports.sampleController = sampleController;
const fetchUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield User_1.default.find({}, '-password');
        res.status(200).json({ users });
    }
    catch (err) {
        console.error("Error occurred while fetching users:", err);
        res.status(500).send("Internal Server Error");
    }
});
exports.fetchUsers = fetchUsers;
