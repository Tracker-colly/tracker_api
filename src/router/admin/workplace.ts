import { Router } from "express"
import exceljs from "exceljs"

import { DefaultResult } from "../../libs/types";
import { RES_CODE } from "../../libs/config";
import { COMPANY_TB } from "../../models/COMPANY_TB";
import { USER_TB } from "../../models";
import moment from "moment";
import { validate_object } from "../../libs/util";
import { COMPANY_LINK_TB } from "../../models/COMPANY_LINK_TB";
import { Brackets, In } from "typeorm";

const router = Router()

router.post( "/list", async ( req, res ) =>
{
    try {
        const {
            type,   // 1전체 2아이디 3이름 4휴대폰
            value,  // 검색값
            startDate,
            endDate,
            limit = 10,
            page = 1
        } = req.body;

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        let builder = COMPANY_TB.createQueryBuilder( "a" )
            .select( [
                "a.idx as idx",
                "a.serial as serial",
                "a.name as name",
                "a.tel as tel",
                "a.address1 as address1",
                "a.address2 as address2",
                "a.createAt as createAt",
                "a.memo as memo",
                "b.email as userEmail",
                "b.name as userName",
            ] )
            .leftJoin( USER_TB, "b", `b.idx = a.userId` )
            .where( "a.idx > :minId", { minId: 0 } )

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

        if ( type == 1 ) {
            builder.andWhere( new Brackets( qb =>
            {
                qb.where( "b.email like :value", { value: `%${value}%` } )
                qb.orWhere( "a.serial like :value", { value: `%${value}%` } )
                qb.orWhere( "a.name like :value", { value: `%${value}%` } )
            } ) )
        } else if ( type == 2 ) {
            builder.andWhere( "b.email like :value", { value: `%${value}%` } )
        } else if ( type == 3 ) {
            builder.andWhere( "a.serial like :value", { value: `%${value}%` } )
        } else if ( type == 4 ) {
            builder.andWhere( "a.name like :value", { value: `%${value}%` } )
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

router.post( "/info", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["comId"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            comId,
        } = req.body;

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        let companyInfo = await COMPANY_TB.findOne( { where: { idx: comId } } )
        if ( !companyInfo ) {
            throw new Error( "상세 정보를 찾을 수 없습니다." )
        }

        let memberCount = await COMPANY_LINK_TB.count( {
            where: {
                level: In( [2, 3, 9] ),
                comId: comId
            }
        } )

        resultData.data = {
            ...companyInfo,
            memberCount: memberCount
        };
        res.json( resultData )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

router.post( "/memo", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["comId"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const { comId, memo } = req.body;

        let findCompany = await COMPANY_TB.findOne( { where: { idx: comId } } );

        if ( !findCompany ) {
            throw new Error( "Workplace 정보를 찾을 수 없습니다." );
        }

        if ( !memo ) {
            findCompany.memo = ""
        } else {
            findCompany.memo = memo
        }

        await findCompany.save();

        res.send( true )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

router.post( "/excel", async ( req, res ) =>
{
    try {
        //탈퇴 회원 리스트
        let builder = COMPANY_TB.createQueryBuilder( "a" )
            .select( [
                "a.*",
                "b.email as userEmail",
                "b.name as userName",
            ] )
            .leftJoin( USER_TB, "b", `b.idx = a.userId` )
        let companyList = await builder.getRawMany()

        companyList = companyList.map( ( v, i ) =>
        {
            v.number = i + 1
            return v;
        } )

        let workBook = new exceljs.Workbook();
        let workSheet = workBook.addWorksheet( "유저목록" );

        workSheet.columns = [
            { header: "번호", key: "number" },
            { header: "아이디", key: "userEmail" },
            { header: "이름", key: "name" },
            { header: "시리얼", key: "serial" },
            { header: "전화번호", key: "tel" },
            { header: "주소1", key: "address1" },
            { header: "주소2", key: "address2" },
            { header: "생성일", key: "createAt" },
            { header: "memo", key: "memo" }
        ];

        workSheet.addRows( companyList );
        // workBook.xlsx.writeFile("list.xlsx")
        // let dataBuffer = await workBook.csv.writeBuffer();
        let dataBuffer = await workBook.xlsx.writeBuffer( {
            filename: "workpalce_list.xlsx"
        } );

        res.set( 'Content-Disposition', 'attachment; filename=workpalce_list.xlsx' );
        // res.set( 'content-type', 'text/csv;charset=utf-8' );
        res.set( 'content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' );
        res.end( dataBuffer );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

export default router