import { Router } from "express"
import userRouter from "./user"
import { INFO_TB } from "../../models/INFO_TB";
import { OptionData } from "../../libs/config";

const router = Router()

router.post( "/", async ( req, res ) =>
{
    try {

        res.json( {
            code: 0,
            data: {
                ...OptionData,
            }
        } )

    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

router.post( "/siteInfo", async ( req, res ) =>
{
    try {

        let companyData = await INFO_TB.find();
        if ( companyData.length <= 0 ) {
            throw new Error( "데이터 조회 실패" )
        }

        res.json( {
            code: 0,
            data: companyData[0]
        } )

    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );



export default router