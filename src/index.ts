import express from "express";
import dotenv from "dotenv";
import cors from "cors"
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import moment from "moment";
import nodemailer from "nodemailer"

import { dbConnect, USER_TB } from "./models";
import { INSA_TB } from "./models/INSA_TB";
import { sendEmail } from "./libs/util";

import routerV1 from "./router/v1"
import routerAdmin from "./router/admin"

import { exec, spawn } from "child_process";
import { INSA_DOC_TB } from "./models/INSA_DOC_TB";
import { defaultDoc } from "./libs/config";
import { checkSCD } from "./router/middleware";
import { ADMIN_USER_TB } from "./models/ADMIN_USER_TB";
dotenv.config();


const PORT = process.env.PORT;
const app = express();

// 보안 관련 모듈
app.use(cors({ origin: true }));
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));
app.use(rateLimit({
    windowMs: 1000 * 60,
    max: 10000,
    handler(req, res) {
        res.status(500).send("잠시후 다시 시도해주세요.");
    },
}))
app.use(express.json({ limit: '100mb' }));
app.use(express.static('public'))
app.use(checkSCD)

app.use((req, res, next) => {
    let nowDt = moment().format('YYYY-MM-DD HH:mm:ss');

    let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (typeof ip === "string" && ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
    }

    req.body.nowDt = nowDt;
    req.body.ip = ip;
    next();
})



app.get("/", async (req, res) => {
    res.send("tracker colly");
})

app.use("/v1", routerV1)
app.use("/admin", routerAdmin)


// 데이터 베이스 연결 및 서버 실행
dbConnect().then(() => {
    console.log("db connect!!")
    app.listen(PORT, async () => {
        await createDemoData();
        console.log("run express! port:", PORT)
    });
})

async function createDemoData() {
    let count = await ADMIN_USER_TB.count();
    if (count <= 0) {
        let saveData = ADMIN_USER_TB.create({
            account: "admin",
            password: "1234",
            email: "admin@trackercolly.com",
            hp: "01011112222",
            name: "관리자",
        })
        await saveData.save();
        console.log("new admin")
    }
}