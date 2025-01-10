import { RequestHandler } from "express";
import jwtUtil from "jsonwebtoken";
import { USER_TB } from "../models";
import { RES_CODE } from "../libs/config";
import { Not } from "typeorm";
import { ADMIN_USER_TB } from "../models/ADMIN_USER_TB";

export const checkUser: RequestHandler = async (req, res, next) => {
    try {
        const token = req.headers.authorization;

        let decoded = jwtUtil.verify(token, process.env.JWT_KEY);

        if (typeof decoded === "object") {
            let idx = decoded?.id;

            let user = await USER_TB.findOne({
                where: { idx: idx }
            });

            if (user && user.status == 1) {
                req.body.user = user;
            } else if (user && user.status == 9) {
                res.send({
                    code: RES_CODE.ACCESS_DENIED,
                    message: "탈퇴 회원입니다."
                })
                return
            } else {
                // console.log( "checkuser > not found user" )
                res.send({
                    code: RES_CODE.ACCESS_DENIED,
                    message: "로그인 정보를 찾을 수 없습니다."
                })
                return
            }
        } else {
            // console.log( "checkuser > decode null" )
            res.send({
                code: RES_CODE.ACCESS_DENIED,
                message: "로그인 정보를 찾을 수 없습니다."
            })
            return
        }
        next();
    } catch (e) {
        // 유저 정보가 없음
        // console.log( "[checkUser] error", e.message );
        res.send({
            code: RES_CODE.ACCESS_DENIED,
            message: "로그인 정보를 찾을 수 없습니다."
        })
        return
        // next()
    }
}

export const checkAdmin: RequestHandler = async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        let decoded = jwtUtil.verify(token, process.env.JWT_ADMIN_KEY);

        if (typeof decoded === "object") {
            let idx = decoded?.id;

            let user = await ADMIN_USER_TB.findOne({
                where: { idx: idx }
            });

            if (user && user.status == 1) {
                req.body.user = user;
            } else if (user && user.status == 9) {
                res.send({
                    code: RES_CODE.ACCESS_DENIED,
                    message: "탈퇴 회원입니다."
                })
                return
            } else {
                // console.log( "checkuser > not found user" )
                res.send({
                    code: RES_CODE.ACCESS_DENIED,
                    message: "로그인 정보를 찾을 수 없습니다."
                })
                return
            }
        } else {
            // console.log( "checkuser > decode null" )
            res.send({
                code: RES_CODE.ACCESS_DENIED,
                message: "로그인 정보를 찾을 수 없습니다."
            })
            return
        }
        next();
    } catch (e) {
        // 유저 정보가 없음
        console.log("[checkAdmin] error", e.message);
        res.send({
            code: RES_CODE.ACCESS_DENIED,
            message: "로그인 정보를 찾을 수 없습니다."
        })
        return
        // next()
    }
}

export const checkSCD: RequestHandler = async (req, res, next) => {
    const { SCD, ADMINSCD } = process.env;
    if (req.header('scd') !== SCD && req.header('adminscd') !== ADMINSCD) {
        res.status(404).send("사이트에 연결할 수 없음");
    } else {
        next();
    }
}