import { Request, Response } from "express";
import User from "../models/User";
import Api from "../models/Api";
import { messages } from "../messages/lang/en/user";

export const sampleController = async (req: Request, res: Response) => {
    res.status(200).json({ data: 'This is only accessible using JWT', user: req.user })
}

export const fetchUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find({}, '-password')
        const userId = (req.user as any).id;

        if (!userId) {
            console.error("User not found");
            return res.status(404).send({ message: messages.userNotFound });
        }

        // find user api call
        const api = await Api.findOne({ user: userId, endpoint: "/api/v1/protected/users" });
        if (!api) {
            console.error("API not found for fetch users endpoint.");
            return res.status(400).send({ message: messages.fetchUsersEndpointNotFound });
        }

        // update user's api call usage
        api.requests += 1;
        await api.save();

        res.status(200).json({ users });
    } catch (err) {
        console.error("Error occurred while fetching users:", err);
        res.status(500).send({ message: messages.serverError });
    }
}

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            console.error("User not found");
            return res.status(404).send({ message: messages.userNotFound });
        }

        // find user api call
        const api = await Api.findOne({
            user: user.id,
            endpoint: "/api/v1/protected/users/:id",
            method: "DELETE"
        });

        if (!api) {
            console.error("API not found for delete user endpoint.");
            return res.status(400).send({ message: messages.deleteUserEndpointNotFound });
        }

        // update user's api call usage
        api.requests += 1;
        await api.save();

        res.status(200).json({ message: messages.deleteUserSuccess });
    } catch (err) {
        console.error("Error occurred while deleting user:", err);
        res.status(500).send({ message: messages.serverError });
    }
}

export const editUser = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const { name, email, admin, api_calls } = req.body;
        const user = await User.findByIdAndUpdate(id, { name, email, admin, api_calls }, { new: true });
        if (!user) {
            console.error('User not found')
            return res.status(404).send({ message: messages.userNotFound });
        }

        // find user api call
        const api = await Api.findOne({
            user: user.id,
            endpoint: "/api/v1/protected/users/:id",
            method: "PUT"
        });

        if (!api) {
            console.error("API not found for edit user endpoint.");
            return res.status(400).send({ message: messages.editUserEndpointNotFound });
        }

        // update user's api call usage
        api.requests += 1;
        await api.save();

        res.status(200).json({ message: messages.userUpdatedSuccess, user });
    } catch (err) {
        console.error("Error occurred while updating user:", err);
        res.status(500).send({ message: messages.serverError });
    }
}

export const fetchApiInfo = async (req: Request, res: Response) => {
    try {
        const id = req.params.id;
        const api = await Api.find({ user: id })
        if (!api) {
            console.error("User API not found.");
            return res.status(404).send({ message: messages.userApiInfoNotFound });
        }

        res.status(200).json({ api });
    } catch (err) {
        console.error("Error occurred while fetching api info:", err);
        res.status(500).send({ message: messages.serverError });
    }
}