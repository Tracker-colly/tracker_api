import { Router } from "express"
import userRouter from "./user"
import { checkUser } from "../middleware";
import { devLog, validate_object } from "../../libs/util";
import { getUserDatasWithCom, makeSerial } from "../../libs/dataUtil";
import { COMPANY_TB } from "../../models/COMPANY_TB";
import { deleteFile, saveImage } from "../../libs/file";
import { COMPANY_LINK_TB } from "../../models/COMPANY_LINK_TB";
import { In, Not } from "typeorm";
import { USER_TB } from "../../models";
import { codeToStr, defaultDoc, RES_CODE } from "../../libs/config";
import { DefaultResult } from "../../libs/types";
import { INSA_DOC_TB } from "../../models/INSA_DOC_TB";
import { SEND_DOC_TB } from "../../models/SEND_DOC_TB";

const router = Router()
router.use( checkUser ); // 로그인 확인

// 메인 카드 리스트 가져오기
router.post( "/mainList", async ( req, res ) =>
{
    try {
        const { user } = req.body;

        // let linkList = await COMPANY_LINK_TB.find( {
        //     where: {
        //         userId: user.idx,
        //         level: In( [1, 2, 3, 5, 9] )
        //     }
        // } );
        let linkList = await COMPANY_LINK_TB.find( {
            where: {
                userId: user.idx,
                level: In( [2, 3, 9] )
            }
        } );

        devLog( "linkList length: " + linkList.length );

        let adminCard = { count: 0, profiles: [] };
        let staffCard = { count: 0, profiles: [] };
        let applicantCard = { count: 0, profiles: [] };

        for ( let link of linkList ) {
            console.log( "🚀 ~ link:", link.level )
            if ( [3, 9].includes( link.level ) ) {
                // 어드민
                adminCard.count += 1;
                let userDatas = await getUserDatasWithCom( link.comId )
                adminCard.profiles = adminCard.profiles.concat( userDatas.map( v => v.profile ) );
            } else if ( [2].includes( link.level ) ) {
                // 스탭
                staffCard.count += 1;
                let userDatas = await getUserDatasWithCom( link.comId )
                staffCard.profiles = staffCard.profiles.concat( userDatas.map( v => v.profile ) );
            } else if ( [1, 5].includes( link.level ) ) {
                // 어플리칸트
                // applicantCard.count += 1;
                // let userDatas = await getUserDatasWithCom( link.comId )
                // applicantCard.profiles = applicantCard.profiles.concat( userDatas.map( v => v.profile ) );
            }
        }

        let sendDocList = await SEND_DOC_TB.find( {
            where: {
                userId: user.idx,
                companyId: Not( In( linkList.map( v => v.comId ) ) )
            }
        } )

        for ( let sendDoc of sendDocList ) {
            applicantCard.count += 1;
            let userDatas = await getUserDatasWithCom( sendDoc.companyId )
            applicantCard.profiles = applicantCard.profiles.concat( userDatas.map( v => v.profile ) );
        }


        res.json( {
            code: 0,
            data: {
                adminCard,
                staffCard,
                applicantCard
            }
        } );

    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

// 어드민 카드 만들기
router.post( "/createCard", async ( req, res ) =>
{
    let saveCompanyId = 0;
    let deleteFiles: string[] = [];
    try {
        let validateObj = validate_object( req.body, [
            "name",
            "info",
            "url",
            "tel",
            "sido",
            "addr1",
            "addr2",
            "photo1",
        ] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            user,
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
        } = req.body

        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }

        let serial = await makeSerial();

        let companyData = COMPANY_TB.create( {
            userId: user.idx,
            serial: serial,
            name: name,
            url: url,
            tel: tel,
            info: info,
            sido: sido,
            address1: addr1,
            address2: addr2,
            share: typeof share == "boolean" ? share : false,
            link: typeof link == "boolean" ? link : false
        } );

        if ( typeof photo1 == "object" ) {
            let path1 = await saveImage( photo1 );
            companyData.photo1 = path1;
            deleteFiles.push( path1 )
        }
        if ( typeof photo2 == "object" ) {
            let path2 = await saveImage( photo2 );
            companyData.photo2 = path2;
            deleteFiles.push( path2 )
        }
        if ( typeof photo3 == "object" ) {
            let path3 = await saveImage( photo3 );
            companyData.photo3 = path3;
            deleteFiles.push( path3 )
        }

        devLog( companyData )
        let saveComData = await companyData.save();
        saveCompanyId = saveComData.idx;

        let linkData = COMPANY_LINK_TB.create( {
            comId: saveComData.idx,
            userId: user.idx,
            code: 9, // 대표자
            level: 9, // 오너
        } )

        await INSA_DOC_TB.create( {
            comId: saveComData.idx,
            evalData: defaultDoc,
        } ).save();

        devLog( linkData );
        await linkData.save();

        resultData.data = {
            name: saveComData.name,
            serial: saveComData.serial
        }
        res.send( resultData );
    } catch ( e ) {
        if ( saveCompanyId ) {
            COMPANY_TB.delete( saveCompanyId )
        }

        if ( deleteFiles.length > 0 ) {
            for ( let path of deleteFiles ) {
                let isDel = deleteFile( path )
            }
        }

        res.status( 500 ).send( e.message );
    }
} );

// 타입별 카드 목록
router.post( "/cardList", async ( req, res ) =>
{
    try {
        let resultData: DefaultResult = {
            code: RES_CODE.OK,
        }
        const {
            user,
            type,
        } = req.body;

        let levelArray = [];
        if ( type == "1" ) { // 어드민
            levelArray = [3, 9]
        } else if ( type == "2" ) { // 스탭
            levelArray = [2]
        } else if ( type == "3" ) {// 어플리칸트
            // levelArray = [1, 5]
            levelArray = [2, 3, 9]
        } else {
            throw new Error( "올바르지 않은 요청입니다." )
        }

        let linkList = await COMPANY_LINK_TB.find( {
            where: {
                userId: user.idx,
                level: In( levelArray )
            }
        } );

        if ( linkList.length <= 0 ) {
            resultData.data = [];
            res.json( resultData )
            return;
        }

        let ids = linkList.map( v => v.comId );

        let companyDatas = await COMPANY_TB
            .createQueryBuilder( "a" )
            .select( [
                "a.idx as idx",
                "a.name as name",
                "a.photo1 as photo1",
                "b.name as userName"
            ] )
            .leftJoin( USER_TB, "b", "a.userId = b.idx" )
            .where( "a.idx IN (" + ids.toString() + ")" )
            .getRawMany();

        if ( type == "3" ) {
            let resultDatas = []
            // for ( let comData of companyDatas ) {
            //     comData.isView = false;
            //     comData.sendDate = null;

            //     let findSendDoc = await SEND_DOC_TB.findOne( {
            //         where: {
            //             companyId: comData.idx,
            //             userId: user.idx,
            //         }
            //     } )

            //     if ( findSendDoc ) {
            //         comData.isView = findSendDoc.isView
            //         comData.sendDate = findSendDoc.createAt
            //     }
            //     resultDatas.push( comData )
            // }

            let findSendDocs = await SEND_DOC_TB.find( {
                where: {
                    companyId: Not( In( ids ) ),
                    userId: user.idx,
                }
            } )

            for ( let sendDoc of findSendDocs ) {
                let comData = await COMPANY_TB
                    .createQueryBuilder( "a" )
                    .select( [
                        "a.idx as idx",
                        "a.name as name",
                        "a.photo1 as photo1",
                        "b.name as userName"
                    ] )
                    .leftJoin( USER_TB, "b", "a.userId = b.idx" )
                    .where( "a.idx = :comidx", { comidx: sendDoc.companyId } )
                    .getRawOne();
                comData.isView = sendDoc.isView
                comData.sendDate = sendDoc.createAt
                resultDatas.push( comData )
            }

            companyDatas = resultDatas;
        } else {
            companyDatas = companyDatas.map( v =>
            {
                let linkInfo = linkList.find( link => link.comId == v.idx )
                if ( linkInfo ) {
                    v.level = linkInfo.code
                    v.levelName = codeToStr( linkInfo.code )
                } else {
                }
                return v;
            } )
        }

        resultData.data = companyDatas
        res.send( resultData );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} );

export default router;