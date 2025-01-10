import { Router } from "express"
import userRouter from "./user"
import { checkUser } from "../middleware";
import { DefaultResult } from "../../libs/types";
import { codeToStr, RES_CODE } from "../../libs/config";
import { COMPANY_LINK_TB } from "../../models/COMPANY_LINK_TB";
import { In } from "typeorm";
import { COMPANY_TB } from "../../models/COMPANY_TB";
import { USER_TB } from "../../models";
import { INSA_TB } from "../../models/INSA_TB";
import { RECOMMED_TB } from "../../models/RECOMMED_TB";
import { validate_object } from "../../libs/util";

const router = Router()

router.use( checkUser );

// 트랙 리스트
router.post( "/list", async ( req, res ) =>
{
    try {
        const {
            user
        } = req.body;

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        // 링크가 링크중 회사목록
        let currentLinks = await COMPANY_LINK_TB.find( {
            where: {
                userId: user.idx,
                level: In( [2, 3, 9] )
            }
        } );

        // 링크가 헤제된 회사목록
        let beforeLinks = await COMPANY_LINK_TB.find( {
            where: {
                userId: user.idx,
                level: In( [4] )
            }
        } );

        let currentCompanys = await COMPANY_TB.find( {
            where: {
                idx: In( currentLinks.map( v => v.comId ) )
            }
        } )
        let beforeCompanys = await COMPANY_TB.find( {
            where: {
                idx: In( beforeLinks.map( v => v.comId ) )
            }
        } )

        let currentList = currentCompanys.map( curCompany =>
        {
            let linkInfo = currentLinks.find( link => link.comId == curCompany.idx );
            return {
                comId: curCompany.idx,
                image: curCompany.photo1,
                name: curCompany.name,
                startTime: linkInfo.createAt,
                endTime: null,
            }
        } )

        let beforeList = beforeCompanys.map( beforeCompany =>
        {
            let linkInfo = beforeLinks.find( link => link.comId == beforeCompany.idx );
            return {
                comId: beforeCompany.idx,
                image: beforeCompany.photo1,
                name: beforeCompany.name,
                startTime: linkInfo.createAt,
                endTime: linkInfo.deleteAt,
            }
        } )

        resultData.data = {
            currentList,
            beforeList,
        }

        res.json( resultData );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );
// 트랙 상세
router.post( "/info", async ( req, res ) =>
{
    try {
        const {
            user,
            comId,
        } = req.body;

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        let myLink = await COMPANY_LINK_TB.findOne( {
            where: {
                userId: user.idx,
                comId: comId
            }
        } )

        if ( !myLink ) {
            throw new Error( "링크 정보를 찾을 수 없습니다." );
        }

        let companyInfo = await COMPANY_TB.findOne( {
            where: {
                idx: comId,
            }
        } )

        let linkUsers = await COMPANY_LINK_TB
            .createQueryBuilder( "a" )
            .select( [
                "a.level as level",
                "b.idx as userId",
                "b.name as userName",
                "b.profile as userProfile"
            ] )
            .leftJoin( USER_TB, "b", "a.userId = b.idx" )
            .where( "a.comId = " + comId )
            .andWhere( "a.level IN (2,3,9)" )
            .orderBy( "level", "DESC" )
            .getRawMany();

        linkUsers = linkUsers.map( v =>
        {
            return {
                ...v,
                isMy: v.userId == user.idx
            }
        } )

        let insaList = await INSA_TB
            .createQueryBuilder( "a" )
            .select( [
                "a.idx as idx",
                "a.companyName as companyName",
                "a.creatorId as creatorId",
                "b.name as creatorName",
                "a.creatorWorkLevel as creatorWorkLevel",
                "a.updateAt as updateAt"
            ] )
            .where( `a.userId = ${user.idx}` )
            .andWhere( `a.status = 2` )
            .andWhere( `a.companyId = ${comId}` )
            .leftJoin( USER_TB, "b", `b.idx = a.creatorId` )
            .getRawMany();

        // let recommendList = await RECOMMED_TB.find( {
        //     where: {
        //         userId: user.idx,
        //         status: 2 // 완료된 항목만
        //     }
        // } )
        let recommendList = await RECOMMED_TB
            .createQueryBuilder( "a" )
            .select( [
                "a.*",
                "b.name as creatorName",
            ] )
            .where( `a.userId = ${user.idx}` )
            .andWhere( `a.companyId = ${comId}` )
            .andWhere( `a.status = 2` )
            .leftJoin( USER_TB, "b", `b.idx = a.creatorId` )
            .getRawMany();

        resultData.data = {
            info: {
                companyName: companyInfo.name,
                startTime: myLink.createAt,
                endTime: [2, 3, 9].includes( myLink.level ) ? null : myLink.deleteAt,
                code: myLink.code,
                codeName: codeToStr( myLink.code )
            },
            members: [2, 3, 9].includes( myLink.level ) ? linkUsers : [],
            insa: insaList.map( v =>
            {
                return {
                    companyName: v.companyName,
                    creatorName: v.creatorName,
                    creatorLevel: v.creatorWorkLevel,
                    creatorLevelName: codeToStr( v.creatorWorkLevel ),
                    date: v.updateAt,
                }
            } ),
            recommends: recommendList
        }


        res.send( resultData );

    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

router.post( "/delRecommend", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, [
            "recommendIds",
        ] );

        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            user,
            recommendIds,
        } = req.body;

        let delList = await RECOMMED_TB.find( {
            where: {
                idx: In( recommendIds ),
                userId: user.idx
            }
        } )

        if ( delList.length <= 0 ) {
            throw new Error( "삭제할 추천서가 없습니다." )
        }

        for ( let delItem of delList ) {
            delItem.status = 9; // 삭제 처리
            await delItem.save();
        }

        res.send( true );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

export default router