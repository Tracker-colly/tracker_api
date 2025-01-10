import { Router } from "express"
import userRouter from "./user"
import userActiveRouter from "./userActive"
import userDisableRouter from "./userDisable"
import workplaceRouter from "./workplace"
import noticeRouter from "./notice"
import faqRouter from "./faq"
import reportRouter from "./report"
import statsRouter from "./stats"
import settingRouter from "./setting"
import { checkAdmin } from "../middleware"


const router = Router()

router.use( "/user", userRouter )
router.use( "/userActive", checkAdmin, userActiveRouter )
router.use( "/userDisable", checkAdmin, userDisableRouter )
router.use( "/workplace", checkAdmin, workplaceRouter )
router.use( "/notice", checkAdmin, noticeRouter )
router.use( "/faq", checkAdmin, faqRouter )
router.use( "/report", checkAdmin, reportRouter )
router.use( "/stats", checkAdmin, statsRouter )
router.use( "/setting", checkAdmin, settingRouter )

export default router