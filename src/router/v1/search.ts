import { Router } from "express"
import userRouter from "./user"
import { checkUser } from "../middleware";
import { USER_TB } from "../../models";
import { AlarmType, DefaultResult, InboxType } from "../../libs/types";
import { codeToStr, RES_CODE } from "../../libs/config";
import { COMPANY_TB } from "../../models/COMPANY_TB";
import { devLog, sendEmail, validate_object } from "../../libs/util";
import { COMPANY_LINK_TB } from "../../models/COMPANY_LINK_TB";
import { In, Like } from "typeorm";
import { INBOX_TB } from "../../models/INBOX_TB";
import { INSA_TB } from "../../models/INSA_TB";
import { saveAlarm, saveInboxDoc } from "../../libs/dataUtil";
import { RECOMMED_TB } from "../../models/RECOMMED_TB";
import { SEND_DOC_TB } from "../../models/SEND_DOC_TB";

const router = Router()
router.use( checkUser );

// 검색하기
router.post( "/", async ( req, res ) =>
{
    try {
        const {
            user,
            name,
            hp,
            email,
            serial,
        } = req.body;

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        let searchItemCount = 0;
        if ( name ) { searchItemCount += 1 }
        if ( hp ) { searchItemCount += 1 }
        if ( email ) { searchItemCount += 1 }
        if ( serial ) { searchItemCount += 1 }
        devLog( "🚀 ~ searchItemCount:" + searchItemCount )
        if ( searchItemCount < 2 ) {
            throw new Error( "두가지 이상의 검색란을 채워주세요." )
        }

        let findUser = await USER_TB.findOne( {
            where: {
                name: name ? name : undefined,
                hp: hp ? hp : undefined,
                email: email ? email : undefined,
                serial: serial ? "#" + serial : undefined,
                status: 1
            }
        } )

        let findCompanyList = await COMPANY_TB.find( {
            where: {
                name: Like( name ? "%" + name + "%" : undefined ),
                tel: hp ? hp : undefined,
                serial: serial ? "#" + serial : undefined,
                share: true,
            }
        } )

        if ( findUser ) {
            resultData.data = {
                type: "user",
                profile: findUser.profile,
                idx: findUser.idx,
                birth: findUser.birth,
                sex: findUser.sex,
                name: findUser.name,
                email: findUser.email,
                hp: findUser.hp,
                serial: findUser.serial
            };
        } else {
            if ( findCompanyList.length > 0 ) {
                resultData.data = {
                    type: "company",
                    list: findCompanyList.map( v =>
                    {
                        return {
                            idx: v.idx,
                            name: v.name,
                            photo: v.photo1
                        }
                    } )
                };
            } else {
                throw new Error( "검색 결과가 없습니다." )
            }
        }

        res.send( resultData );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

// 전체 회사 리스트
router.post( "/companyList", async ( req, res ) =>
{
    try {
        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        let companyList = await COMPANY_TB.find( {
            select: ["idx", "name"]
        } )
        resultData.data = companyList

        res.json( resultData );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

// 인사평가가 가능한 인물인지 검사
router.post( "/chekInsa", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, [
            "userId",
        ] );

        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            user,
            userId,
        } = req.body;

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        let myLink = await COMPANY_LINK_TB.find( {
            where: {
                userId: user.idx,
            },
            order: {
                createAt: "desc"
            },
        } )

        //평가자 링크 검색
        let userComIds = await COMPANY_LINK_TB.find( {
            select: ["comId"],
            where: {
                userId: userId,
                level: In( [3, 9] )
            }
        } )

        if ( userComIds.length <= 0 ) {
            throw new Error( "해당 멤버는 인사평가를 작성할 권한이 없습니다." )
        }

        let findUser = await USER_TB.findOne( {
            where: { idx: userId }
        } )

        let companyList = await COMPANY_TB.find( {
            select: ["idx", "name"],
            where: {
                idx: In( userComIds.map( v => v.comId ) )
            }
        } )

        resultData.data = {
            userInfo: {
                idx: findUser.idx,
                name: findUser.name,
                hp: findUser.hp
            },
            companyList: companyList
        }

        res.send( resultData );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

// 인사평가 작성요청
router.post( "/reqInsa", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, [
            "comId",
            "companyName",
            "userId",
            "startYear",
            "startMonth",
            "workType",
            "workLevel",
            "creatorWorkLevel",
        ] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            user,
            comId,
            companyName,
            userId,
            startYear,
            startMonth,
            endYear,
            endMonth,
            workType,
            workLevel,
            creatorWorkLevel,
        } = req.body;

        const dupleInsa = await INSA_TB.findOne( {
            where: {
                userId: user.idx,
                creatorId: userId
            }
        } );

        if ( dupleInsa ) {
            throw new Error( "이미 요청한 내역이 있습니다." )
        }

        let reqData = INSA_TB.create( {
            status: 1,
            userId: user.idx,
            creatorId: userId,
            companyId: comId,
            companyName: companyName,
            startYear: startYear,
            startMonth: startMonth,
            endYear: endYear ? endYear : null,
            endMonth: endMonth ? endMonth : null,
            workType: workType,
            workLevel: workLevel,
            evalData: [],
            creatorWorkLevel: creatorWorkLevel,
        } )

        let saveInsa = await reqData.save();

        await saveInboxDoc(
            InboxType.insaWrite,
            user.idx,
            userId,
            saveInsa.idx
        );

        res.send( true );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

// 추천서 작성 요청
router.post( "/reqRecommend", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, [
            "companyName",
            "userId",
            "startYear",
            "startMonth",
            "workType",
            "workLevel",
            "creatorWorkLevel",
        ] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            user,
            comId,
            companyName,
            userId,
            startYear,
            startMonth,
            endYear,
            endMonth,
            workType,
            workLevel,
            creatorWorkLevel,
        } = req.body;

        const dupleREC = await RECOMMED_TB.findOne( {
            where: {
                userId: user.idx,
                creatorId: userId
            }
        } );

        if ( dupleREC ) {
            console.log( "🚀 ~ dupleREC:", dupleREC )
            throw new Error( "이미 요청한 내역이 있습니다." )
        }

        let reqData = RECOMMED_TB.create( {
            status: 1,
            userId: user.idx,
            creatorId: userId,
            companyId: comId ? comId : null,
            companyName: companyName,
            startYear: startYear,
            startMonth: startMonth,
            endYear: endYear ? endYear : null,
            endMonth: endMonth ? endMonth : null,
            workType: workType,
            workLevel: workLevel,
            creatorWorkLevel: creatorWorkLevel,
        } )

        let saveRecommend = await reqData.save();

        await saveInboxDoc(
            InboxType.recommendWrite,
            user.idx,
            userId,
            saveRecommend.idx
        );

        await saveAlarm( AlarmType.recommend, userId, saveRecommend.idx );

        res.send( true );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

// 추천서 작성 요청 이메일
router.post( "/reqRecommendForEmail", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, [
            "companyName",
            "email",
            "startYear",
            "startMonth",
            "workType",
            "workLevel",
            "creatorWorkLevel",
        ] );

        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            user,
            comId,
            companyName,
            email,
            startYear,
            startMonth,
            endYear,
            endMonth,
            workType,
            workLevel,
            creatorWorkLevel,
        } = req.body;

        const dupleREC = await RECOMMED_TB.findOne( {
            where: {
                userId: user.idx,
                creatorEmail: email
            }
        } );

        if ( dupleREC ) {
            throw new Error( "이미 요청한 내역이 있습니다." )
        }

        let reqData = RECOMMED_TB.create( {
            status: 1,
            userId: user.idx,
            creatorEmail: email,
            companyId: comId ? comId : null,
            companyName: companyName,
            startYear: startYear,
            startMonth: startMonth,
            endYear: endYear ? endYear : null,
            endMonth: endMonth ? endMonth : null,
            workType: workType,
            workLevel: workLevel,
            creatorWorkLevel: creatorWorkLevel,
        } )

        let saveRecommend = await reqData.save();

        await saveInboxDoc(
            InboxType.recommendWrite,
            user.idx,
            email,
            saveRecommend.idx
        );

        sendEmail( email, "[TRACKER] 추천서 작성 요청", `${user.name}님의 추천서 작성요청이 있습니다. 트레커 콜리에 가입하여 진행 해주세요.` );

        res.send( true );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

// 평가 제출 요청
router.post( "/reqSubmit", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, [
            "userId",
        ] );

        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            user,
            userId,
            isInsa,
            isRecommend
        } = req.body;

        let myLink = await COMPANY_LINK_TB.find( {
            where: {
                userId: user.idx,
                level: In( [3, 9] )
            },
            order: {
                createAt: "desc"
            },
            take: 1
        } )

        if ( myLink.length <= 0 ) {
            throw new Error( "작성 요청 권한이 없습니다." )
        }

        if ( isInsa ) {
            await saveInboxDoc(
                InboxType.insaSubmit,
                user.idx,
                userId,
                myLink[0].comId,
            );
        }

        if ( isRecommend ) {
            await saveInboxDoc(
                InboxType.recommendSubmit,
                user.idx,
                userId,
                myLink[0].comId,
            );
        }

        await saveAlarm( AlarmType.senddoc, userId, myLink[0].comId );

        res.send( true );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

// 인사평가 / 추천서 리스트 (제출용)
router.post( "/formList", async ( req, res ) =>
{
    try {

        const {
            user
        } = req.body;

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        // let insaList = await INSA_TB.find( {
        //     where: {
        //         userId: user.idx,
        //         status: 2
        //     }
        // } )

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
            .leftJoin( USER_TB, "b", `b.idx = a.creatorId` )
            .getRawMany();

        // let recommendList = await RECOMMED_TB.find( {
        //     where: {
        //         userId: user.idx,
        //         status: 2
        //     }
        // } )

        let recommendList = await RECOMMED_TB
            .createQueryBuilder( "a" )
            .select( [
                "a.*",
                "b.name as creatorName",
            ] )
            .where( `a.userId = ${user.idx}` )
            .andWhere( `a.status = 2` )
            .leftJoin( USER_TB, "b", `b.idx = a.creatorId` )
            .getRawMany();

        resultData.data = {
            insaList: insaList.map( v =>
            {
                return {
                    idx: v.idx,
                    companyName: v.companyName,
                    creatorName: v.creatorName,
                    creatorLevel: v.creatorWorkLevel,
                    creatorLevelName: codeToStr( v.creatorWorkLevel ),
                    date: v.updateAt,
                }
            } ),
            recommendList
        }
        res.send( resultData );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

// 인사평가 / 추천서 제출
router.post( "/sendDoc", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, [
            "comId",
            "insaId",
            "recommendIds",
        ] );

        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            user,
            comId,
            insaId,
            recommendIds
        } = req.body;

        let myLink = await COMPANY_LINK_TB.findOne( {
            where: {
                userId: user.idx,
                comId: comId
            },
            order: {
                createAt: "desc"
            },
        } )

        let dupleData = await SEND_DOC_TB.findOne( {
            where: {
                userId: user.idx,
                companyId: comId,
            }
        } )

        let docData: SEND_DOC_TB;

        if ( dupleData ) {
            // throw new Error( "이미 제출한 이력이 있습니다." );
            // 서류제출은 링크 요청할 필요가 없음
            // if ( myLink ) {
            //     if ( [4].includes( myLink.level ) ) {
            //         myLink.level = 5;
            //         await myLink.save();
            //     }
            // } else {
            //     let linkData = COMPANY_LINK_TB.create( {
            //         comId: comId,
            //         userId: user.idx,
            //         code: 1, // 사원
            //         level: 1, // 요청
            //     } )
            //     await linkData.save();
            // }

            dupleData.insaId = insaId
            dupleData.recommendIds = recommendIds
            await dupleData.save();
            docData = dupleData
        } else {
            // 서류제출은 링크 요청할 필요가 없음
            // if ( myLink ) {
            //     if ( [4].includes( myLink.level ) ) {
            //         myLink.level = 5;
            //         await myLink.save();
            //     }
            // } else {
            //     let linkData = COMPANY_LINK_TB.create( {
            //         comId: comId,
            //         userId: user.idx,
            //         code: 1, // 사원
            //         level: 1, // 요청
            //     } )
            //     await linkData.save();
            // }


            let saveData = SEND_DOC_TB.create( {
                userId: user.idx,
                companyId: comId,
                insaId: insaId,
                recommendIds: recommendIds,
            } )

            const saveDoc = await saveData.save();
            docData = saveDoc
        }

        let adminUsers = await COMPANY_LINK_TB.find( {
            where: {
                comId: comId,
                level: In( [3, 9] )
            }
        } )

        for ( let adminUser of adminUsers ) {
            await saveInboxDoc( InboxType.insaSubmitDone, user.idx, adminUser.userId, docData.idx )
        }

        res.send( true );
    } catch ( e ) {
        console.log( "🚀 ~ e:", e )
        res.status( 500 ).send( e.message );
    }
} )

export default router