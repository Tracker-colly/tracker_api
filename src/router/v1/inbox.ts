import { Router } from "express"
import userRouter from "./user"
import { checkUser } from "../middleware";
import { DefaultResult, InboxType } from "../../libs/types";
import { RES_CODE } from "../../libs/config";
import { INBOX_TB } from "../../models/INBOX_TB";
import { In } from "typeorm";
import { USER_TB } from "../../models";
import { validate_object } from "../../libs/util";
import { INSA_TB } from "../../models/INSA_TB";
import { INSA_DOC_TB } from "../../models/INSA_DOC_TB";
import { RECOMMED_TB } from "../../models/RECOMMED_TB";
import { saveImage } from "../../libs/file";
import { saveInboxDoc } from "../../libs/dataUtil";
import { COMPANY_LINK_TB } from "../../models/COMPANY_LINK_TB";
import { SEND_DOC_TB } from "../../models/SEND_DOC_TB";
import { COMPANY_TB } from "../../models/COMPANY_TB";

const router = Router()
router.use( checkUser );
// 어드민 리스트
router.post( "/admin", async ( req, res ) =>
{
    try {
        const { user } = req.body;

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        let inboxList = await INBOX_TB
            .createQueryBuilder( "a" )
            .select( [
                "a.idx as idx",
                "a.type as type",
                "a.userId as userId",
                "a.targetId as targetId",
                "a.targetEmail as targetEmail",
                "a.itemId as itemId",
                "b.name as userName",
                "a.createAt as createAt",
            ] )
            .where( `a.type IN (6, 7, 8) AND targetId = ${user.idx}` )
            .orWhere( `a.type IN (6, 7, 8) AND targetEmail = '${user.email}'` )
            .leftJoin( USER_TB, "b", "a.userId = b.idx" )
            .orderBy( "a.createAt", "DESC" )
            .getRawMany();

        if ( inboxList.length > 0 ) {
            let inBoxIdxs = inboxList.map( v => v.idx );
            await INBOX_TB.update( inBoxIdxs, { view: true } )
        }

        let resultList = [];

        for ( let inbox of inboxList ) {
            let pushData = { ...inbox };
            if ( [6].includes( inbox.type ) ) {
                let checkData = await INSA_TB.findOne( {
                    where: { idx: inbox.itemId }
                } )

                if ( checkData ) {
                    if ( checkData.status == 1 ) {
                        resultList.push( pushData )
                    }
                }
            } else {
                resultList.push( pushData )
            }
        }

        resultData.data = {
            // list: inboxList
            list: resultList
        }

        res.json( resultData )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

// 스탭/어플리칸트 리스트
router.post( "/basic", async ( req, res ) =>
{
    try {
        const { user } = req.body;

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        let inboxList = await INBOX_TB
            .createQueryBuilder( "a" )
            .select( [
                "a.idx as idx",
                "a.type as type",
                "a.userId as userId",
                "a.targetId as targetId",
                "a.targetEmail as targetEmail",
                "a.itemId as itemId",
                "b.name as userName",
                "a.createAt as createAt",
            ] )
            .where( `a.type IN (1,2,3,4,5) AND targetId = ${user.idx}` )
            .orWhere( `a.type IN (1,2,3,4,5) AND targetEmail = '${user.email}'` )
            .leftJoin( USER_TB, "b", "a.userId = b.idx" )
            .orderBy( "a.createAt", "DESC" )
            .getRawMany();


        let resultList = [];
        for ( let inbox of inboxList ) {
            if ( [1, 2].includes( inbox.type ) ) {
                let checkFindDoc = await SEND_DOC_TB.findOne( {
                    where: { companyId: inbox.itemId }
                } )

                if ( !checkFindDoc ) {
                    let companyInfo = await COMPANY_TB.findOne( {
                        select: ["name"],
                        where: { idx: inbox.itemId }
                    } )
                    if ( companyInfo ) {
                        inbox.companyName = companyInfo.name;
                    }
                    resultList.push( inbox );
                }
            } else if ( [3].includes( inbox.type ) ) {
                // 추천서 작성요청
                let checkRecommend = await RECOMMED_TB.findOne( {
                    where: { idx: inbox.itemId }
                } )
                if ( checkRecommend?.status == 1 )
                    resultList.push( inbox );
            } else {
                resultList.push( inbox )
            }
        }

        if ( resultList.length > 0 ) {
            let inBoxIdxs = resultList.map( v => v.idx );
            await INBOX_TB.update( inBoxIdxs, { view: true } )
        }

        resultData.data = {
            list: resultList
        }

        res.json( resultData )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

// 인사평가 작성 정보
router.post( "/insaInfo", async ( req, res ) =>
{
    try {

        let validateObj = validate_object( req.body, [
            "itemId"
        ] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            user,
            itemId
        } = req.body;

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        const insaInfo = await INSA_TB.findOne( {
            where: {
                idx: itemId,
            }
        } )

        if ( !insaInfo ) {
            throw new Error( "요청 정보가 없습니다." )
        }

        if ( insaInfo.status == 2 ) {
            throw new Error( "이미 작성된 인사평가입니다." )
        }

        let reqUser = await USER_TB.findOne( {
            where: {
                idx: insaInfo.userId
            }
        } )

        let createUser = await USER_TB.findOne( {
            where: {
                idx: insaInfo.creatorId
            }
        } )

        let docInfo = await INSA_DOC_TB.findOne( {
            where: {
                comId: insaInfo.companyId
            }
        } )



        resultData.data = {
            insaId: insaInfo.idx,
            user: {
                idx: reqUser.idx,
                name: reqUser.name,
                hp: reqUser.hp,
                workLevel: insaInfo.workLevel
            },
            creator: {
                idx: createUser.idx,
                name: createUser.name,
                hp: createUser.hp,
                workLevel: insaInfo.creatorWorkLevel
            },
            docInfo: docInfo.evalData
        }


        res.json( resultData )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

// 인사평가 작성하기
router.post( "/insaWrite", async ( req, res ) =>
{
    try {

        let validateObj = validate_object( req.body, [
            "insaId",
            "data",
            "pointFinal",
            "comment",
        ] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            user,
            insaId,
            data,
            pointFinal,
            comment,
        } = req.body;

        const insaInfo = await INSA_TB.findOne( {
            where: {
                idx: insaId,
            }
        } )

        if ( !insaInfo ) {
            throw new Error( "요청 정보가 없습니다." )
        }

        if ( insaInfo.status == 2 ) {
            throw new Error( "이미 작성된 요청입니다." )
        }

        insaInfo.status = 2;
        insaInfo.evalData = data;
        insaInfo.pointFinal = pointFinal;
        insaInfo.comment = comment;

        await insaInfo.save();
        await saveInboxDoc( InboxType.insaWriteDone, user.idx, insaInfo.userId, insaInfo.idx )

        res.send( true )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

//추천서 작성 정보
router.post( "/recommendInfo", async ( req, res ) =>
{
    try {

        let validateObj = validate_object( req.body, [
            "itemId"
        ] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            user,
            itemId
        } = req.body;

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        const recommendInfo = await RECOMMED_TB.findOne( {
            where: {
                idx: itemId,
            }
        } )

        if ( !recommendInfo ) {
            throw new Error( "요청 정보가 없습니다." )
        }

        if ( recommendInfo.status == 2 ) {
            throw new Error( "이미 작성된 추천서입니다." )
        }

        let reqUser = await USER_TB.findOne( {
            where: {
                idx: recommendInfo.userId
            }
        } )

        let creatorUser = await USER_TB.findOne( {
            where: {
                idx: recommendInfo.creatorId ? recommendInfo.creatorId : user.idx
            }
        } )

        resultData.data = {
            ...recommendInfo,
            userName: reqUser.name,
            userHp: reqUser.hp,
            creatorName: creatorUser.name,
            creatorHp: creatorUser.hp
        }

        res.json( resultData )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

router.post( "/recommendWrite", async ( req, res ) =>
{
    try {

        let validateObj = validate_object( req.body, [
            "recommendId",
            "creatorFile",
            "creatorRelation",
            "creatorWorkLevel",
            "pointIntegrity",
            "pointResponsibility",
            "pointTeamwork",
            "pointWork",
            "pointSkill",
            "pointBest",
            "pointWorst",
            "pointFinal"
        ] );
        if ( validateObj.error ) {
            console.log( validateObj.errKeys )
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            user,
            recommendId,
            creatorFile,
            creatorRelation,
            creatorWorkLevel,
            pointIntegrity,
            pointResponsibility,
            pointTeamwork,
            pointWork,
            pointSkill,
            pointAttitude,
            pointProblems,
            pointRelationships,
            pointBest,
            pointWorst,
            pointFinal
        } = req.body;

        const recommendInfo = await RECOMMED_TB.findOne( {
            where: {
                idx: recommendId,
            }
        } )

        if ( !recommendInfo ) {
            throw new Error( "요청 정보가 없습니다." )
        }

        if ( recommendInfo.status == 2 ) {
            throw new Error( "이미 작성된 요청입니다." )
        }

        if ( !recommendInfo.creatorId ) {
            recommendInfo.creatorId = user.idx;
        }

        if ( typeof creatorFile === "object" ) {
            let path = await saveImage( creatorFile )
            recommendInfo.creatorFile = path;
        }

        recommendInfo.creatorRelation = creatorRelation;
        recommendInfo.creatorWorkLevel = creatorWorkLevel;

        recommendInfo.pointIntegrity = pointIntegrity;
        recommendInfo.pointResponsibility = pointResponsibility;
        recommendInfo.pointTeamwork = pointTeamwork;
        recommendInfo.pointWork = pointWork;
        recommendInfo.pointSkill = pointSkill;
        recommendInfo.pointAttitude = pointAttitude ? pointAttitude : false;
        recommendInfo.pointProblems = pointProblems ? pointProblems : false;
        recommendInfo.pointRelationships = pointRelationships ? pointRelationships : false;
        recommendInfo.pointBest = pointBest;
        recommendInfo.pointWorst = pointWorst;

        recommendInfo.pointFinal = pointFinal;

        recommendInfo.status = 2;

        await recommendInfo.save();
        await saveInboxDoc( InboxType.recommendWriteDone, user.idx, recommendInfo.userId, recommendInfo.idx )
        res.send( true )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

// 인사평가 확인 (관리자일 경우)
router.post( "/insaView", async ( req, res ) =>
{
    try {

        let validateObj = validate_object( req.body, [
            "idx",
        ] );

        if ( validateObj.error ) {
            console.log( validateObj.errKeys )
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            user,
            idx
        } = req.body;

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        let sendDoc = await SEND_DOC_TB.findOne( {
            where: { idx: idx }
        } )

        if ( !sendDoc ) {
            throw new Error( "제출 정보를 확인 할수없습니다." )
        }

        if ( sendDoc.userId == user.idx ) {
            // 본인
            let recommendList = await RECOMMED_TB
                .createQueryBuilder( "a" )
                .select( [
                    "a.*",
                    "b.name as creatorName",
                    "b.hp as creatorHp",
                    "c.name as userName"
                ] )
                .where( `a.idx IN (${sendDoc.recommendIds.toString()})` )
                .andWhere( `a.status = 2` )
                .leftJoin( USER_TB, "b", `b.idx = a.creatorId` )
                .leftJoin( USER_TB, "c", `c.idx = a.userId` )
                .getRawMany();

            resultData.data = {
                insaList: [],
                recommendList
            }
            res.send( resultData );
            return;
        }

        let myLink = await COMPANY_LINK_TB.find( {
            where: {
                userId: user.idx,
                level: In( [3, 9] )
            }
        } )

        if ( !myLink.map( v => v.comId ).includes( sendDoc.companyId ) ) {
            throw new Error( "확인 권한이 없습니다." )
        }

        let insaList = await INSA_TB
            .createQueryBuilder( "a" )
            .select( [
                "a.*",
                "b.name as creatorName",
                "b.hp as creatorHp",
                "c.name as userName"
            ] )
            .where( `a.idx = ${sendDoc.insaId}` )
            .andWhere( `a.status = 2` )
            .leftJoin( USER_TB, "b", `b.idx = a.creatorId` )
            .leftJoin( USER_TB, "c", `c.idx = a.userId` )
            .getRawMany();

        let recommendList = await RECOMMED_TB
            .createQueryBuilder( "a" )
            .select( [
                "a.*",
                "b.name as creatorName",
                "b.hp as creatorHp",
                "c.name as userName"
            ] )
            .where( `a.idx IN (${sendDoc.recommendIds.toString()})` )
            .andWhere( `a.status = 2` )
            .leftJoin( USER_TB, "b", `b.idx = a.creatorId` )
            .leftJoin( USER_TB, "c", `c.idx = a.userId` )
            .getRawMany();

        resultData.data = {
            insaList: insaList.map( v =>
            {
                v.evalData = JSON.parse( v.evalData )
                return v
            } ),
            recommendList
        }

        sendDoc.isView = true;
        await sendDoc.save();

        res.send( resultData )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

// 추천서 확인
router.post( "/recommendView", async ( req, res ) =>
{
    try {

        let validateObj = validate_object( req.body, [
            "idx",
        ] );

        if ( validateObj.error ) {
            console.log( validateObj.errKeys )
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            user,
            idx
        } = req.body;

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        let recommendData = await RECOMMED_TB.findOne( {
            where: {
                idx: idx,
                userId: user.idx,
            }
        } )

        if ( !recommendData ) {
            throw new Error( "작성된 추천서 정보가 없습니다." )
        }

        resultData.data = recommendData;
        res.send( resultData )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );


export default router