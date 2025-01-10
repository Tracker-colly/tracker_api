import { Router } from "express"
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import validator from "validator"
import DNS from "dns";

import * as jwtUtil from "../../libs/jwt";
import { encryptePassword, randAuthNumber, REGEXP, sendEmail, validate_object } from "../../libs/util";
import { USER_TB } from "../../models";
import { makeSerial } from "../../libs/dataUtil";
import { AuthNumType, RES_CODE } from "../../libs/config";
import { AUTH_NUM_TB } from "../../models/AUTH_NUM_TB";
import { checkUser } from "../middleware";
import { deleteFile, saveImage } from "../../libs/file";
import { INBOX_TB } from "../../models/INBOX_TB";
import { AlarmType, DefaultResult } from "../../libs/types";
import { ALARM_TB } from "../../models/ALARM_TB";

const router = Router()

// const checkDNS = ( domain: string ) =>
// {
//     DNS.resolveMx( "" )
// }
/**
 * 테스트
 */
router.get( "/test", ( req, res ) =>
{
    const { user } = req.body

    try {
        if ( !user ) {
            throw new Error( "로그인 에러" )
        }

        //유저 정보
        delete user.password;
        delete user.level;

        res.send( user );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

// 로그인
router.post( "/login", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["email", "pass"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const email = req.body.email;
        const pass = req.body.pass;

        if ( !REGEXP.email.test( email ) ) {
            throw new Error( "이메일 형식이 올바르지 않습니다." );
        }

        let findUser = await USER_TB.findOne( {
            where: {
                email,
                level: 1,
                status: 1
            }
        } );

        if ( !findUser ) {
            throw new Error( "회원정보를 찾을 수 없습니다." );
        }

        if ( findUser.status == 2 ) {
            throw new Error( "정지 회원입니다." );
        } else if ( findUser.status == 9 ) {
            throw new Error( "탈퇴 회원입니다." );
        }

        if ( bcrypt.compareSync( pass, findUser.password ) ) {
            let token = jwtUtil.sign( { id: findUser.idx } )
            res.send( token );
        } else {
            throw new Error( "비밀번호가 올바르지 않습니다." );
        }
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

// 인증번호 전송 (1회원가입, 2비번찾기, 3비번변경)
router.post( "/sendAuth", async ( req, res ) =>
{

    try {
        let validateObj = validate_object( req.body, ["type", "email"] );

        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            type,
            email
        } = req.body;


        let sendType = 0;

        let isEmail = validator.isEmail( email );
        if ( !isEmail ) {
            throw new Error( "이메일 정보가 올바르지 않습니다." );
        }

        if ( type == AuthNumType.registe ) {
            let duplUser = await USER_TB.findOne( {
                where: {
                    email: email
                }
            } )

            if ( duplUser ) {
                throw new Error( "이미 가입된 이메일입니다." );
            }

            sendType = AuthNumType.registe
        } else if ( type == AuthNumType.findPass ) {
            sendType = AuthNumType.findPass

            let findUser = await USER_TB.findOne( {
                where: {
                    email: email,
                }
            } )

            if ( !findUser ) {
                throw new Error( "가입된 정보가 없습니다." );
            }
        } else if ( type == AuthNumType.changePass ) {
            // 유저가 비밀번호 변경
            let user: USER_TB;
            try {
                const token = req.headers.authorization;
                let decoded = jwt.verify( token, process.env.JWT_KEY );
                if ( typeof decoded === "object" ) {
                    let idx = decoded?.id;

                    user = await USER_TB.findOne( { where: { idx: idx } } );
                    if ( !user ) {
                        res.send( {
                            code: RES_CODE.ACCESS_DENIED,
                            message: "로그인 정보를 찾을 수 없습니다."
                        } )
                        return
                    }
                } else {
                    res.send( {
                        code: RES_CODE.ACCESS_DENIED,
                        message: "로그인 정보를 찾을 수 없습니다."
                    } )
                    return
                }
            } catch ( e ) {
                throw new Error( "유저 정보를 확인 할 수 없습니다." )
            }
            if ( user.email != email ) {
                throw new Error( "가입된 정보와 일치하지 않습니다." );
            }

            sendType = AuthNumType.changePass
        }

        if ( !sendType ) {
            throw new Error( "올바르지 않은 요청입니다." )
        }

        let authNum = randAuthNumber();
        let isSend = await sendEmail( email, "[TRACKER] 인증번호", "인증번호: " + authNum );

        if ( !isSend ) {
            throw new Error( "이메일 전송 오류입니다." )
        }

        await AUTH_NUM_TB.create( {
            type: sendType,
            email: email,
            number: authNum
        } ).save();

        res.send( true );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

// 인증번호 체크
router.post( "/checkAuth", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["type", "email", "authNumber"] );

        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const { type, email, authNumber } = req.body;

        let authNumData = await AUTH_NUM_TB.findOne( {
            where: {
                email: email,
                type: type,
                state: 0,
            },
            order: { createAt: "DESC" }
        } );

        if ( !authNumData ) {
            throw new Error( "전송 내역을 찾을 수 없습니다." )
        }

        if ( authNumData.number != authNumber ) {
            throw new Error( "인증번호가 올바르지 않습니다." )
        }

        authNumData.state = 1;
        await authNumData.save();

        if ( type == AuthNumType.findPass ) {
            let findUser = await USER_TB.findOne( {
                where: {
                    email: email
                }
            } )

            if ( !findUser ) {
                throw new Error( "유저 정보가 없습니다." );
            }

            res.send( jwtUtil.createToken( { passIdx: findUser.idx } ) )
            return;
        }

        res.send( true );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

// 회원가입
router.post( "/registe", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, [
            "email", "pass",
            "name", "hp", "birth", "sex",
            "sido", "addr1", "addr2"
        ] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            email,
            pass,
            name,
            hp,
            birth,
            sex,
            sido,
            addr1,
            addr2
        } = req.body;

        //이메일 중복 체크
        let duplicateUser = await USER_TB.findOne( {
            where: [{ email: email, level: 1 }]
        } );

        if ( duplicateUser ) {
            throw new Error( "이미 가입된 이메일입니다." )
        }

        const serial = await makeSerial();

        let saveData = USER_TB.create( {
            email: email,
            password: pass,
            name: name,
            hp: hp,
            birth: birth,
            sex: sex,
            sido: sido,
            address1: addr1,
            address2: addr2,
            serial: serial
        } )

        await saveData.save();

        res.send( true );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

// 비밀번호 찾기 (비회원)
router.post( "/findPass", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["token", "pass1", "pass2"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            token,
            pass1,
            pass2,
        } = req.body;

        let decoded = jwtUtil.verifyToken( token );
        if ( !decoded ) {
            throw new Error( "인증 정보가 올바르지 않습니다." )
        }

        if ( !decoded.passIdx ) {
            throw new Error( "인증 정보가 올바르지 않습니다. (pi)" )
        }

        let userData = await USER_TB.findOne( {
            where: {
                idx: decoded.passIdx
            }
        } )

        if ( !userData ) {
            throw new Error( "유저 정보를 찾을 수 없습니다." )
        }

        if ( pass1 == pass2 ) {
            userData.password = encryptePassword( pass1 );
            await userData.save();
        } else {
            throw new Error( "비밀번호 확인이 올바르지 않습니다." )
        }

        res.send( true );

    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

// 비밀번호 변경 (유저 확인)
router.post( "/changePass", checkUser, async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["pass1", "pass2"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            user,
            pass1,
            pass2,
        } = req.body;

        if ( !user ) {
            throw new Error( "로그인이 필요합니다." )
        }

        let userData = await USER_TB.findOne( {
            where: {
                idx: user.idx
            }
        } )

        if ( !userData ) {
            throw new Error( "유저 정보를 찾을 수 없습니다." )
        }

        if ( pass1 == pass2 ) {
            userData.password = encryptePassword( pass1 );
            await userData.save();
        } else {
            throw new Error( "비밀번호 확인이 올바르지 않습니다." )
        }

        res.send( true );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

// 회원정보 (유저 확인)
router.post( "/info", checkUser, async ( req, res ) =>
{
    const { user } = req.body;

    try {
        let result = {
            code: RES_CODE.OK
        }

        let findUser = await USER_TB.findOne( {
            where: { idx: user.idx },
        } )

        if ( !findUser ) {
            throw new Error( "유저 정보를 가져올 수 없습니다." )
        }

        delete findUser.password
        delete findUser.memo

        let inboxCount = await INBOX_TB.count( {
            where: [
                { targetId: user.idx, view: false },
                { targetEmail: user.email, view: false },
            ]
        } )

        let alarmCount = await ALARM_TB.count( {
            where: {
                userId: user.idx,
                view: false
            }
        } );

        let resultData = {
            ...findUser,
            inboxCount: inboxCount,
            alarmCount: alarmCount
        }
        res.json( resultData );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

// 프로필 변경
router.post( "/editProfile", checkUser, async ( req, res ) =>
{
    try {
        const {
            user,
            profile,
        } = req.body;

        let result = {
            code: RES_CODE.OK
        }

        if ( !user ) {
            throw new Error( "로그인이 필요합니다." )
        }

        let findUser = await USER_TB.findOne( {
            where: { idx: user.idx },
        } )

        if ( !findUser ) {
            throw new Error( "유저 정보를 가져올 수 없습니다." )
        }

        if ( typeof profile == "object" ) {
            if ( findUser.profile ) {
                deleteFile( findUser.profile );
            }
            let path = await saveImage( profile );
            findUser.profile = path;
            await findUser.save();
        } else {
            throw new Error( "프로필 사진이 올바르지 않습니다." )
        }
        res.send( true );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

//휴대폰 번호 변경
router.post( "/editPhone", checkUser, async ( req, res ) =>
{
    try {
        const {
            user,
            hp,
        } = req.body;

        let result = {
            code: RES_CODE.OK
        }

        if ( !user ) {
            throw new Error( "로그인이 필요합니다." )
        }

        let findUser = await USER_TB.findOne( {
            where: { idx: user.idx },
        } )

        if ( !findUser ) {
            throw new Error( "유저 정보를 가져올 수 없습니다." )
        }

        findUser.hp = hp;
        await findUser.save();

        res.send( true );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

//주소변경
router.post( "/editAddr", checkUser, async ( req, res ) =>
{
    try {
        const {
            user,
            sido,
            addr1,
            addr2,
        } = req.body;


        if ( !user ) {
            throw new Error( "로그인이 필요합니다." )
        }

        let findUser = await USER_TB.findOne( {
            where: { idx: user.idx },
        } )

        if ( !findUser ) {
            throw new Error( "유저 정보를 가져올 수 없습니다." )
        }

        findUser.sido = sido;
        findUser.address1 = addr1;
        findUser.address2 = addr2;
        await findUser.save();

        res.send( true );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

// 유저 알람
router.post( "/alarm", checkUser, async ( req, res ) =>
{
    try {
        const { user } = req.body;

        let result: DefaultResult = {
            code: RES_CODE.OK
        }

        let alarmList = await ALARM_TB.find( {
            where: { userId: user.idx },
            order: { createAt: "desc" }
        } );

        let resultList = []

        for ( let alarm of alarmList ) {
            let pushData = { ...alarm, userName: "" };
            if ( !alarm.view ) {
                alarm.view = true;
                await alarm.save();
            }

            if ( alarm.type == AlarmType.reqlink ) {
                let userData = await USER_TB.findOne( {
                    select: ["name"],
                    where: { idx: alarm.targetId }
                } )
                pushData.userName = userData.name;
            }
            resultList.push( pushData );
        }

        // result.data = alarmList
        result.data = resultList

        res.json( result );
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

export default router