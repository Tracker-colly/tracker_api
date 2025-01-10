import { Router } from "express"
import exceljs from "exceljs"

import { DefaultResult } from "../../libs/types";
import { RES_CODE } from "../../libs/config";
import { USER_TB } from "../../models";
import { validate_object } from "../../libs/util";
import { Brackets, In } from "typeorm";
import moment from "moment";

const router = Router()

// 탈퇴회원 리스트
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

        let builder = USER_TB.createQueryBuilder().where( "status = :status", { status: 9 } )

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

// 복구처리
router.post( "/active", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["ids"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const { ids } = req.body;

        if ( ids.length <= 0 ) {
            throw new Error( "요청하신 회원정보가 없습니다." )
        }

        //탈퇴 유저 검색
        let findUsers = await USER_TB.find( {
            where: {
                idx: In( ids ),
                status: 9
            }
        } )

        if ( findUsers.length <= 0 ) {
            throw new Error( "회원 정보를 찾을 수 없습니다." )
        }

        for ( let findUser of findUsers ) {
            findUser.status = 1;
            await findUser.save();
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
        //탈퇴 회원 리스트
        let userList = await USER_TB.find( { where: { status: 9 } } )
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
            filename: "disable_user_list.xlsx"
        } );

        res.set( 'Content-Disposition', 'attachment; filename=disable_user_list.xlsx' );
        // res.set( 'content-type', 'text/csv;charset=utf-8' );
        res.set( 'content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' );
        res.end( dataBuffer );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

export default router