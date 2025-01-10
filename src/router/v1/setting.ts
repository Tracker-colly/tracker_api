import { Router } from "express"
import bcrypt from "bcrypt";

import userRouter from "./user"
import { checkUser } from "../middleware";
import { validate_object } from "../../libs/util";
import { DefaultResult } from "../../libs/types";
import { RES_CODE } from "../../libs/config";
import { POLICY_TB } from "../../models/POLICY_TB";
import { NOTICE_TB } from "../../models/NOTICE_TB";
import { FAQ_TB } from "../../models/FAQ_TB";
import { REPORT_TB } from "../../models/REPORT_TB";
import { USER_TB } from "../../models";
import { COMPANY_LINK_TB } from "../../models/COMPANY_LINK_TB";
import { SEND_DOC_TB } from "../../models/SEND_DOC_TB";
import { INSA_TB } from "../../models/INSA_TB";
import { RECOMMED_TB } from "../../models/RECOMMED_TB";
import { INBOX_TB } from "../../models/INBOX_TB";
import { ALARM_TB } from "../../models/ALARM_TB";

const router = Router()

// 약관 가져오기
router.post( "/term", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["type"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const { type } = req.body;

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        let policyData = await POLICY_TB.findOne( {
            where: {
                type: type
            }
        } )

        if ( !policyData ) {
            throw new Error( "정보를 가져올 수 없습니다." );
        }

        resultData.data = policyData;

        res.json( resultData );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

router.use( checkUser )
//탈퇴
router.post( "/delete", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, [
            "pass",
        ] );

        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            user,
            pass
        } = req.body;

        let findUser = await USER_TB.findOne( { where: { idx: user.idx } } );
        if ( !findUser ) {
            res.send( {
                code: RES_CODE.ACCESS_DENIED,
                message: "로그인 정보를 찾을 수 없습니다."
            } )
            return
        }

        let isPassCheck = bcrypt.compareSync( pass, findUser.password )
        console.log( "🚀 ~ isPassCheck:", isPassCheck, pass, findUser.password )

        if ( !isPassCheck ) {
            throw new Error( "비밀번호가 올바르지 않습니다." );
        }

        findUser.status = 9; //탈퇴 처리
        findUser.deletedAt = new Date();
        await findUser.save();

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


        res.send( true );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

// 푸쉬/링크 설정
router.post( "/radio", async ( req, res ) =>
{
    try {
        const {
            user,
            link,
            push
        } = req.body;

        if ( typeof link == "boolean" ) {
            user.link = link;
        }

        if ( typeof push == "boolean" ) {
            user.push = push;
        }

        await user.save();

        res.send( true );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );



// 공지
router.post( "/notice", async ( req, res ) =>
{
    try {
        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        let list = await NOTICE_TB.find( {
            where: { status: 1 },
            order: {
                idx: "desc"
            }
        } );

        resultData.data = list
        res.send( resultData )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

// 자주하는질문
router.post( "/faq", async ( req, res ) =>
{
    try {
        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        let list = await FAQ_TB.find( {
            order: {
                idx: "desc"
            }
        } );

        resultData.data = list
        res.send( resultData )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

// 문의목록
router.post( "/report", async ( req, res ) =>
{
    try {
        const {
            user
        } = req.body;

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        let list = await REPORT_TB.find( {
            where: {
                userId: user.idx,
            },
            order: {
                createAt: "desc"
            }
        } );

        resultData.data = list
        res.send( resultData )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

// 문의등록
router.post( "/addReport", async ( req, res ) =>
{
    try {
        const { user, title, info } = req.body;

        if ( !title || !info ) {
            throw new Error( "데이터를 입력해주세요." )
        }

        let saveData = REPORT_TB.create( {
            userId: user.idx,
            title: title,
            text: info,
        } )

        await saveData.save();
        res.send( true );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

export default router