import jwtUtil from "jsonwebtoken"

const secret = process.env.JWT_KEY;
const adminSecret = process.env.JWT_ADMIN_KEY;

export const sign = ( payload: string | Buffer | object ) =>
{
    return jwtUtil.sign( payload, secret, { // secret으로 sign하여 발급하고 return
        algorithm: 'HS256', // 암호화 알고리즘
    } );
}

export const adminSign = ( payload: string | Buffer | object ) =>
{
    return jwtUtil.sign( payload, adminSecret, {
        algorithm: 'HS256',
    } );
}

export const verifyToken = ( token: string ) =>
{
    let decoded = null
    try {
        decoded = jwtUtil.verify( token, secret );
        return decoded;
    } catch ( error ) {
        return null;
    }
}

export const refresh = () =>
{ // refresh token 발급
    return jwtUtil.sign( {}, secret, { // refresh token은 payload 없이 발급
        algorithm: 'HS256',
        expiresIn: '14d',
    } );
}

export const createToken = ( payload: string | Buffer | object ) =>
{ // 3분짜리 1회성 토큰 생성
    return jwtUtil.sign( payload, secret, {
        algorithm: 'HS256',
        expiresIn: '3m',
    } );
}