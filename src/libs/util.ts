import bcrypt from "bcrypt";
import qs from "qs";
import crypto from "crypto";
import { Response } from "express"
import nodemailer from "nodemailer"


import _ from "lodash";
import axios from "axios";
import moment from "moment";

export const REGEXP = {
    number: new RegExp( /^[0-9]{6,20}$/ ),
    name: new RegExp( /^[ㄱ-ㅎ가-힣a-zA-Z0-9]{2,10}$/ ),
    email: new RegExp( /^[a-zA-Z0-9+-_.]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/ ),
    password: new RegExp( /^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[@$!%*#?&])[A-Za-z0-9@$!%*#?&]{8,15}$/ )
};

export const wait = ( num: number ) =>
{
    return new Promise( ( res ) =>
    {
        setTimeout( () =>
        {
            res( true );
        }, num );

    } );
};

export const devLog = ( msg: any ) =>
{
    let isLog = process.env.IS_LOG === "true"
    if ( isLog ) {
        console.log( msg )
    }
}

export function validate_object( obj: { [key: string]: any; }, checkList: string[] )
{
    let errKeys: string[] = [];
    for ( let key of checkList ) {
        let isSet = key in obj;
        if ( !isSet ) {
            errKeys.push( key );
        }
        else {
            if ( typeof obj[key] === "string" && obj[key] === "" )
                errKeys.push( key );
        }
    }

    return {
        error: ( errKeys.length > 0 ),
        checkList,
        errKeys
    };
}

export function createHashSha256( input: string ): string
{
    const sha = crypto.createHash( 'sha256' ).update( input ).digest( 'hex' );
    return sha
}

/**
 * 6자리 난수 생성
 * @returns 
 */
export function randAuthNumber()
{
    // return "123456";
    return String( Math.floor( Math.random() * 1000000 ) ).padStart( 6, "0" );
}

export function randAuthNumberForName()
{
    return "#" + String( Math.floor( Math.random() * 1000000 ) ).padStart( 6, "0" );
}

/**
 * 비밀번호 암호화
 * @param pass 
 * @returns 
 */
export function encryptePassword( pass: string )
{
    return bcrypt.hashSync( pass, 5 );
}

export const uuidv4 = () =>
{
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace( /[xy]/g, function ( c )
    {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : ( r & 0x3 | 0x8 );
        return v.toString( 16 );
    } );
}

export function encodeBase64( data: string )
{
    return Buffer.from( data ).toString( 'base64' );
}

export function decodeBase64( base64: string )
{
    return Buffer.from( base64, 'base64' ).toString( 'utf8' );
}

export function baseToByte( base64: string )
{
    return atob( base64.substring( base64.indexOf( ',' ) + 1 ) ).length;
}

export const sendSms = async ( hp: string, content: string ) =>
{

    const { ALIGO_KEY, ALIGO_ID, ALIGO_HP } = process.env;

    var api_url = 'https://apis.aligo.in/send/';
    var sender = new URLSearchParams( {
        key: ALIGO_KEY,
        user_id: ALIGO_ID,
        sender: ALIGO_HP,
        receiver: hp,
        msg: content,
    } )

    let result = "";

    await axios.post( api_url, sender ).then( ( res ) =>
    {
        result = res?.data?.result_code;
        if ( result != "1" ) {
            console.log( res?.data?.result_code, res?.data?.message )
        }
    } )

    return result;
};

export const sendEmail = ( address: string, title: string, message: string ) =>
{
    // console.log( "[sendEmail]:", message );
    // return true;
    return new Promise<Boolean>( async ( resolve, reject ) =>
    {
        try {
            // console.log( "message", message )
            // return true

            const transporter = nodemailer.createTransport( {
                service: "gmail",
                secure: false,
                auth: {
                    user: "manager@trackercolly.com",
                    pass: "uinnvbijnvxfnwci",
                },
            } );

            transporter.sendMail( {
                to: address, // list of receivers
                subject: title, // Subject line
                // text: "Hello world?", // plain text body
                html: message// html body
            }, ( err, info ) =>
            {
                if ( err ) {
                    console.log( "🚀 ~ err:", err )
                    resolve( false );
                    return;
                }

                console.log( info );
                resolve( true );
            } )
        } catch ( error ) {
            resolve( false );
        }
    } )
}