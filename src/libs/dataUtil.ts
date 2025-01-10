import _ from "lodash";
import { USER_TB } from "../models";
import { COMPANY_TB } from "../models/COMPANY_TB";
import { COMPANY_LINK_TB } from "../models/COMPANY_LINK_TB";
import { In } from "typeorm";
import { INBOX_TB } from "../models/INBOX_TB";
import { AlarmType, InboxType } from "./types";
import { ALARM_TB } from "../models/ALARM_TB";

/**
 * 시리얼 만들기
 * 
 * info: 유저 및 회사에 등록된 시리얼 중복되지 않게 생성
 * @returns 
 */
export const makeSerial = async () =>
{
    let resultSerial = ""

    for ( ; ; ) {
        let makeSerial = _.random( 999999999 ).toString();
        makeSerial = _.padStart( makeSerial, 9, "0" );

        const dupleData1 = await USER_TB.findOne( { where: { serial: makeSerial } } );
        const dupleData2 = await COMPANY_TB.findOne( { where: { serial: makeSerial } } );

        if ( !dupleData1 && !dupleData2 ) {
            resultSerial = "#" + makeSerial;
            break;
        }
    }

    return resultSerial;
}

/**
 * 회사에 링크된 유저 조회
 * @param comId 회사 아이디
 * @returns 
 */
export const getUserDatasWithCom = async ( comId: number ) =>
{
    try {
        let linkUsers = await COMPANY_LINK_TB.find( {
            select: ["userId"],
            where: {
                comId: comId,
                level: In( [2, 3, 9] )
            },
            order: { code: "desc" }
        } )

        let userDatas = await USER_TB.find( {
            select: ["name", "profile"],
            where: {
                idx: In( linkUsers.map( v => v.userId ) ),
            }
        } )

        return userDatas
    } catch ( error ) {
        throw new Error( "유저 정보 조회 실패" )
    }
}

/*

추천서/인사평가 작성요청 

타입 1=추천서제출요청,2=인사평가제출요청,3=추천서작성요청,4=추천서작성완료,5=인사평가완료,/6=인사작성요청,7=추천제줄완료,8=인사제출완료

*/
export const saveInboxDoc = async ( type: InboxType, userId: number, target: number | string, itemId?: number ) =>
{
    try {
        let saveData = INBOX_TB.create( {
            type: type,
            userId: userId,
            itemId: itemId ? itemId : null
        } )

        if ( typeof target == "number" ) {
            saveData.targetId = target
        } else {
            saveData.targetEmail = target
        }

        await saveData.save();
    } catch ( e ) {
        console.log( "[saveInboxDoc] error", e );
        console.log( {
            userId: userId,
            target: target,
            itemId: itemId
        } )
    }
}

export const saveAlarm = async ( type: AlarmType, userId: number, targetId?: number ) =>
{
    try {
        let saveData = ALARM_TB.create( {
            type: type,
            userId: userId,
            targetId: targetId
        } )

        await saveData.save();
    } catch ( e ) {
        console.log( "[saveAlarm] error", e );
    }
}