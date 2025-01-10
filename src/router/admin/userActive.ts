import { Router } from "express"
import exceljs from "exceljs";
import { Readable } from "stream"

import { validate_object } from "../../libs/util";
import { DefaultResult } from "../../libs/types";
import { RES_CODE } from "../../libs/config";
import { USER_TB } from "../../models";
import { Brackets, In } from "typeorm";
import moment from "moment";
import { COMPANY_LINK_TB } from "../../models/COMPANY_LINK_TB";
import { SEND_DOC_TB } from "../../models/SEND_DOC_TB";
import { INSA_TB } from "../../models/INSA_TB";
import { RECOMMED_TB } from "../../models/RECOMMED_TB";
import { INBOX_TB } from "../../models/INBOX_TB";
import { ALARM_TB } from "../../models/ALARM_TB";

const router = Router()

// 가입회원 리스트
router.post( "/list", async ( req, res ) =>
{
    /*
        검색타입: 전체, 아이디, 이름, 휴대폰
        가입일 최소
        가입일 최대
    */
    try {
        const {
            type,// 1전체 2아이디 3이름 4휴대폰
            value,
            startDate,
            endDate,
            limit = 10,
            page = 1
        } = req.body;

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        let builder = USER_TB.createQueryBuilder().where( "status = :status", { status: 1 } )

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
                qb.where( "email like :value", { value: `%${value}%` } )
                qb.orWhere( "name like :value", { value: `%${value}%` } )
                qb.orWhere( "hp like :value", { value: `%${value}%` } )
            } ) )
        } else if ( type == 2 ) {
            builder.andWhere( "email like :value", { value: `%${value}%` } )
        } else if ( type == 3 ) {
            builder.andWhere( "name like :value", { value: `%${value}%` } )
        } else if ( type == 4 ) {
            builder.andWhere( "hp like :value", { value: `%${value}%` } )
        }



        let findCount = await builder.getCount();

        builder.offset( page * limit - limit )
        builder.limit( limit )

        let findData = await builder.getMany();

        resultData.data = {
            list: findData.map( v => { delete v.password; return v } ),
            page: page,
            totalPage: Math.ceil( findCount / limit ),
            limit: limit,
        };
        res.json( resultData )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )
// 탈퇴처리
router.post( "/delete", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["ids"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const { ids } = req.body;

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        if ( ids.length <= 0 ) {
            throw new Error( "요청하신 회원정보가 없습니다." )
        }

        let findUsers = await USER_TB.find( {
            where: {
                idx: In( ids ),
                status: 1
            }
        } )

        if ( findUsers.length <= 0 ) {
            throw new Error( "회원 정보를 찾을 수 없습니다." )
        }

        for ( let findUser of findUsers ) {
            console.log( findUser.name )

            findUser.status = 9; //탈퇴 처리
            findUser.deletedAt = new Date();
            await findUser.save();

            // /* ---- 부가적인 탈퇴 처리 ---- 

            // link 삭제 
            let delLinks = await COMPANY_LINK_TB.find( { where: { userId: findUser.idx } } );
            await COMPANY_LINK_TB.remove( delLinks );
            // sendDoc 삭제
            let delSenddoc = await SEND_DOC_TB.find( { where: { userId: findUser.idx } } );
            await SEND_DOC_TB.remove( delSenddoc );
            // 인사평가 추천서 삭제
            let delInsa = await INSA_TB.find( { where: { userId: findUser.idx } } )
            let delRecommend = await RECOMMED_TB.find( { where: { userId: findUser.idx } } )
            await INSA_TB.remove( delInsa );
            await RECOMMED_TB.remove( delRecommend );
            // 인박스 삭제
            let delInbox = await INBOX_TB.find( {
                where: [
                    { targetId: findUser.idx, },
                    { targetEmail: findUser.email }
                ]
            } )
            await INBOX_TB.remove( delInbox );
            // 알람 삭제
            let delAlarm = await ALARM_TB.find( { where: { userId: findUser.idx } } )
            await ALARM_TB.remove( delAlarm );

            // ---- 부가적인 탈퇴 처리 ---- */
        }

        res.send( true )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

router.post( "/memo", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["userId"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const { userId, memo } = req.body;

        let findUser = await USER_TB.findOne( { where: { idx: userId } } );

        if ( !findUser ) {
            throw new Error( "유저 정보가 없습니다." );
        }

        if ( !memo ) {
            findUser.memo = ""
        } else {
            findUser.memo = memo
        }

        await findUser.save();

        res.send( true )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

router.post( "/excel", async ( req, res ) =>
{
    try {
        // 가입회원 리스트
        let userList = await USER_TB.find( { where: { status: 1 } } )
        let userNumberList = userList.map( ( v, i ) =>
        {
            return { ...v, number: i + 1 }
        } )
        let workBook = new exceljs.Workbook();
        let workSheet = workBook.addWorksheet( "유저목록" );

        workSheet.columns = [
            { header: "번호", key: "number" },
            { header: "아이디", key: "email" },
            { header: "이름", key: "name" },
            { header: "시리얼", key: "serial" },
            { header: "휴대폰번호", key: "hp" },
            { header: "생년월일", key: "birth" },
            { header: "성별", key: "sex" },
            { header: "가입일", key: "createAt" },
            { header: "memo", key: "memo" }
        ];

        workSheet.addRows( userNumberList );
        // workBook.xlsx.writeFile("유저목록.xlsx")
        // let dataBuffer = await workBook.csv.writeBuffer();
        let dataBuffer = await workBook.xlsx.writeBuffer( {
            filename: "active_user_list.xlsx"
        } );

        res.set( 'Content-Disposition', 'attachment; filename=active_user_list.xlsx' );
        // res.set( 'content-type', 'text/csv;charset=utf-8' );
        res.set( 'content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' );
        res.end( dataBuffer );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

export default router