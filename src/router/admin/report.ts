import { Router } from "express"
import moment from "moment";
import { DefaultResult } from "../../libs/types";
import { RES_CODE } from "../../libs/config";
import { REPORT_TB } from "../../models/REPORT_TB";
import { USER_TB } from "../../models";
import { validate_object } from "../../libs/util";

const router = Router()
//리스트
router.post( "/list", async ( req, res ) =>
{
    try {
        const {
            type,   // 1전체 2대기 3완료
            value,  // 검색값 (제목기준)
            startDate,
            endDate,
            limit = 10,
            page = 1
        } = req.body;

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        let builder = REPORT_TB.createQueryBuilder( "a" )
            .select( [
                "a.idx as idx",
                "a.title as title",
                "a.answerAt as answerAt",
                "a.createAt as createAt",
                "a.updateAt as updateAt",
                "b.name as userName",
                "b.email as userEmail",
            ] )
            .leftJoin( USER_TB, "b", "a.userId = b.idx" )
            .where( "a.idx > :min", { min: 0 } )

        if ( type == 1 ) {
            //전체
        } else if ( type == 2 ) {
            builder.andWhere( "a.answerAt IS NULL" )
        } else if ( type == 3 ) {
            builder.andWhere( "a.answerAt IS NOT NULL" )
        }

        if ( value ) {
            builder.andWhere( "a.title LIKE :value", { value: `%${value}%` } )
        }

        if ( startDate ) {
            builder.andWhere( "a.createAt >= :date", {
                date: moment( startDate ).toDate()
            } )
        }

        if ( endDate ) {
            builder.andWhere( "a.createAt < :endDate", {
                endDate: moment( endDate ).add( moment.duration( 24, 'hours' ) ).toDate()
            } )
        }

        let findCount = await builder.getCount();

        builder.offset( page * limit - limit )
        builder.limit( limit )

        let findData = await builder.getRawMany();

        resultData.data = {
            list: findData,
            page: page,
            totalPage: Math.ceil( findCount / limit ),
            limit: limit,
        };
        res.json( resultData )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )
//상세
router.post( "/info", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["idx"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            idx
        } = req.body;

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        let builder = REPORT_TB.createQueryBuilder( "a" )
            .select( [
                "a.idx as idx",
                "a.title as title",
                "a.text as text",
                "a.answer as answer",
                "a.answerAt as answerAt",
                "a.createAt as createAt",
                "a.updateAt as updateAt",
                "b.name as userName",
                "b.email as userEmail",
            ] )
            .leftJoin( USER_TB, "b", "a.userId = b.idx" )
            .where( "a.idx = :idx", { idx: idx } )

        let findData = await builder.getRawOne();

        resultData.data = findData
        res.json( resultData )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )
// 답변
router.post( "/answer", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["idx", "answer"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            idx, answer
        } = req.body;

        let findData = await REPORT_TB.findOne( { where: { idx: idx } } )

        if ( !findData ) {
            throw new Error( "문의 내용정보가 없습니다." )
        }

        // if ( findData.answer ) {
        //     throw new Error( "이미 답변이 완료 되었습니다." )
        // }

        findData.answer = answer;
        findData.answerAt = new Date();

        await findData.save();

        res.send( true )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

export default router