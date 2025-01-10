import { Router } from "express"
import moment from "moment";
import { DefaultResult } from "../../libs/types";
import { RES_CODE } from "../../libs/config";
import { validate_object } from "../../libs/util";
import { FAQ_TB } from "../../models/FAQ_TB";
import { Brackets, In } from "typeorm";

const router = Router()
router.post( "/list", async ( req, res ) =>
{
    try {
        const {
            type,   // 1전체 2제목 3내용
            value,  // 검색값
            startDate,
            endDate,
            limit = 10,
            page = 1
        } = req.body;

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        let builder = FAQ_TB.createQueryBuilder()
            .select( ["idx", "title", "createAt", "updateAt"] )
            .where( "idx > :min", { min: 0 } )

        if ( startDate ) {
            builder.andWhere( "createAt >= :date", {
                date: moment( startDate ).toDate()
            } )
        }

        if ( endDate ) {
            builder.andWhere( "createAt < :endDate", {
                endDate: moment( endDate ).add( moment.duration( 24, 'hours' ) ).toDate()
            } )
        }

        if ( type == 1 ) {
            builder.andWhere( new Brackets( qb =>
            {
                qb.where( "title like :value", { value: `%${value}%` } )
                qb.orWhere( "text like :value", { value: `%${value}%` } )
            } ) )

        } else if ( type == 2 ) {
            builder.andWhere( "title like :value", { value: `%${value}%` } )
        } else if ( type == 3 ) {
            builder.andWhere( "text like :value", { value: `%${value}%` } )
        }


        builder.orderBy( "createAt", "ASC" )

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

// 등록 수정
router.post( "/add", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["title", "text"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            idx,
            title,
            text,
        } = req.body;


        if ( idx ) {
            let findNotice = await FAQ_TB.findOne( { where: { idx: idx } } );
            findNotice.title = title;
            findNotice.text = text;
            await findNotice.save();
        } else {
            let saveData = await FAQ_TB.create( {
                title: title,
                text: text
            } ).save();
        }

        res.send( true )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

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

        let findNotice = await FAQ_TB.findOne( { where: { idx: idx } } )

        if ( !findNotice ) {
            throw new Error( "FAQ 정보를 찾을수 없습니다." )
        }

        resultData.data = findNotice
        res.json( resultData )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

router.post( "/delete", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["ids"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            ids
        } = req.body;

        if ( ids.length <= 0 ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        let findFAQList = await FAQ_TB.find( { where: { idx: In( ids ) } } )

        if ( findFAQList.length <= 0 ) {
            throw new Error( "FAQ 정보를 찾을수 없습니다." )
        }

        for ( let findNotice of findFAQList ) {
            await findNotice.remove();
        }

        res.send( true )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )
export default router