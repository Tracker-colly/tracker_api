import { Router } from "express"
import { DefaultResult } from "../../libs/types"
import { RES_CODE } from "../../libs/config"
import { USER_TB } from "../../models"
import moment from "moment"
import { LessThan, MoreThanOrEqual } from "typeorm"
import { validate_object } from "../../libs/util"
import _ from "lodash"

const router = Router()

router.post( "/info", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["startDate", "endDate"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            startDate,
            endDate,
        } = req.body;

        let resultData: DefaultResult = {
            code: RES_CODE.OK
        }

        const totalUsers = await USER_TB.count();

        let builder = USER_TB
            .createQueryBuilder()
            .select( [
                "sido",
                "sex",
                "COUNT(sex) as sexCount"
            ] )
            .where( "createAt >= :date", {
                date: moment( startDate ).toDate()
            } )
            .andWhere( "createAt < :endDate", {
                endDate: moment( endDate ).add( moment.duration( 24, 'hours' ) ).toDate()
            } )
            .groupBy( "sido" )
            .addGroupBy( "sex" )

        let findUsers = await builder.getRawMany();

        let resultLabels = []
        let resultMans = []
        let resultWomans = []

        let groupData = _.groupBy( findUsers, "sido" );

        for ( let key in groupData ) {
            resultLabels.push( key );
            let manData = groupData[key].find( v => v.sex == 1 );
            resultMans.push( manData ? Number( manData.sexCount ) : 0 );
            let womanData = groupData[key].find( v => v.sex == 2 );
            resultWomans.push( womanData ? Number( womanData.sexCount ) : 0 )
        }

        resultData.data = {
            totalUsers,
            info: {
                label: resultLabels,
                man: resultMans,
                woman: resultWomans
            }
        }
        res.json( resultData );
    } catch ( e ) {
        res.status( 500 ).send( e.message )
    }
} )


export default router