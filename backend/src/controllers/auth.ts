import { Response, Request } from "express";
import User from "../models/User";
import bcrypt from 'bcryptjs'
import jwt from "jsonwebtoken";

type RequestBody = {
    name: string;
    email: string;
    password: string
    admin: boolean;
}
export const registerUser = async (req: Request, res: Response) => {
    const { name, email, password, admin }: RequestBody = req.body;

    // hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // store the user in db
    const user = new User({
        name: name,
        email: email,
        password: hashedPassword,
        admin: admin ?? false
    });
    try {
        await user.save();
        res.send({ user: user._id })
    } catch (err) {
        res.status(400).send(err)
    }
}

export const loginUser = async (req: Request, res: Response) => {
    // Create and assign a JWT
    const token = jwt.sign({ id: req.userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_LIFETIME
    });
    res.header('Authorization', `Bearer ${token}`);
    res.cookie('token', token, { 
        httpOnly: true,
        secure: true,
        maxAge: 1000 * 60 * 60 * 24 * 30 // 30 days
    });
    res.send({
        "status": "success",
        "message": "User logged in successfully!",
    });
}