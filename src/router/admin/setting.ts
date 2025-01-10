import { Router } from "express"
import { DefaultResult } from "../../libs/types"
import { RES_CODE } from "../../libs/config"
import { INFO_TB } from "../../models/INFO_TB"
import { MoreThan } from "typeorm"
import { POLICY_TB } from "../../models/POLICY_TB"

const router = Router()

//정보
router.post( "/info", async ( req, res ) =>
{
    try {
        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        let policy1 = await POLICY_TB.findOne( { where: { type: 1 } } )
        let policy2 = await POLICY_TB.findOne( { where: { type: 2 } } )
        let findData = await INFO_TB.findOne( { where: { idx: MoreThan( 0 ) } } );

        resultData.data = {
            info: findData,
            policy1,
            policy2,
        }
        res.json( resultData )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

//수정
router.post( "/edit", async ( req, res ) =>
{
    try {
        const {
            policy1,
            policy2,
            ceo,
            companyName,
            companyNo1,
            companyNo2,
            appleLink,
            googleLink,
            address,
            copyright
        } = req.body;

        let findData = await INFO_TB.findOne( { where: { idx: MoreThan( 0 ) } } );
        let policyData1 = await POLICY_TB.findOne( { where: { type: 1 } } )
        let policyData2 = await POLICY_TB.findOne( { where: { type: 2 } } )

        if ( policy1 ) {
            policyData1.text = policy1;
            await policyData1.save();
        }
        if ( policy2 ) {
            policyData2.text = policy2;
            policyData2.save();
        }

        if ( ceo ) {
            findData.ceo = ceo;
        }
        if ( companyName ) {
            findData.companyName = companyName;
        }
        if ( companyNo1 ) {
            findData.companyNo1 = companyNo1;
        }
        if ( companyNo2 ) {
            findData.companyNo2 = companyNo2;
        }
        if ( address ) {
            findData.address = address;
        }
        if ( copyright ) {
            findData.copyright = copyright;
        }

        if ( appleLink ) {
            findData.appleLink = appleLink;
        }
        if ( googleLink ) {
            findData.googleLink = googleLink;
        }

        await findData.save();

        res.send( true )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

export default router