import { Router } from "express"
import configRouter from "./config"
import userRouter from "./user"
import homeRouter from "./home"
import companyRouter from "./company"
import trackRouter from "./track"
import inboxRouter from "./inbox"
import settingRouter from "./setting"
import searchRouter from "./search"

const router = Router()

router.use( "/config", configRouter )

router.use( "/user", userRouter );
router.use( "/home", homeRouter );
router.use( "/company", companyRouter );
router.use( "/track", trackRouter );
router.use( "/inbox", inboxRouter );
router.use( "/setting", settingRouter );

router.use( "/search", searchRouter );


/*
router.use( "/search", settingRouter );
router.use( "/alarm", settingRouter );
*/

export default router