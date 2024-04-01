import { Request, Response, NextFunction } from "express";

import jwt from "jsonwebtoken";

export const verify = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies['token'];
    if (!token) {
        console.error('Access denied!!!', token);
        return res.status(401).send('Access denied!!!')
    }

    try {
        const verify = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verify;
        next()
    } catch (err) {
        return res.status(400).send('Invalid token!!!')
    }
}