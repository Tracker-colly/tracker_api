import { Router } from "express"
import userRouter from "./user"
import { checkUser } from "../middleware";
import { validate_object } from "../../libs/util";
import { COMPANY_TB } from "../../models/COMPANY_TB";
import { AlarmType, DefaultResult } from "../../libs/types";
import { codeToStr, OptionData, RES_CODE } from "../../libs/config";
import { COMPANY_LINK_TB } from "../../models/COMPANY_LINK_TB";
import { deleteFile, saveImage } from "../../libs/file";
import { INSA_DOC_TB } from "../../models/INSA_DOC_TB";
import { USER_TB } from "../../models";
import { In } from "typeorm";
import { SEND_DOC_TB } from "../../models/SEND_DOC_TB";
import { saveAlarm } from "../../libs/dataUtil";

const router = Router()

router.use( checkUser );

// 회사정보
router.post( "/info", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["comId"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            user,
            comId,
        } = req.body;

        if ( !comId ) {

        }

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        let companyData = await COMPANY_TB.findOne( {
            where: {
                idx: comId
            }
        } )

        if ( !companyData ) {
            throw new Error( "회사정보를 찾을 수 없습니다." );
        }

        let myLink = await COMPANY_LINK_TB.findOne( {
            where: { userId: user.idx, comId: comId }
        } )

        let sendDoc = await SEND_DOC_TB.findOne( {
            where: { companyId: comId }
        } )

        resultData.data = {
            ...companyData,
            // isAdmin: myLink ? [3, 9].includes( myLink.level ) : false,
            isAdmin: myLink ? [9].includes( myLink.level ) : false,
            // isStaff: myLink ? [2].includes( myLink.level ) : false,
            isStaff: myLink ? [2, 3].includes( myLink.level ) : false,
            // isReq: myLink ? [1].includes( myLink.level ) : false
            isReq: sendDoc ? true : false
        };

        res.send( resultData );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

// 회사에 제출한 지원서 확인
router.post( "/myDocCheck", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["comId"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            user,
            comId,
        } = req.body;

        if ( !comId ) {

        }

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        let companyData = await COMPANY_TB.findOne( {
            where: {
                idx: comId
            }
        } )

        if ( !companyData ) {
            throw new Error( "회사정보를 찾을 수 없습니다." );
        }

        let sendDockData = await SEND_DOC_TB.findOne( {
            where: {
                userId: user.idx,
                companyId: comId
            }
        } )

        console.log( "🚀 ~ sendDockData:", sendDockData )
        resultData.data = sendDockData;
        res.send( resultData );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

// 회사 정보 수정
router.post( "/edit", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["comId", "photo1"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            user,
            comId,
            name,
            info,
            url,
            tel,
            sido,
            addr1,
            addr2,
            photo1,
            photo2,
            photo3,
            share,
            link,
        } = req.body;

        let myLink = await COMPANY_LINK_TB.findOne( {
            where: {
                userId: user.idx,
                comId: comId
            }
        } )

        if ( !myLink ) {
            throw new Error( "링크 정보를 찾을 수 없습니다." );
        }

        if ( ![3, 9].includes( myLink.level ) ) {
            console.log( "mylevel", myLink.level )
            throw new Error( "수정 권한이 없습니다." );
        }

        let companyData = await COMPANY_TB.findOne( {
            where: {
                idx: comId
            }
        } )

        if ( !companyData ) {
            throw new Error( "회사정보를 찾을 수 없습니다." );
        }

        if ( name ) { companyData.name = name }
        if ( info ) { companyData.info = info }
        if ( url ) { companyData.url = url }
        if ( tel ) { companyData.tel = tel }
        if ( sido ) { companyData.sido = sido }
        if ( addr1 ) { companyData.address1 = addr1 }
        if ( addr2 ) { companyData.address2 = addr2 }

        if ( typeof photo1 == "object" ) {
            let photo1path = await saveImage( photo1 );
            deleteFile( companyData.photo1 );
            companyData.photo1 = photo1path;
        }

        if ( photo2 ) {
            if ( typeof photo2 == "object" ) {
                console.log( "등록2" )
                let photo2path = await saveImage( photo2 );
                deleteFile( companyData.photo2 );
                companyData.photo2 = photo2path;
            }
        } else {
            if ( companyData.photo2 ) {
                deleteFile( companyData.photo2 )
                companyData.photo2 = null
            }
        }

        if ( photo3 ) {
            if ( typeof photo3 == "object" ) {
                console.log( "등록2" )
                let photo3path = await saveImage( photo3 );
                deleteFile( companyData.photo3 );
                companyData.photo3 = photo3path;
            }
        } else {
            if ( companyData.photo3 ) {
                deleteFile( companyData.photo3 )
                companyData.photo3 = null
            }
        }

        if ( typeof share == "boolean" ) {
            companyData.share = share
        }
        if ( typeof link == "boolean" ) {
            companyData.link = link
        }

        await companyData.save();

        res.send( true );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );
// 양식 보기
router.post( "/getDoc", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["comId"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            user,
            comId
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

        if ( ![3, 9].includes( myLink.level ) ) {
            throw new Error( "수정 권한이 없습니다." );
        }

        let docData = await INSA_DOC_TB.findOne( {
            where: {
                comId: comId
            }
        } )

        if ( !docData ) {
            throw new Error( "양식 정보를 가져올 수 없습니다." )
        }

        resultData.data = docData
        res.send( resultData )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );
// 양식 수정
router.post( "/editDoc", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["comId", "editData"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            user,
            comId,
            editData,
        } = req.body;

        let myLink = await COMPANY_LINK_TB.findOne( {
            where: {
                userId: user.idx,
                comId: comId
            }
        } )

        if ( !myLink ) {
            throw new Error( "링크 정보를 찾을 수 없습니다." );
        }

        if ( ![3, 9].includes( myLink.level ) ) {
            throw new Error( "수정 권한이 없습니다." );
        }

        let docData = await INSA_DOC_TB.findOne( {
            where: {
                comId: comId
            }
        } )

        if ( !docData ) {
            throw new Error( "양식 정보를 가져올 수 없습니다." )
        }
        if ( editData ) {
            docData.evalData = editData;
        } else {
            throw new Error( "수정 데이터가 올바르지 않습니다." )
        }

        await docData.save();

        res.send( true )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );
//멤버 리스트
router.post( "/memberList", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["comId"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        const {
            user,
            comId,
        } = req.body;

        let myLink = await COMPANY_LINK_TB.findOne( {
            where: {
                userId: user.idx,
                comId: comId,
                level: In( [2, 3, 9] )
            }
        } )

        if ( !myLink ) {
            throw new Error( "링크 정보를 찾을 수 없습니다." );
        }

        // comId, level 순으로 정렬
        let LinkUsers = await COMPANY_LINK_TB
            .createQueryBuilder( "a" )
            .select( [
                "a.idx as idx",
                "a.comId as comId",
                "a.code as code",
                "a.level as level",
                "b.idx as userId",
                "b.name as userName",
                "b.profile as userProfile"
            ] )
            .leftJoin( USER_TB, "b", "a.userId = b.idx" )
            .where( "a.comId = " + comId )
            .andWhere( "a.level IN (2,3,9)" )
            .orderBy( "level", "DESC" )
            .orderBy( "code", "DESC" )
            .getRawMany();

        LinkUsers = LinkUsers.map( v =>
        {
            return {
                ...v,
                codeName: codeToStr( v.code ),
                isMy: v.userId == user.idx,
            }
        } )

        resultData.data = {
            // isEdit: [3, 9].includes( myLink.level ),
            isEdit: [9].includes( myLink.level ),
            list: LinkUsers
        }
        res.send( resultData );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

//링크 요청 리스트 (관리자만)
router.post( "/linkList", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["comId"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        const {
            user,
            comId,
        } = req.body;

        let myLink = await COMPANY_LINK_TB.findOne( {
            where: {
                userId: user.idx,
                comId: comId,
            }
        } )

        if ( !myLink ) {
            throw new Error( "링크 정보를 찾을 수 없습니다." );
        }

        if ( ![3, 9].includes( myLink.level ) ) {
            throw new Error( "수정 권한이 없습니다." );
        }
        // comId, level 순으로 정렬

        let LinkUsers = await COMPANY_LINK_TB
            .createQueryBuilder( "a" )
            .select( [
                "a.idx as idx",
                "a.comId as comId",
                "a.code as code",
                "a.level as level",
                "a.createAt as createAt",
                "b.idx as userId",
                "b.name as userName",
                "b.profile as userProfile"
            ] )
            .leftJoin( USER_TB, "b", "a.userId = b.idx" )
            .where( "a.comId = " + comId )
            .andWhere( "a.level IN (1,5)" )
            .orderBy( "createAt", "DESC" )
            .getRawMany();

        resultData.data = {
            list: LinkUsers
        }
        res.send( resultData );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

//유저 권한 설정(관리자만)
router.post( "/editUserAuth", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["comId"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        const {
            user,
            comId,
            userId,
            code,
            level
        } = req.body;

        let myLink = await COMPANY_LINK_TB.findOne( {
            where: {
                userId: user.idx,
                comId: comId,
            }
        } )

        if ( !myLink ) {
            throw new Error( "링크 정보를 찾을 수 없습니다." );
        }

        // if ( ![3, 9].includes( myLink.level ) ) {
        if ( ![9].includes( myLink.level ) ) {
            throw new Error( "수정 권한이 없습니다." );
        }
        // comId, level 순으로 정렬

        let LinkUsers = await COMPANY_LINK_TB.findOne( {
            where: {
                comId: comId,
                userId: userId
            }
        } )

        if ( !LinkUsers ) {
            throw new Error( "멤버정보를 찾을 수 없습니다." );
        }

        if ( !OptionData.codes.map( v => v.id ).includes( code ) ) {
            throw new Error( "설정 직책이 올바르지 않습니다." );
        }

        if ( ![2, 3].includes( level ) ) {
            throw new Error( "설정 권한이 올바르지 않습니다." );
        }

        LinkUsers.code = code;
        LinkUsers.level = level;
        await LinkUsers.save();

        res.send( true );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

// 멤버 삭제 (관리자)
router.post( "/unLink", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["comId"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        const {
            user,
            comId,
            userIds,
        } = req.body;

        let myLink = await COMPANY_LINK_TB.findOne( {
            where: {
                userId: user.idx,
                comId: comId,
            }
        } )

        if ( !myLink ) {
            throw new Error( "링크 정보를 찾을 수 없습니다." );
        }

        // if ( ![3, 9].includes( myLink.level ) ) {
        if ( ![9].includes( myLink.level ) ) {
            throw new Error( "수정 권한이 없습니다." );
        }
        // comId, level 순으로 정렬

        let LinkUsers = await COMPANY_LINK_TB.find( {
            where: {
                comId: comId,
                userId: In( userIds ),
                level: In( [2, 3] )
            }
        } )

        for ( let link of LinkUsers ) {
            try {
                // 링크 헤제 상태로 변경
                link.level = 4
                link.deleteAt = new Date();
                await link.save();
            } catch ( e ) {
                // 필요시 링크 수정 에러처리
            }
        }
        res.send( true );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

// 멤버 탈퇴 (개인)
router.post( "/unLinkMember", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["comId"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        const {
            user,
            comId,
        } = req.body;

        let myLink = await COMPANY_LINK_TB.findOne( {
            where: {
                userId: user.idx,
                comId: comId,
            }
        } )

        if ( !myLink ) {
            throw new Error( "링크 정보를 찾을 수 없습니다." );
        }

        myLink.level = 4
        myLink.deleteAt = new Date();
        await myLink.save();

        res.send( true );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

//링크 요청
router.post( "/reqLink", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["comId"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        const {
            user,
            comId,
        } = req.body;

        let companyData = await COMPANY_TB.findOne( {
            where: { idx: comId }
        } )

        if ( !companyData ) {
            throw new Error( "회사정보를 확인할 수 없습니다." )
        }

        if ( !companyData.link ) {
            throw new Error( "링크요청 거부상태 입니다." )
        }

        let myLink = await COMPANY_LINK_TB.findOne( {
            where: {
                userId: user.idx,
                comId: comId,
            }
        } )

        if ( myLink ) {
            if ( myLink.level == 4 ) {
                myLink.level = 5;
                await myLink.save();
                res.send( true );
                return;
            } else {
                throw new Error( "이미 링크(또는 요청)된 상태입니다." );
            }
        }

        let linkData = COMPANY_LINK_TB.create( {
            comId: comId,
            userId: user.idx,
            code: 1, // 사원
            level: 1, // 요청
        } )

        await linkData.save();

        saveAlarm( AlarmType.reqlink, companyData.userId, user.idx );

        res.send( true );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

// 멤버 링크 수락 (관리자)
router.post( "/addLink", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["comId", "userIds"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            user,
            comId,
            userIds,
        } = req.body;

        let myLink = await COMPANY_LINK_TB.findOne( {
            where: {
                userId: user.idx,
                comId: comId,
            }
        } )

        if ( !myLink ) {
            throw new Error( "링크 정보를 찾을 수 없습니다." );
        }

        // if ( ![3, 9].includes( myLink.level ) ) {
        if ( ![9].includes( myLink.level ) ) {
            throw new Error( "수정 권한이 없습니다." );
        }
        // 링크 유저 검색
        let LinkUsers = await COMPANY_LINK_TB.find( {
            where: {
                comId: comId,
                userId: In( userIds ),
                level: In( [1, 5] ),
            }
        } )

        if ( LinkUsers.length <= 0 ) {
            throw new Error( "링크요청된 유저가 없습니다." );
        }

        for ( let link of LinkUsers ) {
            try {
                if ( link.level == 1 ) {
                    // 링크 수락 상태(스탭)로 변경 
                    link.level = 2
                    await link.save();
                } else if ( link.level == 5 ) {
                    // 재요청
                    link.level = 2
                    link.deleteAt = null;
                    await link.save();
                }
            } catch ( e ) {
                // 필요시 링크 수정 에러처리
            }
        }
        for ( let userId of userIds ) {
            saveAlarm( AlarmType.link, userId, comId );
        }

        res.send( true );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

// 멤버 링크 거절 (관리자)
router.post( "/delLink", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["comId", "userIds"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            user,
            comId,
            userIds,
        } = req.body;

        let myLink = await COMPANY_LINK_TB.findOne( {
            where: {
                userId: user.idx,
                comId: comId,
            }
        } )

        if ( !myLink ) {
            throw new Error( "링크 정보를 찾을 수 없습니다." );
        }

        // if ( ![3, 9].includes( myLink.level ) ) {
        if ( ![9].includes( myLink.level ) ) {
            throw new Error( "수정 권한이 없습니다." );
        }
        // 링크 유저 검색
        let LinkUsers = await COMPANY_LINK_TB.find( {
            where: {
                comId: comId,
                userId: In( userIds )
            }
        } )

        if ( LinkUsers.length <= 0 ) {
            throw new Error( "링크요청된 유저가 없습니다." );
        }

        for ( let link of LinkUsers ) {
            if ( link.level == 1 ) { // 신규 요청일 경우
                await link.remove();
            } else if ( link.level == 5 ) { // 재요청일 경우
                link.level = 4;
                await link.save();
            }
        }

        for ( let userId of userIds ) {
            saveAlarm( AlarmType.unlink, userId, comId );
        }

        res.send( true );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

export default router