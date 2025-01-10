import { Router } from "express"
import userRouter from "./user"

const router = Router()

router.get( "/", async ( req, res ) =>
{
    try {
        res.send( "hi" );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

export default router