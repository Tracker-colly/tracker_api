import { Router } from "express"
import bcrypt from "bcrypt";
import { encryptePassword, validate_object } from "../../libs/util";
import * as jwtUtil from "../../libs/jwt";
import { ADMIN_USER_TB } from "../../models/ADMIN_USER_TB";
import { checkAdmin } from "../middleware";
import { DefaultResult } from "../../libs/types";
import { RES_CODE } from "../../libs/config";
import { In } from "typeorm";

const router = Router()

//로그인
router.post( "/login", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["account", "pass"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const account = req.body.email;
        const pass = req.body.pass;

        let findUser = await ADMIN_USER_TB.findOne( {
            where: {
                account,
                status: 1
            }
        } );

        if ( !findUser ) {
            throw new Error( "아이디 또는 비밀번호를 확인해 주세요." );
        }

        if ( bcrypt.compareSync( pass, findUser.password ) ) {
            let token = jwtUtil.adminSign( { id: findUser.idx } )
            res.send( token );
        } else {
            throw new Error( "아이디 또는 비밀번호를 확인해 주세요." );
        }
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

// 로그인 체크
router.use( checkAdmin );

// 관리자 리스트
router.post( "/list", async ( req, res ) =>
{
    try {
        const {
            user,
        } = req.body;

        let resultData: DefaultResult = {
            code: RES_CODE.OK
        }

        let findList = await ADMIN_USER_TB.find( {
            where: {
                status: 1,
            }
        } );

        let userList = findList.map( ( v, index ) =>
        {
            delete v.password
            return {
                ...v,
                number: index + 1,
                isMy: v.idx == user.idx
            };
        } )
        resultData.data = userList;

        res.send( resultData )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

// 관리자 추가
router.post( "/add", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["account", "name", "pass1", "pass2", "hp", "email"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            account,
            name,
            pass1,
            pass2,
            hp,
            email
        } = req.body;

        let duplicate = await ADMIN_USER_TB.count( {
            where: { account: account }
        } )

        if ( duplicate ) {
            throw new Error( "아이디가 중복 되었습니다." )
        }

        if ( pass1 != pass2 ) {
            throw new Error( "비밀번호 확인이 잘못되었습니다." )
        }

        let saveData = ADMIN_USER_TB.create( {
            account: account,
            name: name,
            password: pass1,
            hp: hp,
            email: email,
        } )

        await saveData.save();

        res.send( true )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

// 관리자 수정
router.post( "/edit", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["account", "name", "hp", "email"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const {
            account,
            name,
            pass1,
            pass2,
            hp,
            email
        } = req.body;

        let findUser = await ADMIN_USER_TB.findOne( {
            where: { account: account }
        } )

        if ( !findUser ) {
            throw new Error( "유저 정보를 확인할 수 없습니다." )
        }

        findUser.name = name;
        findUser.hp = hp
        findUser.email = email

        if ( pass1 ) {
            if ( pass1 != pass2 ) {
                throw new Error( "비밀번호 확인이 잘못되었습니다." )
            }

            findUser.password = encryptePassword( pass1 );
        }

        await findUser.save();

        res.send( true )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

// 관리자 삭제
router.post( "/delete", async ( req, res ) =>
{
    try {
        let validateObj = validate_object( req.body, ["ids"] );
        if ( validateObj.error ) {
            throw new Error( "올바르지 않은 요청입니다." );
        }

        const { ids } = req.body

        let findUsers = await ADMIN_USER_TB.find( {
            where: {
                idx: In( ids )
            }
        } )

        for ( let user of findUsers ) {
            user.status = 9; //삭제 처리
            await user.save();
        }

        res.send( true )
    } catch ( e ) {
        res.status( 500 ).send( e.message );
    }
} )

export default router